
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WASH_SERVICES, SERVICE_CATEGORIES, type Service } from '@/config/services';
import type { WashRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { format, parseISO, subDays, startOfDay, isWithinInterval, eachDayOfInterval, endOfDay } from 'date-fns';
import { TrendingUp, Car, PieChartIcon, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react';

type TimeFilter = '7days' | '30days' | 'all';

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];

export default function OwnerAnalyticsDashboard() {
  const { washRecords } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7days');

  const filteredWashRecords = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'all') {
      return washRecords;
    }
    const startDate = subDays(now, timeFilter === '7days' ? 6 : 29);
    return washRecords.filter(record => {
      const recordDate = parseISO(record.createdAt);
      return isWithinInterval(recordDate, { start: startOfDay(startDate), end: endOfDay(now) });
    });
  }, [washRecords, timeFilter]);

  const salesTrendData = useMemo(() => {
    const data: { date: string; sales: number }[] = [];
    const groupedByDate: Record<string, number> = {};

    filteredWashRecords.forEach(record => {
      const dateStr = format(parseISO(record.createdAt), 'yyyy-MM-dd');
      groupedByDate[dateStr] = (groupedByDate[dateStr] || 0) + record.totalCost;
    });
    
    const now = new Date();
    const daysToDisplay = timeFilter === 'all' ? 
        (Object.keys(groupedByDate).length > 0 ? eachDayOfInterval({start: parseISO(Object.keys(groupedByDate).sort()[0]), end: now}) : [])
        : eachDayOfInterval({ start: subDays(now, timeFilter === '7days' ? 6 : 29), end: now });

    daysToDisplay.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        data.push({ date: format(day, 'MMM d'), sales: groupedByDate[dateStr] || 0 });
    });

    return data.sort((a,b) => parseISO(Object.keys(groupedByDate).find(d => format(parseISO(d),'MMM d') === a.date) || new Date(0).toISOString())
                        .getTime() - parseISO(Object.keys(groupedByDate).find(d => format(parseISO(d),'MMM d') === b.date) || new Date(0).toISOString()).getTime());
  }, [filteredWashRecords, timeFilter]);

  const carsWashedData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    const groupedByDate: Record<string, number> = {};

    filteredWashRecords.forEach(record => {
      const dateStr = format(parseISO(record.createdAt), 'yyyy-MM-dd');
      groupedByDate[dateStr] = (groupedByDate[dateStr] || 0) + 1;
    });

    const now = new Date();
    const daysToDisplay = timeFilter === 'all' ? 
        (Object.keys(groupedByDate).length > 0 ? eachDayOfInterval({start: parseISO(Object.keys(groupedByDate).sort()[0]), end: now}) : [])
        : eachDayOfInterval({ start: subDays(now, timeFilter === '7days' ? 6 : 29), end: now });
    
    daysToDisplay.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        data.push({ date: format(day, 'MMM d'), count: groupedByDate[dateStr] || 0 });
    });
    
    return data.sort((a,b) => parseISO(Object.keys(groupedByDate).find(d => format(parseISO(d),'MMM d') === a.date) || new Date(0).toISOString())
                        .getTime() - parseISO(Object.keys(groupedByDate).find(d => format(parseISO(d),'MMM d') === b.date) || new Date(0).toISOString()).getTime());
  }, [filteredWashRecords, timeFilter]);

  const topServicesData = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    filteredWashRecords.forEach(record => {
      record.selectedServices.forEach(serviceId => {
        serviceCounts[serviceId] = (serviceCounts[serviceId] || 0) + 1;
      });
    });

    return Object.entries(serviceCounts)
      .map(([id, count]) => {
        const serviceInfo = WASH_SERVICES.find(s => s.id === id);
        return { name: serviceInfo?.name || id, value: count };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // Top 7 services
  }, [filteredWashRecords]);

  const revenueByCategoryData = useMemo(() => {
    const dailyCategoryRevenue: Record<string, Record<string, number>> = {}; // date -> category -> revenue

    filteredWashRecords.forEach(record => {
        const dateStr = format(parseISO(record.createdAt), 'yyyy-MM-dd');
        if (!dailyCategoryRevenue[dateStr]) {
            dailyCategoryRevenue[dateStr] = {};
            SERVICE_CATEGORIES.forEach(cat => dailyCategoryRevenue[dateStr][cat] = 0);
        }
        record.selectedServices.forEach(serviceId => {
            const service = WASH_SERVICES.find(s => s.id === serviceId);
            if (service) {
                dailyCategoryRevenue[dateStr][service.category] = (dailyCategoryRevenue[dateStr][service.category] || 0) + service.price;
            }
        });
    });
    
    const now = new Date();
    const daysToDisplay = timeFilter === 'all' ? 
        (Object.keys(dailyCategoryRevenue).length > 0 ? eachDayOfInterval({start: parseISO(Object.keys(dailyCategoryRevenue).sort()[0]), end: now}) : [])
        : eachDayOfInterval({ start: subDays(now, timeFilter === '7days' ? 6 : 29), end: now });

    return daysToDisplay.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const revenues = { date: format(day, 'MMM d') };
        SERVICE_CATEGORIES.forEach(cat => {
            revenues[cat] = dailyCategoryRevenue[dateStr]?.[cat] || 0;
        });
        return revenues;
    }).sort((a,b) => parseISO(Object.keys(dailyCategoryRevenue).find(d => format(parseISO(d),'MMM d') === a.date) || new Date(0).toISOString())
                        .getTime() - parseISO(Object.keys(dailyCategoryRevenue).find(d => format(parseISO(d),'MMM d') === b.date) || new Date(0).toISOString()).getTime());
  }, [filteredWashRecords, timeFilter]);


  const salesChartConfig = {
    sales: { label: "Sales ($)", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const carsChartConfig = {
    cars: { label: "Cars Washed", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;
  
  const categoryChartConfig = SERVICE_CATEGORIES.reduce((acc, category, index) => {
    acc[category] = { label: category, color: CHART_COLORS[index % CHART_COLORS.length] };
    return acc;
  }, {} as Record<string, {label: string, color: string}>) satisfies ChartConfig;


  if (washRecords.length === 0) {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <CardTitle className="text-3xl font-bold">Analytics Unavailable</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No wash records available to display analytics. Please add some wash records first.
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle>Daily Sales Trends</CardTitle>
            </div>
            <CardDescription>Total revenue generated per day for the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
              <LineChart data={salesTrendData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<ChartTooltipContent indicator="line" />} />
                <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                <CardTitle>Cars Washed Per Day</CardTitle>
            </div>
            <CardDescription>Number of cars washed each day for the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={carsChartConfig} className="h-[300px] w-full">
              <BarChart data={carsWashedData} margin={{ top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-cars)" radius={4}>
                   <LabelList dataKey="count" position="top" offset={5} formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <PieChartIcon className="h-6 w-6 text-primary" />
                <CardTitle>Top Services Availed</CardTitle>
            </div>
            <CardDescription>Distribution of the most popular services.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {topServicesData.length > 0 ? (
                <ChartContainer config={{}} className="h-[300px] w-full max-w-xs">
                    <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
                    <Pie data={topServicesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {topServicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                </ChartContainer>
            ) : <p className="text-muted-foreground py-10">No service data for this period.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle>Daily Revenue by Service Category</CardTitle>
            </div>
            <CardDescription>Breakdown of daily revenue by service category.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                <BarChart data={revenueByCategoryData} margin={{ top: 5, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {SERVICE_CATEGORIES.map((category, index) => (
                        <Bar key={category} dataKey={category} stackId="a" fill={`var(--color-${category})`} radius={[4,4,0,0]} />
                    ))}
                </BarChart>
             </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

