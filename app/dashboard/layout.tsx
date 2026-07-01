import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { AppSidebar } from '@/app/components/AppSidebar';
import { MobileNav } from './MobileNav';

export default async function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const isAdmin = isAdminUser(userId);
  const showDev = isAdmin && process.env.ENVIRONMENT === 'development';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      <AppSidebar isAdmin={isAdmin} showDev={showDev} />
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bloom-app-bg)' }}>
        <MobileNav isAdmin={isAdmin} showDev={showDev} />
        {children}
      </div>
    </div>
  );
}
