
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Loader2, Bell, CheckCheck, MailWarning } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from 'date-fns';
import type { NotificationRecord } from '@/types';
import { cn } from '@/lib/utils';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { 
    isAuthenticated, 
    logout, 
    currentUser, 
    isLoading,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount
  } = useAuth();
  const router = useRouter();
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  const userNotifications = notifications
    .filter(n => n.userId === currentUser.id || n.roleTarget === currentUser.role)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = getUnreadNotificationCount();

  const handleNotificationClick = (notification: NotificationRecord) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setIsNotificationPopoverOpen(false); // Close popover after interaction
  };
  
  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  }

  return (
    <div className="min-h-screen flex flex-col bg-page-background">
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="hsl(var(--primary))" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-8.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 5c1.66 0 3-1.34 3-3H9c0 1.66 1.34 3 3 3zm-5.41-5.07c-.06.16-.09.32-.09.49 0 1.1.9 2 2 2s2-.9 2-2c0-.17-.03-.33-.09-.49C10.49 11.82 9 11.48 9 10.5c0-.51.26-.95.66-1.22-.01-.12-.06-.38-.06-.58 0-.66.54-1.2 1.2-1.2.23 0 .45.07.63.18.25-.57.83-1 1.57-1s1.32.43 1.57 1c.18-.11.4-.18.63-.18.66 0 1.2.54 1.2 1.2 0 .2-.05.46-.06.58.4.27.66.71.66 1.22 0 .98-1.49 1.32-1.91 1.92-.06-.16-.09-.32-.09-.49 0-1.1-.9-2-2-2s-2 .9-2 2c0 .17.03.33.09.49-1.49.32-1.91.92-1.91 1.92z"/>
             </svg>
            <h1 className="text-2xl font-bold text-primary">Washlytics</h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCircle className="h-5 w-5" />
                <span>{currentUser.username} ({currentUser.role})</span>
              </div>
            )}

            <Popover open={isNotificationPopoverOpen} onOpenChange={setIsNotificationPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                </div>
                {userNotifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    <MailWarning className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    No new notifications.
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[300px]">
                      <div className="divide-y">
                        {userNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              "p-3 hover:bg-muted/50 cursor-pointer",
                              !notif.read && "bg-primary/10"
                            )}
                          >
                            <p className={cn("text-sm mb-0.5", !notif.read && "font-semibold")}>{notif.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNowStrict(new Date(notif.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {unreadCount > 0 && (
                      <div className="p-2 border-t">
                        <Button variant="link" size="sm" className="w-full" onClick={handleMarkAllRead}>
                          <CheckCheck className="mr-2 h-4 w-4"/> Mark all as read
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login'); }}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
       <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
         &copy; {new Date().getFullYear()} Washlytics. All rights reserved.
       </footer>
    </div>
  );
}
