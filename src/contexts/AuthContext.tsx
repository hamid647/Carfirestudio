
"use client";

import type { Role, User, BillingChangeRequest, WashRecord } from '@/types';
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
    } catch (error) {
      console.error("Failed to load from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, [currentUser]);

  const updateBillingRequestStatus = useCallback((requestId: string, status: 'approved' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'owner') {
      console.error("Only owner can update billing request status.");
      return;
    }
    setBillingRequests(prevRequests => {
      const updatedRequests = prevRequests.map(req =>
        req.id === requestId ? { ...req, status } : req
      );
      try {
        localStorage.setItem('billingRequests', JSON.stringify(updatedRequests));
      } catch (error) {
        console.error("Failed to save billing requests to localStorage", error);
      }
      return updatedRequests;
    });
  }, [currentUser]);

  // Wash Record CRUD
  const addWashRecord = useCallback((recordData: Omit<WashRecord, 'washId' | 'createdAt'>) => {
    const newRecord: WashRecord = {
      ...recordData,
      washId: `WASH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    setWashRecords(prevRecords => {
      const updatedRecords = [newRecord, ...prevRecords]; // Add to the beginning for recent first
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
        record.washId === washId ? { ...record, ...updatedData } : record
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
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
