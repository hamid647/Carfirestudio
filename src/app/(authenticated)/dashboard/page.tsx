
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WashForm from "@/components/wash-form";
import StaffScheduleCalendar from "@/components/staff-schedule-calendar";
import BillingChangeRequestForm from '@/components/billing-change-request-form';
import OwnerRequestsView from '@/components/owner-requests-view';
import WashHistoryView from '@/components/wash-history-view';
import OwnerAnalyticsDashboard from '@/components/owner-analytics-dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Droplets, CalendarClock, Edit3, ShieldCheck, History, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>("");

  // Define tab configurations
  const staffTabs = [
    { value: "wash-form", label: "New Wash", icon: Droplets },
    { value: "wash-history", label: "Wash History", icon: History },
    { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
    { value: "billing-change-request", label: "Request Billing Change", icon: Edit3 },
  ];

  const ownerTabs = [
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "wash-history", label: "Wash History", icon: History },
    { value: "billing-requests", label: "Billing Requests", icon: ShieldCheck },
    { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
  ];

  const TABS_CONFIG = currentUser?.role === 'owner' ? ownerTabs : staffTabs;

  useEffect(() => {
    // Set initial tab based on URL param or role default
    if (initialTab && TABS_CONFIG.some(tab => tab.value === initialTab)) {
      setActiveTab(initialTab);
    } else if (currentUser?.role === 'staff') {
      setActiveTab('wash-form');
    } else if (currentUser?.role === 'owner') {
      setActiveTab('analytics');
    } else if (TABS_CONFIG.length > 0) {
        // Fallback if no other condition met and tabs exist
        setActiveTab(TABS_CONFIG[0].value);
    }
  }, [currentUser, initialTab, TABS_CONFIG]); // TABS_CONFIG added as dependency


  if (!currentUser) {
    return <p className="text-center py-10">Loading user data...</p>;
  }
  
  // This effect ensures activeTab is always valid, especially after initial role-based setting
  useEffect(() => {
    if (activeTab && TABS_CONFIG.length > 0) {
      const currentTabIsValid = TABS_CONFIG.some(tab => tab.value === activeTab);
      if (!currentTabIsValid) {
        // If current activeTab is not valid for the role, reset to default for that role
        if (currentUser?.role === 'staff') {
          setActiveTab('wash-form');
        } else if (currentUser?.role === 'owner') {
          setActiveTab('analytics');
        } else {
           setActiveTab(TABS_CONFIG[0].value); // Fallback
        }
      }
    } else if (!activeTab && TABS_CONFIG.length > 0) {
        // If activeTab is not set at all, set it to the default for the role
         if (currentUser?.role === 'staff') {
          setActiveTab('wash-form');
        } else if (currentUser?.role === 'owner') {
          setActiveTab('analytics');
        } else {
           setActiveTab(TABS_CONFIG[0].value); // Fallback
        }
    }
  }, [activeTab, TABS_CONFIG, currentUser]); // currentUser added
  
  if (!activeTab && TABS_CONFIG.length > 0) return <p className="text-center py-10">Loading tabs...</p>;
  if (TABS_CONFIG.length === 0) return <p className="text-center py-10">No tabs available for your role.</p>;


  return (
    <div className="flex flex-col items-center w-full selection:bg-primary/20">
      <header className="w-full max-w-6xl mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Welcome, {currentUser.username}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your {currentUser.role === 'owner' ? 'Owner' : 'Staff'} Dashboard
        </p>
      </header>

      <main className="w-full max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-${TABS_CONFIG.length} md:mx-auto mb-6 h-auto`}>
            {TABS_CONFIG.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="py-3 text-base flex-wrap h-auto min-h-[3rem]">
                <tab.icon className="mr-2 h-5 w-5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Staff Content */}
          {currentUser.role === 'staff' && (
            <>
              <TabsContent value="wash-form">
                <WashForm />
              </TabsContent>
              <TabsContent value="wash-history">
                <WashHistoryView />
              </TabsContent>
              <TabsContent value="staff-schedule">
                <StaffScheduleCalendar />
              </TabsContent>
              <TabsContent value="billing-change-request">
                <BillingChangeRequestForm />
              </TabsContent>
            </>
          )}

          {/* Owner Content */}
          {currentUser.role === 'owner' && (
            <>
              <TabsContent value="analytics">
                <OwnerAnalyticsDashboard />
              </TabsContent>
              <TabsContent value="wash-history">
                <WashHistoryView />
              </TabsContent>
              <TabsContent value="billing-requests">
                <OwnerRequestsView />
              </TabsContent>
              <TabsContent value="staff-schedule">
                <StaffScheduleCalendar />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
