
"use client";

import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { FileEdit } from 'lucide-react';

const billingChangeRequestSchema = z.object({
  washId: z.string().min(1, { message: "Original Wash ID is required." }),
  requestDetails: z.string().min(10, { message: "Please provide detailed reasons for the change (min 10 characters)." }),
});

type BillingChangeRequestFormData = z.infer<typeof billingChangeRequestSchema>;

export default function BillingChangeRequestForm() {
  const { addBillingRequest, currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<BillingChangeRequestFormData>({
    resolver: zodResolver(billingChangeRequestSchema),
    defaultValues: {
      washId: "",
      requestDetails: "",
    },
  });

  function onSubmit(data: BillingChangeRequestFormData) {
    if (!currentUser || currentUser.role !== 'staff') {
        toast({
            title: "Unauthorized",
            description: "Only staff members can submit billing change requests.",
            variant: "destructive",
        });
        return;
    }
    addBillingRequest(data);
    toast({
      title: "Billing Change Request Submitted",
      description: `Request for Wash ID: ${data.washId} has been sent to the owner for review.`,
      className: "bg-accent text-accent-foreground"
    });
    form.reset();
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <FileEdit className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Request Billing Change</CardTitle>
        </div>
        <CardDescription>Submit a request to the owner for changes to a previous wash billing.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="washId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Wash ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the WASH-XXXXXXX ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the unique identifier for the wash transaction you want to modify.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Change Request</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain in detail why this billing needs to be changed. For example, 'Customer was incorrectly charged for ceramic coating but only received premium wash. Should refund $XX.XX...'"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    Provide a clear and concise explanation for the owner to review.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" className="w-full" size="lg">Submit Request</Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
