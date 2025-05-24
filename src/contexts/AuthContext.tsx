
"use client";

import type { Role, User, BillingChangeRequest, WashRecord, NotificationRecord, Service } from '@/types';
import { INITIAL_SERVICES, type ServiceCategory } from '@/config/services'; // Import INITIAL_SERVICES
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
  billingRequests: BillingChangeRequest[];
  addBillingRequest: (request: Omit<BillingChangeRequest, 'id' | 'requestedAt' | 'status' | 'staffId' | 'staffName'>) => void;
  updateBillingRequestStatus: (requestId: string, status: 'approved' | 'rejected') => void;
  washRecords: WashRecord[];
  addWashRecord: (recordData: Omit<WashRecord, 'washId' | 'createdAt'>) => void;
  updateWashRecord: (washId: string, updatedData: Partial<Omit<WashRecord, 'washId' | 'createdAt'>>) => void;
  deleteWashRecord: (washId: string) => void;
  notifications: NotificationRecord[];
  addNotification: (notificationData: Omit<NotificationRecord, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  getUnreadNotificationCount: () => number;
  services: Service[];
  addService: (serviceData: Omit<Service, 'id'>) => void;
  updateService: (serviceId: string, updatedData: Partial<Omit<Service, 'id'>>) => void;
  deleteService: (serviceId: string) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const MOCK_USERS = {
  owner: { id: 'owner-001', username: 'App Owner', role: 'owner' as Role },
  staff: { id: 'staff-001', username: 'Staff Member', role: 'staff' as Role },
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [billingRequests, setBillingRequests] = useState<BillingChangeRequest[]>([]);
  const [washRecords, setWashRecords] = useState<WashRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      const storedRequests = localStorage.getItem('billingRequests');
      if (storedRequests) {
        setBillingRequests(JSON.parse(storedRequests));
      }
      const storedWashRecords = localStorage.getItem('washRecords');
      if (storedWashRecords) {
        setWashRecords(JSON.parse(storedWashRecords));
      }
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
      const storedServices = localStorage.getItem('services');
      if (storedServices) {
        setServices(JSON.parse(storedServices));
      } else {
        setServices(INITIAL_SERVICES); // Initialize with default services if none in localStorage
        localStorage.setItem('services', JSON.stringify(INITIAL_SERVICES));
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
       // Fallback to initial services if localStorage parsing fails for services
      if (services.length === 0) {
        setServices(INITIAL_SERVICES);
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // services removed from dependency array to prevent re-initialization loop

  const login = useCallback((role: Role) => {
    const userToLogin = MOCK_USERS[role];
    if (userToLogin) {
      setCurrentUser(userToLogin);
      try {
        localStorage.setItem('currentUser', JSON.stringify(userToLogin));
      } catch (error) {
        console.error("Failed to save user to localStorage", error);
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
    setIsLoading(false); 
  }, []);

  // Notification CRUD
  const addNotification = useCallback((notificationData: Omit<NotificationRecord, 'id' | 'timestamp'>) => {
    const newNotification: NotificationRecord = {
      ...notificationData,
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prevNotifications => {
      const updatedNotifications = [newNotification, ...prevNotifications];
      try {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      } catch (error) {
        console.error("Failed to save notifications to localStorage", error);
      }
      return updatedNotifications;
    });
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      try {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      } catch (error) {
        console.error("Failed to save notifications to localStorage", error);
      }
      return updatedNotifications;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    if (!currentUser) return;
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.map(notif =>
        (notif.userId === currentUser.id || notif.roleTarget === currentUser.role) && !notif.read ? { ...notif, read: true } : notif
      );
      try {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      } catch (error) {
        console.error("Failed to save notifications to localStorage", error);
      }
      return updatedNotifications;
    });
  }, [currentUser]);

  const getUnreadNotificationCount = useCallback(() => {
    if (!currentUser) return 0;
    return notifications.filter(n => (n.userId === currentUser.id || n.roleTarget === currentUser.role) && !n.read).length;
  }, [notifications, currentUser]);


  const addBillingRequest = useCallback((requestData: Omit<BillingChangeRequest, 'id' | 'requestedAt' | 'status' | 'staffId' | 'staffName'>) => {
    if (!currentUser || currentUser.role !== 'staff') {
      console.error("Only staff can add billing requests.");
      return;
    }
    const newRequest: BillingChangeRequest = {
      ...requestData,
      id: `BR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      staffId: currentUser.id,
      staffName: currentUser.username,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    setBillingRequests(prevRequests => {
      const updatedRequests = [...prevRequests, newRequest];
      try {
        localStorage.setItem('billingRequests', JSON.stringify(updatedRequests));
      } catch (error) {
        console.error("Failed to save billing requests to localStorage", error);
      }
      return updatedRequests;
    });

    addNotification({
      userId: MOCK_USERS.owner.id, 
      roleTarget: 'owner',
      message: `New billing change request (#${newRequest.id.substring(0,6)}) for Wash ID ${newRequest.washId} submitted by ${currentUser.username}.`,
      read: false,
      link: `/dashboard?tab=billing-requests&highlight=${newRequest.id}`,
      relatedRecordId: newRequest.id,
    });
  }, [currentUser, addNotification]);

  const updateBillingRequestStatus = useCallback((requestId: string, status: 'approved' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can update billing request status.");
      return;
    }
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
      try {
        localStorage.setItem('billingRequests', JSON.stringify(updatedRequests));
      } catch (error) {
        console.error("Failed to save billing requests to localStorage", error);
      }
      return updatedRequests;
    });

    if (staffToNotifyId && originalRequestWashId) {
       addNotification({
        userId: staffToNotifyId, 
        roleTarget: 'staff', 
        message: `Your billing change request (#${requestId.substring(0,6)}) for Wash ID ${originalRequestWashId} has been ${status}.`,
        read: false,
        relatedRecordId: requestId,
      });
    }
  }, [currentUser, addNotification]);

  // Wash Record CRUD
  const addWashRecord = useCallback((recordData: Omit<WashRecord, 'washId' | 'createdAt'>) => {
    const newRecord: WashRecord = {
      ...recordData,
      washId: `WASH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      discountPercentage: recordData.discountPercentage || 0,
    };
    setWashRecords(prevRecords => {
      const updatedRecords = [newRecord, ...prevRecords]; 
      try {
        localStorage.setItem('washRecords', JSON.stringify(updatedRecords));
      } catch (error) {
        console.error("Failed to save wash records to localStorage", error);
      }
      return updatedRecords;
    });
  }, []);

  const updateWashRecord = useCallback((washId: string, updatedData: Partial<Omit<WashRecord, 'washId' | 'createdAt'>>) => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can update wash records.");
      return;
    }
    setWashRecords(prevRecords => {
      const updatedRecords = prevRecords.map(record =>
        record.washId === washId ? { ...record, ...updatedData, discountPercentage: updatedData.discountPercentage ?? record.discountPercentage } : record
      );
      try {
        localStorage.setItem('washRecords', JSON.stringify(updatedRecords));
      } catch (error) {
        console.error("Failed to save wash records to localStorage", error);
      }
      return updatedRecords;
    });
  }, [currentUser]);

  const deleteWashRecord = useCallback((washId: string) => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can delete wash records.");
      return;
    }
    setWashRecords(prevRecords => {
      const updatedRecords = prevRecords.filter(record => record.washId !== washId);
      try {
        localStorage.setItem('washRecords', JSON.stringify(updatedRecords));
      } catch (error) {
        console.error("Failed to save wash records to localStorage", error);
      }
      return updatedRecords;
    });
  }, [currentUser]);

  // Service CRUD
  const addService = useCallback((serviceData: Omit<Service, 'id'>) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    const newService: Service = {
      ...serviceData,
      id: `SERVICE-${Date.now()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`
    };
    setServices(prev => {
      const updated = [...prev, newService];
      localStorage.setItem('services', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const updateService = useCallback((serviceId: string, updatedData: Partial<Omit<Service, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    setServices(prev => {
      const updated = prev.map(s => s.id === serviceId ? { ...s, ...updatedData } : s);
      localStorage.setItem('services', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const deleteService = useCallback((serviceId: string) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    setServices(prev => {
      const updated = prev.filter(s => s.id !== serviceId);
      localStorage.setItem('services', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAuthenticated: !!currentUser, 
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
