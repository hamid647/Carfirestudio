
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import type { Role } from '@/types';
import { LogIn, ArrowLeft, Loader2 } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormSchemaType = z.infer<typeof loginFormSchema>;

export default function LoginPageForRole() {
  const router = useRouter();
  const params = useParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const role = params.role as Role;

  const form = useForm<LoginFormSchemaType>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormSchemaType) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed. Please check your credentials.');
      }
      
      // Assuming result contains: { id: string, username: string, email: string, role: Role, token: string }
      login(result.user); // Pass the whole user object including the token

      toast({
        title: "Login Successful",
        description: `Welcome back, ${result.user.username}!`,
        className: "bg-accent text-accent-foreground",
      });
      router.push('/dashboard');

    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!role || (role !== 'owner' && role !== 'staff')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-page-background">
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
                <CardTitle>Invalid Role</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The specified role is invalid. Please go back and select a valid role.</p>
                <Button onClick={() => router.push('/login')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Role Selection
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-page-background selection:bg-primary/20">
       <div className="absolute top-6 left-6">
        <Button variant="outline" onClick={() => router.push('/login')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Role Selection
        </Button>
      </div>
      <div className="flex flex-col items-center mb-8">
         <svg width="48" height="48" viewBox="0 0 24 24" fill="hsl(var(--primary))" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-8.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 5c1.66 0 3-1.34 3-3H9c0 1.66 1.34 3 3 3zm-5.41-5.07c-.06.16-.09.32-.09.49 0 1.1.9 2 2 2s2-.9 2-2c0-.17-.03-.33-.09-.49C10.49 11.82 9 11.48 9 10.5c0-.51.26-.95.66-1.22-.01-.12-.06-.38-.06-.58 0-.66.54-1.2 1.2-1.2.23 0 .45.07.63.18.25-.57.83-1 1.57-1s1.32.43 1.57 1c.18-.11.4-.18.63-.18.66 0 1.2.54 1.2 1.2 0 .2-.05.46-.06.58.4.27.66.71.66 1.22 0 .98-1.49 1.32-1.91 1.92-.06-.16-.09-.32-.09-.49 0-1.1-.9-2-2-2s-2 .9-2 2c0 .17.03.33.09.49-1.49.32-1.91.92-1.91 1.92z"/>
          </svg>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 mt-3">
          Washlytics Login
        </h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold mt-2">Login as {role.charAt(0).toUpperCase() + role.slice(1)}</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <footer className="w-full max-w-6xl mt-10 text-center text-sm text-muted-foreground">
         &copy; {new Date().getFullYear()} Washlytics. All rights reserved.
       </footer>
    </div>
  );
}

