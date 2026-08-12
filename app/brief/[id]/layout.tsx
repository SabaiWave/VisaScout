import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { AppShell } from '@/app/components/AppShell';

export default async function BriefIdLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) return <>{children}</>;

  const isAdmin = isAdminUser(userId);
  const showDev = isAdmin;

  return (
    <AppShell isAdmin={isAdmin} showDev={showDev}>
      {children}
    </AppShell>
  );
}
