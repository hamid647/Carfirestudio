
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
