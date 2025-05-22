
"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WashForm from "@/components/wash-form";
import StaffScheduleCalendar from "@/components/staff-schedule-calendar";
import BillingChangeRequestForm from '@/components/billing-change-request-form';
import OwnerRequestsView from '@/components/owner-requests-view';
import { useAuth } from '@/hooks/useAuth';
import { Droplets, CalendarClock, Edit3, ShieldCheck, Package } from "lucide-react"; // Added Edit3 and ShieldCheck

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (currentUser?.role === 'staff') {
      setActiveTab('wash-form');
    } else if (currentUser?.role === 'owner') {
      setActiveTab('billing-requests');
    }
  }, [currentUser]);


  if (!currentUser) {
    return <p className="text-center py-10">Loading user data...</p>;
  }
  
  const staffTabs = [
    { value: "wash-form", label: "New Wash", icon: Droplets },
    { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
    { value: "billing-change-request", label: "Request Billing Change", icon: Edit3 },
  ];

  const ownerTabs = [
    { value: "billing-requests", label: "Billing Requests", icon: ShieldCheck },
    { value: "staff-schedule", label: "Staff Schedule", icon: CalendarClock },
    // Owners might also want to see the wash form, optionally:
    // { value: "wash-form", label: "New Wash (View)", icon: Package },
  ];

  const TABS_CONFIG = currentUser.role === 'owner' ? ownerTabs : staffTabs;

  if (!activeTab && TABS_CONFIG.length > 0) {
     setActiveTab(TABS_CONFIG[0].value); // Initialize activeTab if not set
  }
  
  if (!activeTab && TABS_CONFIG.length > 0) return <p>Loading tabs...</p>;
  if (TABS_CONFIG.length === 0) return <p>No tabs available for your role.</p>;


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

      <main className="w-full max-w-6xl">
        <Tabs defaultValue={TABS_CONFIG[0].value} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-${TABS_CONFIG.length} md:mx-auto mb-6 h-auto`}>
            {TABS_CONFIG.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="py-3 text-base">
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
              <TabsContent value="billing-requests">
                <OwnerRequestsView />
              </TabsContent>
              <TabsContent value="staff-schedule">
                <StaffScheduleCalendar />
              </TabsContent>
               {/* <TabsContent value="wash-form"> <WashForm /> </TabsContent> */}
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
