
// IMPORTANT: This is a MOCKED API route for frontend demonstration purposes.
// You MUST replace this with your actual backend logic that connects to MongoDB,
// validates credentials with bcrypt, and generates a JWT.

import { NextResponse } from 'next/server';
import type { User, Role } from '@/types';

// Mock user data - in a real app, this comes from your MongoDB
const MOCK_USERS_DB: Record<Role, Omit<User, 'token'>> = {
  owner: { id: 'owner-001', username: 'Actual Owner', email: 'owner@washlytics.com', role: 'owner' },
  staff: { id: 'staff-001', username: 'Actual Staff', email: 'staff@washlytics.com', role: 'staff' },
};

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json() as { email: string; password: string; role: Role };

    if (!email || !password || !role) {
      return NextResponse.json({ message: 'Email, password, and role are required.' }, { status: 400 });
    }

    // --- MOCK AUTHENTICATION LOGIC ---
    // In a real application:
    // 1. Connect to MongoDB.
    // 2. Find user by email.
    // 3. If user found, compare `password` with stored hashed password using bcrypt.compare().
    // 4. If password matches, generate a JWT.

    const mockUserForRole = MOCK_USERS_DB[role];

    if (mockUserForRole && mockUserForRole.email === email) {
      // Simulate password check (in a real app, use bcrypt)
      // For this mock, any password for the known email/role is accepted.
      if (password.length > 0 ) { // Minimal password check for mock
        const userWithToken: User = {
          ...mockUserForRole,
          token: `mock-jwt-token-for-${role}-${Date.now()}`, // Mock JWT
        };
        return NextResponse.json({ message: 'Login successful', user: userWithToken }, { status: 200 });
      }
    }
    
    // --- END MOCK AUTHENTICATION LOGIC ---

    return NextResponse.json({ message: 'Invalid email, password, or role.' }, { status: 401 });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}
