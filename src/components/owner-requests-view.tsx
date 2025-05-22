
"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from 'date-fns';
import { Inbox, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { BillingChangeRequest } from '@/types';

export default function OwnerRequestsView() {
  const { billingRequests, updateBillingRequestStatus, currentUser } = useAuth();

  if (currentUser?.role !== 'owner') {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to view this page.</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleUpdateRequestStatus = (id: string, status: 'approved' | 'rejected') => {
    updateBillingRequestStatus(id, status);
  };

  const pendingRequests = billingRequests.filter(req => req.status === 'pending');
  const processedRequests = billingRequests.filter(req => req.status !== 'pending');

  const renderRequestCard = (request: BillingChangeRequest) => (
    <Card key={request.id} className="mb-4 shadow-md bg-card/80 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">Request ID: {request.id}</CardTitle>
                <CardDescription>Wash ID: {request.washId} | Staff: {request.staffName} ({request.staffId})</CardDescription>
                <CardDescription>Requested: {format(parseISO(request.requestedAt), 'PPP p')}</CardDescription>
            </div>
            <Badge variant={
                request.status === 'approved' ? 'default' : 
                request.status === 'rejected' ? 'destructive' : 'secondary'
            } className="capitalize">
                {request.status}
            </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-1">Details:</p>
        <p className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md text-sm">{request.requestDetails}</p>
      </CardContent>
      {request.status === 'pending' && (
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleUpdateRequestStatus(request.id, 'approved')}
            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Approve
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <XCircle className="mr-2 h-4 w-4" /> Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  );


  return (
    <div className="space-y-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Inbox className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Pending Billing Change Requests</CardTitle>
          </div>
          <CardDescription>Review and process new requests from staff.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-4">No pending requests.</p>
          ) : (
            <ScrollArea className="h-[400px] pr-3">
              {pendingRequests.map(renderRequestCard)}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-semibold">Processed Requests History</CardTitle>
            <CardDescription>Archive of approved and rejected billing change requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-4">No processed requests yet.</p>
          ) : (
            <ScrollArea className="h-[300px] pr-3">
                {processedRequests.sort((a,b) => parseISO(b.requestedAt).getTime() - parseISO(a.requestedAt).getTime()).map(renderRequestCard)}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

