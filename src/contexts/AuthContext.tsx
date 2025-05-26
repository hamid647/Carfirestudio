
"use client";

import type { Role, User, BillingChangeRequest, WashRecord, NotificationRecord, Service } from '@/types';
import { INITIAL_SERVICES } from '@/config/services';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  billingRequests: BillingChangeRequest[];
  addBillingRequest: (request: Omit<BillingChangeRequest, 'id' | 'requestedAt' | 'status' | 'staffId' | 'staffName'>) => Promise<void>;
  updateBillingRequestStatus: (requestId: string, status: 'approved' | 'rejected') => Promise<void>;
  washRecords: WashRecord[];
  addWashRecord: (recordData: Omit<WashRecord, 'washId' | 'createdAt'>) => Promise<void>;
  updateWashRecord: (washId: string, updatedData: Partial<Omit<WashRecord, 'washId' | 'createdAt'>>) => Promise<void>;
  deleteWashRecord: (washId: string) => Promise<void>;
  notifications: NotificationRecord[];
  addNotification: (notificationData: Omit<NotificationRecord, 'id' | 'timestamp'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getUnreadNotificationCount: () => number;
  services: Service[];
  addService: (serviceData: Omit<Service, 'id'>) => Promise<void>;
  updateService: (serviceId: string, updatedData: Partial<Omit<Service, 'id'>>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// MOCK_OWNER_FOR_NOTIFICATIONS can be used if notifications need to target an owner ID
// For now, notifications will just store a roleTarget or a userId if currentUser exists.
const MOCK_OWNER_ID_FOR_NOTIFICATIONS = 'owner-001'; // A placeholder ID

const convertFirestoreTimestamp = (data: any) => {
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      convertFirestoreTimestamp(data[key]); // Recursively convert nested objects
    }
  }
  return data;
};


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [billingRequests, setBillingRequests] = useState<BillingChangeRequest[]>([]);
  const [washRecords, setWashRecords] = useState<WashRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user from localStorage (mock auth)
  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem('currentUser');
      if (storedUserJson) {
        const storedUser: User = JSON.parse(storedUserJson);
        if (storedUser && storedUser.token) {
          setCurrentUser(storedUser);
        } else {
          localStorage.removeItem('currentUser');
        }
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem('currentUser');
    }
    // Data loading will happen in separate useEffects after Firestore is ready
  }, []);

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Services
        const servicesQuery = query(collection(db, "services"), orderBy("name"));
        const servicesSnapshot = await getDocs(servicesQuery);
        let fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        if (fetchedServices.length === 0) {
          // If no services in DB, populate with initial and save them
          for (const service of INITIAL_SERVICES) {
            const { id, ...serviceData } = service; // Firestore generates ID
            const docRef = await addDoc(collection(db, "services"), serviceData);
            fetchedServices.push({ ...serviceData, id: docRef.id } as Service);
          }
        }
        setServices(fetchedServices.map(s => convertFirestoreTimestamp(s)));

        // Fetch Wash Records
        const washRecordsQuery = query(collection(db, "washRecords"), orderBy("createdAt", "desc"));
        const washRecordsSnapshot = await getDocs(washRecordsQuery);
        setWashRecords(washRecordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), washId: doc.id } as WashRecord)).map(r => convertFirestoreTimestamp(r)));
        
        // Fetch Billing Requests
        const billingRequestsQuery = query(collection(db, "billingRequests"), orderBy("requestedAt", "desc"));
        const billingRequestsSnapshot = await getDocs(billingRequestsQuery);
        setBillingRequests(billingRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillingChangeRequest)).map(br => convertFirestoreTimestamp(br)));

        // Fetch Notifications (specific to user or role if currentUser is available)
        if (currentUser) {
            const userNotificationsQuery = query(
                collection(db, "notifications"), 
                where("userId", "==", currentUser.id),
                orderBy("timestamp", "desc")
            );
            const roleNotificationsQuery = query(
                collection(db, "notifications"), 
                where("roleTarget", "==", currentUser.role),
                orderBy("timestamp", "desc")
            );
            
            const [userNotifsSnap, roleNotifsSnap] = await Promise.all([
                getDocs(userNotificationsQuery),
                getDocs(roleNotificationsQuery)
            ]);

            const combinedNotifications = new Map<string, NotificationRecord>();
            userNotifsSnap.docs.forEach(doc => combinedNotifications.set(doc.id, { id: doc.id, ...doc.data() } as NotificationRecord));
            roleNotifsSnap.docs.forEach(doc => combinedNotifications.set(doc.id, { id: doc.id, ...doc.data() } as NotificationRecord));
            
            setNotifications(Array.from(combinedNotifications.values()).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(n => convertFirestoreTimestamp(n)));
        } else {
             // If no user, fetch only role-based notifications for owner (e.g., for initial display if needed)
            const ownerRoleNotificationsQuery = query(
                collection(db, "notifications"), 
                where("roleTarget", "==", "owner"), // Example: fetch owner notifications
                orderBy("timestamp", "desc")
            );
            const ownerNotifsSnap = await getDocs(ownerRoleNotificationsQuery);
            setNotifications(ownerNotifsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationRecord)).map(n => convertFirestoreTimestamp(n)));
        }


      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        // Fallback to initial services if DB fetch fails and services are empty
        if (services.length === 0) setServices(INITIAL_SERVICES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Re-fetch notifications when currentUser changes

  const login = useCallback((userData: User) => {
    if (userData && userData.token) {
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } else {
      console.error("Login attempt with invalid user data or missing token:", userData);
    }
    setIsLoading(false); // Ensure loading is false after login attempt
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setNotifications([]); // Clear notifications on logout
    setIsLoading(false);
  }, []);

  const addNotification = useCallback(async (notificationData: Omit<NotificationRecord, 'id' | 'timestamp'>) => {
    try {
      const newNotificationData = {
        ...notificationData,
        timestamp: serverTimestamp(), // Use server timestamp
        read: false, // Ensure 'read' is explicitly set
      };
      const docRef = await addDoc(collection(db, "notifications"), newNotificationData);
      // Optimistically update UI or re-fetch, for simplicity re-fetching might be okay for now
      // Or, create the NotificationRecord client-side with the new ID and current client time for immediate UI update
       const addedNotification = { ...notificationData, id: docRef.id, timestamp: new Date().toISOString(), read: false };
       setNotifications(prev => [addedNotification, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    } catch (error) {
      console.error("Error adding notification: ", error);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const notifRef = doc(db, "notifications", notificationId);
      await updateDoc(notifRef, { read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  }, []);
  
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!currentUser) return;
    const unreadNotifs = notifications.filter(n => (n.userId === currentUser.id || n.roleTarget === currentUser.role) && !n.read);
    try {
      const batch = []; // Firestore batch write would be better here if many updates
      for (const notif of unreadNotifs) {
        batch.push(updateDoc(doc(db, "notifications", notif.id), { read: true }));
      }
      await Promise.all(batch);
      setNotifications(prev => prev.map(n => (n.userId === currentUser.id || n.roleTarget === currentUser.role) && !n.read ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marking all notifications as read: ", error);
    }
  }, [currentUser, notifications]);


  const getUnreadNotificationCount = useCallback(() => {
    if (!currentUser) return 0;
    return notifications.filter(n => (n.userId === currentUser.id || n.roleTarget === currentUser.role) && !n.read).length;
  }, [notifications, currentUser]);

  const addBillingRequest = useCallback(async (requestData: Omit<BillingChangeRequest, 'id' | 'requestedAt' | 'status' | 'staffId' | 'staffName'>) => {
    if (!currentUser || currentUser.role !== 'staff') {
      console.error("Only staff can add billing requests.");
      return;
    }
    try {
      const newRequestData = {
        ...requestData,
        staffId: currentUser.id,
        staffName: currentUser.username,
        requestedAt: serverTimestamp(),
        status: 'pending' as 'pending',
      };
      const docRef = await addDoc(collection(db, "billingRequests"), newRequestData);
      const addedRequest = { ...requestData, id: docRef.id, staffId: currentUser.id, staffName: currentUser.username, requestedAt: new Date().toISOString(), status: 'pending' as 'pending' };
      setBillingRequests(prev => [addedRequest, ...prev].sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));

      await addNotification({
        userId: MOCK_OWNER_ID_FOR_NOTIFICATIONS, // Or target a specific owner user ID
        roleTarget: 'owner',
        message: `New billing change request (#${docRef.id.substring(0,6)}) for Wash ID ${requestData.washId} submitted by ${currentUser.username}.`,
        link: `/dashboard?tab=billing-requests&highlight=${docRef.id}`,
        relatedRecordId: docRef.id,
      });
    } catch (error) {
      console.error("Error adding billing request: ", error);
    }
  }, [currentUser, addNotification]);

  const updateBillingRequestStatus = useCallback(async (requestId: string, status: 'approved' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can update billing request status.");
      return;
    }
    try {
      const requestRef = doc(db, "billingRequests", requestId);
      await updateDoc(requestRef, { status });
      
      let staffToNotifyId: string | undefined;
      let originalRequestWashId: string | undefined;

      setBillingRequests(prevRequests => {
        return prevRequests.map(req => {
          if (req.id === requestId) {
            staffToNotifyId = req.staffId;
            originalRequestWashId = req.washId;
            return { ...req, status };
          }
          return req;
        }).sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      });
      
      if (staffToNotifyId && originalRequestWashId) {
        await addNotification({
          userId: staffToNotifyId,
          roleTarget: 'staff',
          message: `Your billing change request (#${requestId.substring(0,6)}) for Wash ID ${originalRequestWashId} has been ${status}.`,
          relatedRecordId: requestId,
        });
      }
    } catch (error) {
      console.error("Error updating billing request status: ", error);
    }
  }, [currentUser, addNotification]);

  const addWashRecord = useCallback(async (recordData: Omit<WashRecord, 'washId' | 'createdAt'>) => {
    try {
      const newRecordData = {
        ...recordData,
        customerName: recordData.customerName || "N/A",
        createdAt: serverTimestamp(),
        discountPercentage: recordData.discountPercentage || 0,
      };
      const docRef = await addDoc(collection(db, "washRecords"), newRecordData);
      const addedRecord = { ...recordData, washId: docRef.id, customerName: recordData.customerName || "N/A", createdAt: new Date().toISOString(), discountPercentage: recordData.discountPercentage || 0};
      setWashRecords(prev => [addedRecord, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error adding wash record: ", error);
    }
  }, []);

  const updateWashRecord = useCallback(async (washId: string, updatedData: Partial<Omit<WashRecord, 'washId' | 'createdAt'>>) => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can update wash records.");
      return;
    }
    try {
      const recordRef = doc(db, "washRecords", washId);
      await updateDoc(recordRef, updatedData);
      setWashRecords(prevRecords => {
        return prevRecords.map(record =>
          record.washId === washId ? { ...record, ...updatedData, customerName: updatedData.customerName || record.customerName, discountPercentage: updatedData.discountPercentage ?? record.discountPercentage } : record
        ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    } catch (error) {
      console.error("Error updating wash record: ", error);
    }
  }, [currentUser]);

  const deleteWashRecord = useCallback(async (washId: string) => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can delete wash records.");
      return;
    }
    try {
      await deleteDoc(doc(db, "washRecords", washId));
      setWashRecords(prevRecords => prevRecords.filter(record => record.washId !== washId));
    } catch (error) {
      console.error("Error deleting wash record: ", error);
    }
  }, [currentUser]);

  const addService = useCallback(async (serviceData: Omit<Service, 'id'>) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    try {
      const docRef = await addDoc(collection(db, "services"), serviceData);
      const newService = { ...serviceData, id: docRef.id };
      setServices(prev => [...prev, newService].sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error adding service: ", error);
    }
  }, [currentUser]);

  const updateService = useCallback(async (serviceId: string, updatedData: Partial<Omit<Service, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    try {
      const serviceRef = doc(db, "services", serviceId);
      await updateDoc(serviceRef, updatedData);
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...updatedData } : s).sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error updating service: ", error);
    }
  }, [currentUser]);

  const deleteService = useCallback(async (serviceId: string) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    try {
      await deleteDoc(doc(db, "services", serviceId));
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error("Error deleting service: ", error);
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser && !!currentUser.token,
      login,
      logout,
      billingRequests,
      addBillingRequest,
      updateBillingRequestStatus,
      washRecords,
      addWashRecord,
      updateWashRecord,
      deleteWashRecord,
      notifications,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getUnreadNotificationCount,
      services,
      addService,
      updateService,
      deleteService,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
