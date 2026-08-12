import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { AppShell } from '@/app/components/AppShell';

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  const isAdmin = userId ? isAdminUser(userId) : false;
  const showDev = isAdmin;

  return (
    <AppShell isAdmin={isAdmin} showDev={showDev} isSignedIn={!!userId}>
      {children}
    </AppShell>
  );
}
