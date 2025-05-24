
"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_CATEGORIES } from "@/config/services"; // Keep for categories
import type { WashRecord } from "@/types";
import { Car, ListChecks, ShoppingCart, MessageSquare, Save, Percent, User as UserIcon } from "lucide-react";

const editWashFormSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  carMake: z.string().min(2, { message: "Car make must be at least 2 characters." }),
  carModel: z.string().min(1, { message: "Car model is required." }),
  carYear: z.coerce.number().min(1900, { message: "Invalid year." }).max(new Date().getFullYear() + 1, { message: "Invalid year." }),
  carCondition: z.string().min(5, { message: "Condition description is too short." }),
  customerPreferences: z.string().optional(),
  ownerNotes: z.string().optional(),
  selectedServices: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one service.",
  }),
  discountPercentage: z.coerce.number().min(0, "Discount cannot be negative.").max(100, "Discount cannot exceed 100%.").optional(),
});

type EditWashFormData = z.infer<typeof editWashFormSchema>;

interface EditWashFormProps {
  washRecord: WashRecord;
  onFinished: () => void;
}

export default function EditWashForm({ washRecord, onFinished }: EditWashFormProps) {
  const { toast } = useToast();
  const { updateWashRecord, currentUser, services: WASH_SERVICES } = useAuth(); // Get services from context
  
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotalCost, setFinalTotalCost] = useState(0);

  const form = useForm<EditWashFormData>({
    resolver: zodResolver(editWashFormSchema),
    defaultValues: {
      customerName: washRecord.customerName,
      carMake: washRecord.carMake,
      carModel: washRecord.carModel,
      carYear: washRecord.carYear,
      carCondition: washRecord.carCondition,
      customerPreferences: washRecord.customerPreferences || "",
      ownerNotes: washRecord.ownerNotes || "",
      selectedServices: washRecord.selectedServices || [],
      discountPercentage: washRecord.discountPercentage || 0,
    },
  });

  const selectedServiceIds = form.watch("selectedServices");
  const discountInputPercentage = form.watch("discountPercentage");

  useEffect(() => {
    const currentSubtotal = selectedServiceIds.reduce((acc, id) => {
      const service = WASH_SERVICES.find(s => s.id === id);
      return acc + (service ? service.price : 0);
    }, 0);
    setSubtotal(currentSubtotal);

    const currentDiscountValue = discountInputPercentage || 0;
    const currentDiscountAmount = currentSubtotal * (currentDiscountValue / 100);
    setDiscountAmount(currentDiscountAmount);

    const currentFinalTotal = currentSubtotal - currentDiscountAmount;
    setFinalTotalCost(currentFinalTotal);

  }, [selectedServiceIds, discountInputPercentage, WASH_SERVICES]);

  function onSubmit(data: EditWashFormData) {
    if (currentUser?.role !== 'owner') {
      toast({ title: "Unauthorized", description: "Only owners can update wash records.", variant: "destructive" });
      return;
    }

    const updatedWashData: Partial<Omit<WashRecord, 'washId' | 'createdAt'>> = {
      ...data,
      carYear: Number(data.carYear),
      totalCost: finalTotalCost, 
      discountPercentage: data.discountPercentage || 0,
    };
    
    updateWashRecord(washRecord.washId, updatedWashData);

    toast({
      title: "Wash Record Updated!",
      description: `Record ${washRecord.washId} for ${data.customerName} has been successfully updated. Final cost: $${finalTotalCost.toFixed(2)}`,
      className: "bg-accent text-accent-foreground"
    });
    onFinished(); 
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <CardContent className="space-y-6 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Customer & Car Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car Make</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2020" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || '')}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carCondition"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Car Condition</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Moderately dirty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPreferences"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Customer Preferences</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Focus on interior" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground"/> Notes for Owner
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Customer mentioned a scratch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Selected Services</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="selectedServices"
                render={() => (
                  <FormItem className="space-y-4">
                    {WASH_SERVICES.length === 0 && <p className="text-muted-foreground">No services available. Please contact an owner to add services.</p>}
                    {SERVICE_CATEGORIES.map(category => {
                      const servicesInCategory = WASH_SERVICES.filter(s => s.category === category);
                      if (servicesInCategory.length === 0) return null;

                      return (
                        <div key={category}>
                          <h3 className="text-lg font-semibold mb-2 text-primary/80">{category}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {servicesInCategory.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="selectedServices"
                              render={({ field }) => (
                                <FormItem
                                  key={service.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), service.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== service.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal cursor-pointer">
                                      {service.name} - ${service.price.toFixed(2)}
                                    </FormLabel>
                                    {service.description && (
                                      <FormDescription className="text-xs">
                                        {service.description}
                                      </FormDescription>
                                    )}
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                          </div>
                          {category !== SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1] && <Separator className="my-6"/>}
                        </div>
                      )
                    })}
                    <FormMessage>{form.formState.errors.selectedServices?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-4 pt-6 border-t sticky bottom-0 bg-background">
          <div className="w-full space-y-2">
            <div className="text-md font-semibold flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            <FormField
              control={form.control}
              name="discountPercentage"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-primary" /> Discount (%)
                    </FormLabel>
                    <FormControl className="w-24">
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => {
                            const val = e.target.value;
                            if (val === "") {
                                field.onChange(undefined); 
                            } else {
                                field.onChange(parseFloat(val));
                            }
                        }}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {discountAmount > 0 && (
                <div className="text-md font-semibold flex justify-between text-green-600">
                    <span>Discount Amount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                </div>
            )}
            <Separator />
            <div className="text-xl font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                    <span>Final Total Cost:</span>
                </div>
                <span className="text-primary">${finalTotalCost.toFixed(2)}</span>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full max-w-xs self-center" disabled={WASH_SERVICES.length === 0}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
