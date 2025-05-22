
"use client"; // Ensure this is at the top if not already for useState/useEffect

import React, { useState, useEffect } from 'react'; // Added useEffect and useState
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WashForm from "@/components/wash-form";
import StaffScheduleCalendar from "@/components/staff-schedule-calendar";
import { Droplets, CalendarClock } from "lucide-react";

export default function DashboardPage() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-page-background selection:bg-primary/20">
      <header className="w-full max-w-6xl mb-8 text-center">
        <div className="inline-flex items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="hsl(var(--primary))" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-8.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 5c1.66 0 3-1.34 3-3H9c0 1.66 1.34 3 3 3zm-5.41-5.07c-.06.16-.09.32-.09.49 0 1.1.9 2 2 2s2-.9 2-2c0-.17-.03-.33-.09-.49C10.49 11.82 9 11.48 9 10.5c0-.51.26-.95.66-1.22-.01-.12-.06-.38-.06-.58 0-.66.54-1.2 1.2-1.2.23 0 .45.07.63.18.25-.57.83-1 1.57-1s1.32.43 1.57 1c.18-.11.4-.18.63-.18.66 0 1.2.54 1.2 1.2 0 .2-.05.46-.06.58.4.27.66.71.66 1.22 0 .98-1.49 1.32-1.91 1.92-.06-.16-.09-.32-.09-.49 0-1.1-.9-2-2-2s-2 .9-2 2c0 .17.03.33.09.49-1.49.32-1.91.92-1.91 1.92z"/>
          </svg>
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Washlytics
          </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">
          Your Modern Car Wash Management Solution
        </p>
      </header>

      <main className="w-full max-w-6xl">
        <Tabs defaultValue="wash-form" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 md:mx-auto mb-6 h-auto">
            <TabsTrigger value="wash-form" className="py-3 text-base">
              <Droplets className="mr-2 h-5 w-5" /> New Wash
            </TabsTrigger>
            <TabsTrigger value="staff-schedule" className="py-3 text-base">
              <CalendarClock className="mr-2 h-5 w-5" /> Staff Schedule
            </TabsTrigger>
          </TabsList>
          <TabsContent value="wash-form">
            <WashForm />
          </TabsContent>
          <TabsContent value="staff-schedule">
            <StaffScheduleCalendar />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="w-full max-w-6xl mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear ? currentYear : ''} Washlytics. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
