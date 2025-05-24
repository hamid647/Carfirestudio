
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form"; // Added Controller
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from '@/hooks/useAuth';
import type { Service, ServiceCategory } from '@/config/services';
import { SERVICE_CATEGORIES } from '@/config/services';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Settings, PlusCircle, Edit3, Trash2 } from 'lucide-react';

const serviceFormSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  description: z.string().optional(),
  category: z.enum(SERVICE_CATEGORIES, { required_error: "Category is required." }),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

export default function ManageServices() {
  const { services, addService, updateService, deleteService, currentUser } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
        name: "",
        price: 0,
        description: "",
        category: undefined,
    }
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      price: service.price,
      description: service.description || "",
      category: service.category,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    form.reset({
      name: "",
      price: 0,
      description: "",
      category: undefined,
    });
    setIsFormOpen(true);
  };

  const onSubmit = (data: ServiceFormData) => {
    if (currentUser?.role !== 'owner') {
        toast({ title: "Unauthorized", description: "Only owners can manage services.", variant: "destructive"});
        return;
    }
    if (editingService) {
      updateService(editingService.id, data);
      toast({ title: "Service Updated", description: `Service "${data.name}" has been updated.`, className: "bg-accent text-accent-foreground" });
    } else {
      addService(data);
      toast({ title: "Service Added", description: `Service "${data.name}" has been added.`, className: "bg-accent text-accent-foreground" });
    }
    setIsFormOpen(false);
    setEditingService(null);
    form.reset({ name: "", price: 0, description: "", category: undefined });
  };

  const handleDelete = (serviceId: string, serviceName: string) => {
    if (currentUser?.role !== 'owner') {
        toast({ title: "Unauthorized", description: "Only owners can delete services.", variant: "destructive"});
        return;
    }
    deleteService(serviceId);
    toast({ title: "Service Deleted", description: `Service "${serviceName}" has been deleted.`, variant: "destructive" });
  };

  if (currentUser?.role !== 'owner') {
    return (
        <Card className="w-full shadow-xl">
            <CardHeader>
                <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You are not authorized to manage services.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Settings className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-bold">Manage Services</CardTitle>
            </div>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                setIsFormOpen(isOpen);
                if (!isOpen) {
                    setEditingService(null);
                    form.reset({ name: "", price: 0, description: "", category: undefined });
                }
            }}>
                <DialogTrigger asChild>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                        <DialogDescription>
                        {editingService ? `Update the details for "${editingService.name}".` : 'Fill in the details for the new service.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name-input">Service Name</Label>
                            <Input id="name-input" {...form.register("name")} className="mt-1" />
                            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="price-input">Price ($)</Label>
                            <Input id="price-input" type="number" step="0.01" {...form.register("price")} className="mt-1" />
                            {form.formState.errors.price && <p className="text-sm text-destructive mt-1">{form.formState.errors.price.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description-input">Description (Optional)</Label>
                            <Textarea id="description-input" {...form.register("description")} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="category-select">Category</Label>
                            <Controller
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <SelectTrigger id="category-select" className="w-full mt-1">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SERVICE_CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.category && <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message}</p>}
                        </div>
                        <DialogFooter className="pt-4">
                           <DialogClose asChild>
                               <Button type="button" variant="outline">Cancel</Button>
                           </DialogClose>
                           <Button type="submit">{editingService ? 'Save Changes' : 'Add Service'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        <CardDescription>Add, edit, or delete car wash services offered.</CardDescription>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No services configured yet. Click "Add New Service" to begin.</p>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.sort((a,b) => a.name.localeCompare(b.name)).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell className="text-right">${service.price.toFixed(2)}</TableCell>
                    <TableCell className="max-w-xs truncate">{service.description || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => handleEdit(service)}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the service: <span className="font-semibold">{service.name}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(service.id, service.name)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

    