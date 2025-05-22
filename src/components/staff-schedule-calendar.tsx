
"use client";

import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarDays, UserCheck } from 'lucide-react';

interface Shift {
  id: string;
  staffName: string;
  date: string; // ISO date string e.g., "2024-07-28"
  startTime: string; // e.g., "09:00 AM"
  endTime: string; // e.g., "05:00 PM"
  role: string;
}

// Initial static mock data for staff shifts
const INITIAL_STATIC_SHIFTS: Shift[] = [
  { id: '1', staffName: 'Alice Smith', date: '2024-07-28', startTime: '09:00 AM', endTime: '05:00 PM', role: 'Washer' },
  { id: '2', staffName: 'Bob Johnson', date: '2024-07-28', startTime: '10:00 AM', endTime: '06:00 PM', role: 'Detailer' },
  { id: '3', staffName: 'Carol White', date: '2024-07-29', startTime: '08:00 AM', endTime: '04:00 PM', role: 'Supervisor' },
  { id: '4', staffName: 'David Brown', date: '2024-07-29', startTime: '09:00 AM', endTime: '05:00 PM', role: 'Washer' },
  { id: '5', staffName: 'Eve Davis', date: '2024-07-30', startTime: '11:00 AM', endTime: '07:00 PM', role: 'Cashier' },
  { id: '6', staffName: 'Alice Smith', date: '2024-08-01', startTime: '09:00 AM', endTime: '05:00 PM', role: 'Washer' },
  { id: '7', staffName: 'Bob Johnson', date: '2024-08-01', startTime: '10:00 AM', endTime: '06:00 PM', role: 'Detailer' },
  { id: '8', staffName: 'Frank Green', date: '2024-07-28', startTime: '12:00 PM', endTime: '08:00 PM', role: 'Washer' },
];

export default function StaffScheduleCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allShifts, setAllShifts] = useState<Shift[]>(INITIAL_STATIC_SHIFTS);

  useEffect(() => {
    // Set selectedDate on client mount
    setSelectedDate(new Date());

    // Generate additional dynamic shifts on client mount
    const today = new Date();
    const staffNames = ["Alice Smith", "Bob Johnson", "Carol White", "David Brown", "Eve Davis", "Frank Green", "Grace Hall", "Henry Ives"];
    const roles = ["Washer", "Detailer", "Supervisor", "Cashier"];
    const dynamicallyGeneratedShifts: Shift[] = [];

    for (let i = 0; i < 30; i++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + i);
      const isoDate = format(shiftDate, 'yyyy-MM-dd');

      // Add 2-3 shifts per day
      for (let j = 0; j < Math.floor(Math.random() * 2) + 2; j++) {
        dynamicallyGeneratedShifts.push({
          id: `gen-${i}-${j}`,
          staffName: staffNames[Math.floor(Math.random() * staffNames.length)],
          date: isoDate,
          startTime: `${String(Math.floor(Math.random() * 4) + 8).padStart(2, '0')}:00 AM`,
          endTime: `${String(Math.floor(Math.random() * 4) + 4).padStart(2, '0')}:00 PM`,
          role: roles[Math.floor(Math.random() * roles.length)],
        });
      }
    }
    // Combine static shifts with newly generated dynamic shifts
    setAllShifts([...INITIAL_STATIC_SHIFTS, ...dynamicallyGeneratedShifts]);
  }, []); // Empty dependency array ensures this runs once on mount

  const shiftsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return allShifts.filter(shift => isSameDay(parseISO(shift.date), selectedDate));
  }, [selectedDate, allShifts]);

  const shiftDates = useMemo(() => allShifts.map(shift => parseISO(shift.date)), [allShifts]);
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold">Staff Schedule</CardTitle>
        </div>
        <CardDescription>View upcoming staff shifts. Select a date on the calendar to see details.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border p-0"
            modifiers={{ scheduled: shiftDates }}
            modifiersStyles={{
                scheduled: { 
                    border: "2px solid hsl(var(--accent))", 
                    borderRadius: '100%',
                    color: "hsl(var(--accent-foreground))",
                    backgroundColor: "hsl(var(--accent))"
                 },
            }}
            components={{
              DayContent: ({ date, displayMonth }) => {
                const isScheduled = shiftDates.some(d => isSameDay(d, date) && d.getMonth() === displayMonth.getMonth());
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{date.getDate()}</span>
                    {isScheduled && (
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-accent rounded-full"></span>
                    )}
                  </div>
                );
              }
            }}
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-primary">
            Shifts for: {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'}
          </h3>
          {shiftsForSelectedDate.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <ul className="space-y-3">
                {shiftsForSelectedDate.map(shift => (
                  <li key={shift.id} className="p-3 border rounded-lg bg-background hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {shift.staffName}
                      </p>
                      <Badge variant="outline" className="text-xs">{shift.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {shift.startTime} - {shift.endTime}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            selectedDate ? <p className="text-muted-foreground italic">No shifts scheduled for this date.</p> : <p className="text-muted-foreground italic">Loading schedule...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
