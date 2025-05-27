"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { LogIn, ArrowLeft, Loader2 } from 'lucide-react';
import type { Role } from '@/types';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormSchemaType = z.infer<typeof loginFormSchema>;

interface LoginPageProps {
  params: { role: string };
}

export default function LoginPageForRole({ params }: LoginPageProps) {
  const router = useRouter();
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

      login(result.user);

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
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
          10-4.48 10-10S17.52 2 12 2zm0 
          18c-4.41 0-8-3.59-8-8s3.59-8 
          8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-8h5v2h-5v-2z"/>
        </svg>
        <h2 className="text-2xl font-semibold mt-2 capitalize text-center">Login as {role}</h2>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
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
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground justify-center">
          Please enter your credentials to login
        </CardFooter>
      </Card>
    </div>
  );
}
