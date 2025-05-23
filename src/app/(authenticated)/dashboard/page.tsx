
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
import { useAuth } from '@/hooks/useAuth';
import { Droplets, CalendarClock, Edit3, ShieldCheck, History, BarChart3 } from "lucide-react";

// Define tab configurations outside the component or memoize them if they depend on props/state not changing frequently.
// For this case, they are constant per role.
const staffTabsConfig = [
  { value: "wash-form", label: "New Wash", icon: Droplets },
  { value: "wash-history", label: "Wash History", icon: History },
  { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
  { value: "billing-change-request", label: "Request Billing Change", icon: Edit3 },
];

const ownerTabsConfig = [
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "wash-history", label: "Wash History", icon: History },
  { value: "billing-requests", label: "Billing Requests", icon: ShieldCheck },
  { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(""); // Initial empty string

  const TABS_CONFIG = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.role === 'owner' ? ownerTabsConfig : staffTabsConfig;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || TABS_CONFIG.length === 0) {
      // User not loaded or no tabs for this role.
      // If TABS_CONFIG becomes empty (e.g. unexpected role), activeTab might need reset.
      // However, render guards below should handle display.
      // If activeTab was from a previous role, it might be invalid.
      if (activeTab !== "" && !TABS_CONFIG.some(t => t.value === activeTab) && TABS_CONFIG.length > 0) {
         // This condition is a bit redundant due to logic below but can act as a fast path reset if TABS_CONFIG changed drastically.
      } else if (TABS_CONFIG.length === 0 && activeTab !== "") {
        setActiveTab(""); // Reset if no tabs are available
      }
      return;
    }

    let newProposedTab: string;

    // Priority 1: initialTab from URL, if valid for current TABS_CONFIG
    if (initialTab && TABS_CONFIG.some(t => t.value === initialTab)) {
      newProposedTab = initialTab;
    }
    // Priority 2: current activeTab, if it's set and still valid for current TABS_CONFIG
    // This preserves user's clicked tab unless role change invalidates it.
    else if (activeTab && TABS_CONFIG.some(t => t.value === activeTab)) {
      newProposedTab = activeTab; // No change needed, already valid
    }
    // Priority 3: Default for the role (if initialTab not used/invalid AND activeTab not set/invalid)
    else {
      if (currentUser.role === 'staff') {
        newProposedTab = 'wash-form';
      } else if (currentUser.role === 'owner') {
        newProposedTab = 'analytics';
      } else {
        // Fallback to the first available tab if role is unexpected
        // TABS_CONFIG is guaranteed to be non-empty here by the initial check in this effect.
        newProposedTab = TABS_CONFIG[0].value;
      }
    }
    
    if (activeTab !== newProposedTab) {
      setActiveTab(newProposedTab);
    }
  }, [currentUser, initialTab, activeTab, TABS_CONFIG, setActiveTab]);


  if (!currentUser) {
    return <p className="text-center py-10">Loading user data...</p>;
  }
  
  if (TABS_CONFIG.length === 0) {
    return <p className="text-center py-10">No tabs available for your role.</p>;
  }

  // If TABS_CONFIG is ready but activeTab hasn't been determined by useEffect yet (still initial "")
  // This indicates the effect is about to run or has run but the state update isn't rendered yet.
  if (activeTab === "" ) {
     // And ensure that TABS_CONFIG actually HAS the default tab we'd set.
     // This state should be brief.
    return <p className="text-center py-10">Initializing dashboard tabs...</p>;
  }

  // Final check: if activeTab is somehow not in TABS_CONFIG (should be rare after effect)
  if (!TABS_CONFIG.some(t => t.value === activeTab)) {
    // This might happen if activeTab was set to something completely invalid or TABS_CONFIG changed
    // and the effect didn't catch it in time or correctly.
    // For safety, render a loading or error, or attempt one last default.
    // For now, let's assume the useEffect handles this, but it's a potential fallback.
    // To be safe, if this occurs, it might be better to show "loading" and let useEffect correct it.
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

