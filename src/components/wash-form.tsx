
"use client";

import React, { useState, useEffect, useTransition } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; 
import { suggestServices, type SuggestServicesInput, type SuggestServicesOutput } from "@/ai/flows/suggest-services";
import { SERVICE_CATEGORIES } from "@/config/services"; // Keep for categories
import type { WashRecord } from "@/types"; 
import { Car, Sparkles, Bot, AlertCircle, ShoppingCart, Loader2, ListChecks, FileText, MessageSquare, User as UserIcon } from "lucide-react";

const washFormSchema = z.object({
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
});

type WashFormData = z.infer<typeof washFormSchema>;

export default function WashForm() {
  const { toast } = useToast();
  const { addWashRecord, services: WASH_SERVICES } = useAuth(); // Get services from context
  const [isPending, startTransition] = useTransition();
  const [aiSuggestions, setAiSuggestions] = useState<SuggestServicesOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  const form = useForm<WashFormData>({
    resolver: zodResolver(washFormSchema),
    defaultValues: {
      customerName: "",
      carMake: "",
      carModel: "",
      carYear: new Date().getFullYear(),
      carCondition: "",
      customerPreferences: "",
      ownerNotes: "",
      selectedServices: [],
    },
  });

  const selectedServiceIds = form.watch("selectedServices");

  useEffect(() => {
    const cost = selectedServiceIds.reduce((acc, id) => {
      const service = WASH_SERVICES.find(s => s.id === id);
      return acc + (service ? service.price : 0);
    }, 0);
    setTotalCost(cost);
  }, [selectedServiceIds, WASH_SERVICES]);

  const handleAiSuggest = async () => {
    const carDetails = `Make: ${form.getValues("carMake")}, Model: ${form.getValues("carModel")}, Year: ${form.getValues("carYear")}, Condition: ${form.getValues("carCondition")}`;
    const customerPreferences = form.getValues("customerPreferences") || "None specified";

    if (!form.getValues("carMake") || !form.getValues("carModel") || !form.getValues("carCondition")) {
      toast({
        title: "Missing Information",
        description: "Please fill in car make, model, and condition before getting AI suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setAiSuggestions(null);
    setAiError(null);

    startTransition(async () => {
      try {
        const input: SuggestServicesInput = { carDetails, customerPreferences };
        const result = await suggestServices(input);
        setAiSuggestions(result);
        toast({
          title: "AI Suggestions Ready!",
          description: "Check out the AI-powered service recommendations.",
        });
      } catch (error) {
        console.error("AI suggestion error:", error);
        setAiError("Failed to get AI suggestions. Please try again.");
        toast({
          title: "AI Suggestion Error",
          description: "Could not fetch suggestions. Please check console for details.",
          variant: "destructive",
        });
      }
    });
  };

  function onSubmit(data: WashFormData) {
    const washDataForRecord: Omit<WashRecord, 'washId' | 'createdAt'> = {
      ...data,
      carYear: Number(data.carYear), 
      totalCost,
      discountPercentage: 0, // New washes have no discount by default
    };
    
    addWashRecord(washDataForRecord); 

    toast({
      title: "Wash Request Submitted!",
      description: (
        <div>
          <p>Successfully added to wash history for {data.customerName}.</p>
          <p>Total Cost: ${totalCost.toFixed(2)}</p>
          {data.ownerNotes && <p>Notes: {data.ownerNotes}</p>}
        </div>
      ),
      className: "bg-accent text-accent-foreground"
    });
    form.reset();
    setAiSuggestions(null);
    setTotalCost(0); 
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold">New Wash Request</CardTitle>
        </div>
        <CardDescription>Enter customer & car details, select services, and get AI-powered recommendations.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-6">
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
                        <Input type="number" placeholder="e.g., 2020" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || '')} />
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
                        <Textarea placeholder="e.g., Moderately dirty, some bird droppings on hood" {...field} />
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
                      <FormLabel>Customer Preferences (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Focus on interior, allergy concerns" {...field} />
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
                        <MessageSquare className="h-4 w-4 text-muted-foreground"/> Notes for Owner (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Customer mentioned a scratch on the rear bumper, needs owner attention." {...field} />
                      </FormControl>
                       <FormDescription>Any specific notes or observations for the car owner or management.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button type="button" onClick={handleAiSuggest} disabled={isPending} variant="outline" size="lg">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Get AI Service Suggestions
              </Button>
            </div>

            {isPending && (
              <Alert>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <AlertTitle>Loading AI Suggestions...</AlertTitle>
                <AlertDescription>Our AI is thinking. Please wait a moment.</AlertDescription>
              </Alert>
            )}

            {aiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {aiSuggestions && (
              <Card className="bg-primary/5 border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                     <Bot className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl text-primary">AI Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Suggested Services:</h4>
                    <ul className="list-disc list-inside ml-4">
                      {aiSuggestions.suggestedServices.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Reasoning:</h4>
                    <p className="text-sm text-muted-foreground">{aiSuggestions.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListChecks className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Select Services</CardTitle>
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
                                render={({ field }) => {
                                  return (
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
                                  );
                                }}
                              />
                            ))}
                            </div>
                            {category !== SERVICE_CATEGORIES[SERVICE_CATEGORIES.length -1] && <Separator className="my-6"/>}
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

          <CardFooter className="flex flex-col items-center gap-4 pt-6 border-t">
            <div className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-primary" />
              <span>Total Estimated Cost:</span>
              <span className="text-primary">${totalCost.toFixed(2)}</span>
            </div>
            <Button type="submit" size="lg" className="w-full max-w-xs" disabled={WASH_SERVICES.length === 0}>
              Submit Wash Request
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
