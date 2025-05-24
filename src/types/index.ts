
export type Role = 'owner' | 'staff';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface BillingChangeRequest {
  id: string;
  washId: string; // ID of the original wash transaction
  staffId: string; // ID of the staff member requesting
  staffName: string;
  requestDetails: string;
  requestedAt: string; // ISO date string
  status: 'pending' | 'approved' | 'rejected';
}

// Defines the structure for a car wash record
export interface WashRecord {
  washId: string; // Unique ID for the wash, typically generated with a timestamp
  carMake: string;
  carModel: string;
  carYear: number;
  carCondition: string;
  customerPreferences?: string;
  ownerNotes?: string;
  selectedServices: string[]; // Array of service IDs
  totalCost: number;
  discountPercentage?: number; // Optional discount percentage
  createdAt: string; // ISO date string when the record was created
}

export interface NotificationRecord {
  id: string;
  userId: string; // ID of the user this notification is for (or 'owner'/'staff' for role-based)
  roleTarget?: Role; // For role-based notifications
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  link?: string; // Optional link for navigation (e.g., /dashboard?tab=billing-requests&requestId=123)
  relatedRecordId?: string; // Optional: ID of the record this notification pertains to (e.g. washId or billingRequestId)
}

