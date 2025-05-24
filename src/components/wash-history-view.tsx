
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { WashRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditWashForm from '@/components/edit-wash-form';
import { format, parseISO } from 'date-fns';
import { Trash2, Edit, History, Search, Eye, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
// No longer importing static WASH_SERVICES, will get from useAuth

export default function WashHistoryView() {
  const { currentUser, washRecords, deleteWashRecord, services: WASH_SERVICES } = useAuth(); // Get services from context
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWashToEdit, setSelectedWashToEdit] = useState<WashRecord | null>(null);

  const recordsToDisplay = washRecords
    .filter(record =>
      record.washId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.carYear && record.carYear.toString().includes(searchTerm))
    )
    .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());


  const handleEdit = (wash: WashRecord) => {
    setSelectedWashToEdit(wash);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (washId: string) => {
    deleteWashRecord(washId);
  };
  
  if (!currentUser) {
    return <p className="text-center py-10">Loading...</p>;
  }

  const renderWashDetailsContent = (wash: WashRecord) => {
    const washDate = parseISO(wash.createdAt);
    const subtotal = wash.selectedServices.reduce((acc, serviceId) => {
        const service = WASH_SERVICES.find(s => s.id === serviceId);
        return acc + (service ? service.price : 0);
    }, 0);
    const discountApplied = wash.discountPercentage && wash.discountPercentage > 0;
    const discountAmount = discountApplied ? subtotal * (wash.discountPercentage! / 100) : 0;
    const finalCost = discountApplied ? subtotal - discountAmount : wash.totalCost; 

    return (
        <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 py-4 text-left pr-4">
                <p><strong>Car:</strong> {wash.carMake} {wash.carModel} ({wash.carYear})</p>
                <p><strong>Condition:</strong> {wash.carCondition}</p>
                <p><strong>Preferences:</strong> {wash.customerPreferences || 'N/A'}</p>
                <p><strong>Selected Services:</strong></p>
                <ul className="list-disc list-inside ml-4">
                    {wash.selectedServices.map(serviceId => {
                        const serviceDetails = WASH_SERVICES.find(s => s.id === serviceId);
                        return <li key={serviceId}>{serviceDetails ? `${serviceDetails.name} ($${serviceDetails.price.toFixed(2)})` : serviceId}</li>;
                    })}
                </ul>
                <p><strong>Notes for Owner:</strong> {wash.ownerNotes || 'N/A'}</p>
                <hr className="my-2" />
                {discountApplied ? (
                    <>
                        <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
                        <p className="text-green-600"><strong>Discount ({wash.discountPercentage}%):</strong> -${discountAmount.toFixed(2)}</p>
                        <p className="font-semibold"><strong>Final Total Cost:</strong> <span className="text-primary">${finalCost.toFixed(2)}</span></p>
                    </>
                ) : (
                    <p className="font-semibold"><strong>Total Cost:</strong> <span className="text-primary">${wash.totalCost.toFixed(2)}</span></p>
                )}
                <p><strong>Date Created:</strong> {format(washDate, 'PPpp')}</p>
            </div>
        </ScrollArea>
    );
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <History className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Wash History</CardTitle>
          </div>
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, Make, Model, Year..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardDescription>
          View all recorded wash transactions. {currentUser.role === 'owner' ? 'Owners can edit or delete records.' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recordsToDisplay.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No wash records found{searchTerm ? ' matching your search' : ''}.</p>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Wash ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsToDisplay.map((wash) => {
                  const washDate = parseISO(wash.createdAt);
                  return (
                    <TableRow key={wash.washId}>
                      <TableCell className="font-medium">{wash.washId}</TableCell>
                      <TableCell>
                        {format(washDate, 'PPpp')}
                      </TableCell>
                      <TableCell>{wash.carMake} {wash.carModel} ({wash.carYear})</TableCell>
                      <TableCell className="text-right">
                        ${wash.totalCost.toFixed(2)}
                        {wash.discountPercentage && wash.discountPercentage > 0 && (
                            <span className="text-xs text-green-600 ml-1 block">({wash.discountPercentage}% off)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {currentUser.role === 'owner' ? (
                          <div className="flex items-center justify-center gap-1">
                            <Dialog open={isEditDialogOpen && selectedWashToEdit?.washId === wash.washId} onOpenChange={(open) => {
                                if (!open) setSelectedWashToEdit(null); 
                                setIsEditDialogOpen(open);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => handleEdit(wash)}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </DialogTrigger>
                              {selectedWashToEdit && selectedWashToEdit.washId === wash.washId && (
                                <DialogContent className="sm:max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Wash Record: {selectedWashToEdit.washId}</DialogTitle>
                                  </DialogHeader>
                                  <EditWashForm
                                    washRecord={selectedWashToEdit}
                                    onFinished={() => {
                                        setIsEditDialogOpen(false);
                                        setSelectedWashToEdit(null); 
                                    }}
                                  />
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline" className="mt-4 w-full">Close</Button>
                                  </DialogClose>
                                </DialogContent>
                              )}
                            </Dialog>
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
                                    This action cannot be undone. This will permanently delete the wash record <span className="font-semibold">{wash.washId}</span>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(wash.washId)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
                           <Dialog>
                                <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:text-primary">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View Details</span>
                                </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Wash Details: {wash.washId}</DialogTitle>
                                </DialogHeader>
                                {renderWashDetailsContent(wash)}
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="mt-4 w-full">Close</Button>
                                </DialogClose>
                                </DialogContent>
                            </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground pt-4 border-t">
        Showing {recordsToDisplay.length} of {washRecords.length} total wash records.
      </CardFooter>
    </Card>
  );
}
