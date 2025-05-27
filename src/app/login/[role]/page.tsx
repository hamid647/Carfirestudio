
import LoginRoleForm from '@/components/login-role-form';
import type { Role } from '@/types';

export async function generateStaticParams() {
  return [{ role: 'owner' as Role }, { role: 'staff' as Role }];
}

interface LoginPageForRolePageProps {
  params: { role: Role };
}

// This component (the default export of a page.tsx) is a Server Component by default.
// It should NOT have "use client".
export default function LoginPageForRolePage({ params }: LoginPageForRolePageProps) {
  const { role } = params; // This is the correct way to access params in a Server Component page.

  // The actual form and client-side logic, including invalid role handling,
  // is in the LoginRoleForm client component.
  return <LoginRoleForm role={role} />;
}

    