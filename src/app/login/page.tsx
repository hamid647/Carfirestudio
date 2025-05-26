
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { User, LogIn } from 'lucide-react';

export default function RoleSelectionPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleRoleSelect = (role: 'owner' | 'staff') => {
    router.push(`/login/${role}`);
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-page-background selection:bg-primary/20">
      <div className="flex flex-col items-center mb-12">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="hsl(var(--primary))" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-8.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 5c1.66 0 3-1.34 3-3H9c0 1.66 1.34 3 3 3zm-5.41-5.07c-.06.16-.09.32-.09.49 0 1.1.9 2 2 2s2-.9 2-2c0-.17-.03-.33-.09-.49C10.49 11.82 9 11.48 9 10.5c0-.51.26-.95.66-1.22-.01-.12-.06-.38-.06-.58 0-.66.54-1.2 1.2-1.2.23 0 .45.07.63.18.25-.57.83-1 1.57-1s1.32.43 1.57 1c.18-.11.4-.18.63-.18.66 0 1.2.54 1.2 1.2 0 .2-.05.46-.06.58.4.27.66.71.66 1.22 0 .98-1.49 1.32-1.91 1.92-.06-.16-.09-.32-.09-.49 0-1.1-.9-2-2-2s-2 .9-2 2c0 .17.03.33.09.49-1.49.32-1.91.92-1.91 1.92z"/>
          </svg>
          <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 mt-4">
            Washlytics
          </h1>
        </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl font-bold mt-2">Select Your Role</CardTitle>
          <CardDescription>Please select your role to proceed to login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <Button
            onClick={() => handleRoleSelect('owner')}
            className="w-full py-3 text-lg"
            size="lg"
          >
            <User className="mr-2 h-5 w-5" /> Continue as Owner
          </Button>
          <Button
            onClick={() => handleRoleSelect('staff')}
            variant="secondary"
            className="w-full py-3 text-lg"
            size="lg"
          >
            <User className="mr-2 h-5 w-5" /> Continue as Staff
          </Button>
        </CardContent>
      </Card>
       <footer className="w-full max-w-6xl mt-12 text-center text-sm text-muted-foreground">
         &copy; {new Date().getFullYear()} Washlytics. All rights reserved.
       </footer>
    </div>
  );
}
