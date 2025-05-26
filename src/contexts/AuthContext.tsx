
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
  where,
  writeBatch
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

const MOCK_OWNER_ID_FOR_NOTIFICATIONS = 'owner-001'; 

const convertFirestoreTimestamp = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(item => convertFirestoreTimestamp(item));
  }
  if (typeof data === 'object' && data !== null) {
    const res: { [key: string]: any } = {};
    for (const key in data) {
      res[key] = convertFirestoreTimestamp(data[key]);
    }
    return res;
  }
  return data;
};


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [billingRequests, setBillingRequests] = useState<BillingChangeRequest[]>([]);
  const [washRecords, setWashRecords] = useState<WashRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Unified loading state

  useEffect(() => {
    const initializeAuthAndData = async () => {
      setIsLoading(true);

      let userFromStorage: User | null = null;
      try {
        const storedUserJson = localStorage.getItem('currentUser');
        if (storedUserJson) {
          const parsedUser: User = JSON.parse(storedUserJson);
          if (parsedUser && parsedUser.token) {
            userFromStorage = parsedUser;
          } else {
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error("Failed to load user from localStorage", error);
        localStorage.removeItem('currentUser');
      }

      if (userFromStorage) {
        setCurrentUser(userFromStorage); // Set state immediately
      }

      try {
        // Fetch Services
        const servicesQuery = query(collection(db, "services"), orderBy("name"));
        const servicesSnapshot = await getDocs(servicesQuery);
        let fetchedServices = servicesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Service));
        
        if (fetchedServices.length === 0 && INITIAL_SERVICES.length > 0) {
          const batch = writeBatch(db);
          const newServicesArray: Service[] = [];
          INITIAL_SERVICES.forEach(service => {
            const { id, ...serviceData } = service; // Use defined ID for consistency or let Firestore generate
            const docRef = doc(collection(db, "services"), id); // Use predefined ID
            batch.set(docRef, serviceData);
            newServicesArray.push({ ...serviceData, id: id } as Service);
          });
          await batch.commit();
          fetchedServices = newServicesArray;
        }
        setServices(fetchedServices.map(s => convertFirestoreTimestamp(s)));

        // Fetch Wash Records
        const washRecordsQuery = query(collection(db, "washRecords"), orderBy("createdAt", "desc"));
        const washRecordsSnapshot = await getDocs(washRecordsQuery);
        setWashRecords(washRecordsSnapshot.docs.map(docSnap => convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data(), washId: docSnap.id } as WashRecord)));
        
        // Fetch Billing Requests
        const billingRequestsQuery = query(collection(db, "billingRequests"), orderBy("requestedAt", "desc"));
        const billingRequestsSnapshot = await getDocs(billingRequestsQuery);
        setBillingRequests(billingRequestsSnapshot.docs.map(docSnap => convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data() } as BillingChangeRequest)));

        // Fetch Notifications (use userFromStorage as currentUser state update might not be synchronous for this effect run)
        const effectiveUserForNotifications = userFromStorage;
        const combinedNotifications = new Map<string, NotificationRecord>();

        if (effectiveUserForNotifications) {
            const userNotificationsQuery = query(
                collection(db, "notifications"), 
                where("userId", "==", effectiveUserForNotifications.id),
                orderBy("timestamp", "desc")
            );
            const roleNotificationsQuery = query(
                collection(db, "notifications"), 
                where("roleTarget", "==", effectiveUserForNotifications.role),
                orderBy("timestamp", "desc")
            );
            
            const [userNotifsSnap, roleNotifsSnap] = await Promise.all([
                getDocs(userNotificationsQuery),
                getDocs(roleNotificationsQuery)
            ]);

            userNotifsSnap.docs.forEach(docSnap => combinedNotifications.set(docSnap.id, convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data() } as NotificationRecord)));
            roleNotifsSnap.docs.forEach(docSnap => combinedNotifications.set(docSnap.id, convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data() } as NotificationRecord)));
        } else {
            const ownerRoleNotificationsQuery = query(
                collection(db, "notifications"), 
                where("roleTarget", "==", "owner"),
                orderBy("timestamp", "desc")
            );
            const ownerNotifsSnap = await getDocs(ownerRoleNotificationsQuery);
            ownerNotifsSnap.docs.forEach(docSnap => combinedNotifications.set(docSnap.id, convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data() } as NotificationRecord)));
        }
        setNotifications(Array.from(combinedNotifications.values()).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        // Fallback to initial services if DB fetch fails and services are empty
        if (services.length === 0) setServices(INITIAL_SERVICES.map(s => convertFirestoreTimestamp(s)));
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuthAndData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount

  const login = useCallback((userData: User) => {
    if (userData && userData.token) {
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      // Optionally re-fetch user-specific data or notifications here if needed after login
      // For now, existing data fetch in useEffect on mount should cover initial load.
      // If notifications need to be dynamically updated based on NEW login, trigger a fetch:
      const fetchNotificationsForNewUser = async () => {
        setIsLoading(true); // Indicate loading during this specific fetch
        const combinedNotifications = new Map<string, NotificationRecord>();
        const userNotificationsQuery = query(collection(db, "notifications"), where("userId", "==", userData.id), orderBy("timestamp", "desc"));
        const roleNotificationsQuery = query(collection(db, "notifications"), where("roleTarget", "==", userData.role), orderBy("timestamp", "desc"));
        const [userNotifsSnap, roleNotifsSnap] = await Promise.all([getDocs(userNotificationsQuery), getDocs(roleNotificationsQuery)]);
        userNotifsSnap.docs.forEach(docSnap => combinedNotifications.set(docSnap.id, convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data() } as NotificationRecord)));
        roleNotifsSnap.docs.forEach(docSnap => combinedNotifications.set(docSnap.id, convertFirestoreTimestamp({ id: docSnap.id, ...docSnap.data() } as NotificationRecord)));
        setNotifications(Array.from(combinedNotifications.values()).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setIsLoading(false);
      };
      fetchNotificationsForNewUser();
    } else {
      console.error("Login attempt with invalid user data or missing token:", userData);
      setIsLoading(false); // Ensure loading is false if login fails early
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setNotifications([]); 
    // No need to set isLoading here typically, as pages will redirect.
    // If there was a specific "logging out" state, you could manage it.
  }, []);

  const addNotification = useCallback(async (notificationData: Omit<NotificationRecord, 'id' | 'timestamp' | 'read'>) => {
    try {
      const newNotificationData = {
        ...notificationData,
        timestamp: serverTimestamp(), 
        read: false, 
      };
      const docRef = await addDoc(collection(db, "notifications"), newNotificationData);
       const addedNotification = { ...newNotificationData, id: docRef.id, timestamp: new Date().toISOString() } as NotificationRecord; // 'read' is part of newNotificationData
       setNotifications(prev => [convertFirestoreTimestamp(addedNotification), ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

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
    // Filter for current user's unread notifications
    const unreadNotifsToUpdate = notifications.filter(n => 
        ((n.userId === currentUser.id) || (n.roleTarget === currentUser.role)) && !n.read
    );

    if (unreadNotifsToUpdate.length === 0) return;

    try {
      const batchCommit = writeBatch(db);
      unreadNotifsToUpdate.forEach(notif => {
        batchCommit.update(doc(db, "notifications", notif.id), { read: true });
      });
      await batchCommit.commit();
      
      setNotifications(prev => prev.map(n => {
        const shouldMarkRead = ((n.userId === currentUser.id) || (n.roleTarget === currentUser.role)) && !n.read;
        return shouldMarkRead ? { ...n, read: true } : n;
      }));
    } catch (error) {
      console.error("Error marking all notifications as read: ", error);
    }
  }, [currentUser, notifications]);


  const getUnreadNotificationCount = useCallback(() => {
    if (!currentUser) return 0;
    return notifications.filter(n => ((n.userId === currentUser.id) || (n.roleTarget === currentUser.role)) && !n.read).length;
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
      const addedRequest = { ...newRequestData, id: docRef.id, requestedAt: new Date().toISOString() } as BillingChangeRequest;
      setBillingRequests(prev => [convertFirestoreTimestamp(addedRequest), ...prev].sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));

      await addNotification({
        roleTarget: 'owner', // Target all owners
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
        const updatedRequests = prevRequests.map(req => {
          if (req.id === requestId) {
            staffToNotifyId = req.staffId;
            originalRequestWashId = req.washId;
            return { ...req, status };
          }
          return req;
        });
        return updatedRequests.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      });
      
      if (staffToNotifyId && originalRequestWashId) {
        await addNotification({
          userId: staffToNotifyId, // Target specific staff member
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
      const addedRecord = { ...newRecordData, washId: docRef.id, createdAt: new Date().toISOString() } as WashRecord;
      setWashRecords(prev => [convertFirestoreTimestamp(addedRecord), ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
        const updatedRecords = prevRecords.map(record =>
          record.washId === washId ? convertFirestoreTimestamp({ ...record, ...updatedData }) : record
        );
        return updatedRecords.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      // Firestore will auto-generate an ID if we don't specify one.
      // If you want to use predefined IDs from INITIAL_SERVICES, that needs specific handling during initialization.
      const docRef = await addDoc(collection(db, "services"), serviceData);
      const newService = { ...serviceData, id: docRef.id };
      setServices(prev => [convertFirestoreTimestamp(newService), ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error adding service: ", error);
    }
  }, [currentUser]);

  const updateService = useCallback(async (serviceId: string, updatedData: Partial<Omit<Service, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    try {
      const serviceRef = doc(db, "services", serviceId);
      await updateDoc(serviceRef, updatedData);
      setServices(prev => prev.map(s => s.id === serviceId ? convertFirestoreTimestamp({ ...s, ...updatedData }) : s).sort((a,b) => a.name.localeCompare(b.name)));
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


    