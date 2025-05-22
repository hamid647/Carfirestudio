
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout, currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Authenticating...</p>
      </div>
    );
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
