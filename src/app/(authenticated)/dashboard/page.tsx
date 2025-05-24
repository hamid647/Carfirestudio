
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WashForm from "@/components/wash-form";
import StaffScheduleCalendar from "@/components/staff-schedule-calendar";
import BillingChangeRequestForm from '@/components/billing-change-request-form';
import OwnerRequestsView from '@/components/owner-requests-view';
import WashHistoryView from '@/components/wash-history-view';
import OwnerAnalyticsDashboard from '@/components/owner-analytics-dashboard';
import ManageServices from '@/components/manage-services'; // Import ManageServices
import { useAuth } from '@/hooks/useAuth';
import { Droplets, CalendarClock, Edit3, ShieldCheck, History, BarChart3, Settings2 } from "lucide-react"; // Added Settings2

// Define tab configurations
const staffTabsConfig = [
  { value: "wash-form", label: "New Wash", icon: Droplets },
  { value: "wash-history", label: "Wash History", icon: History },
  { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
  { value: "billing-change-request", label: "Request Billing Change", icon: Edit3 },
];

const ownerTabsConfig = [
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "manage-services", label: "Manage Services", icon: Settings2 },
  { value: "wash-history", label: "Wash History", icon: History },
  { value: "billing-requests", label: "Billing Requests", icon: ShieldCheck },
  { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>("");

  const TABS_CONFIG = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.role === 'owner' ? ownerTabsConfig : staffTabsConfig;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || TABS_CONFIG.length === 0) {
      // If no current user or no tabs configured for role, don't set activeTab
      // or clear it if it was previously set and now there are no tabs.
      if (activeTab !== "" && TABS_CONFIG.length === 0) {
        setActiveTab(""); 
      }
      return;
    }

    let newProposedTab: string;

    // 1. Prioritize initialTab from URL if it's valid for the current user
    if (initialTab && TABS_CONFIG.some(t => t.value === initialTab)) {
      newProposedTab = initialTab;
    }
    // 2. Else, if current activeTab is still valid, keep it
    else if (activeTab && TABS_CONFIG.some(t => t.value === activeTab)) {
      newProposedTab = activeTab; // No change needed, already valid
    }
    // 3. Else, set a default tab based on role
    else {
      if (currentUser.role === 'staff') {
        newProposedTab = 'wash-form';
      } else if (currentUser.role === 'owner') {
        newProposedTab = 'analytics'; // Default for owner
      } else {
        // Fallback if role is somehow unexpected, though TABS_CONFIG should be empty
        newProposedTab = TABS_CONFIG[0].value;
      }
    }
    
    // Only update if the proposed tab is different from the current activeTab
    if (activeTab !== newProposedTab) {
      setActiveTab(newProposedTab);
    }
  }, [currentUser, initialTab, activeTab, TABS_CONFIG, setActiveTab]); // Added setActiveTab to dependencies


  if (!currentUser) {
    return <p className="text-center py-10">Loading user data...</p>;
  }
  
  if (TABS_CONFIG.length === 0) { // Should only happen if currentUser is null or role is unrecognized
    return <p className="text-center py-10">No tabs available for your role.</p>;
  }

  if (activeTab === "" ) { // Waiting for useEffect to set the initial activeTab
     return <p className="text-center py-10">Initializing dashboard tabs...</p>;
  }

  // Final check: if activeTab is somehow still not in TABS_CONFIG (e.g., race condition or bad query param)
  // This should ideally be caught by useEffect setting a default.
  if (!TABS_CONFIG.some(t => t.value === activeTab)) {
     // This can happen briefly if roles change or query param is invalid
     // The useEffect above should correct it.
     return <p className="text-center py-10">Re-evaluating tabs...</p>;
  }


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
              <TabsContent value="manage-services">
                <ManageServices />
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

    