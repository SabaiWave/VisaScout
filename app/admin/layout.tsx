import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { AppShell } from '@/app/components/AppShell';

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const isAdmin = isAdminUser(userId);
  const showDev = isAdmin;

  return (
    <AppShell isAdmin={isAdmin} showDev={showDev}>
      {children}
    </AppShell>
  );
}
