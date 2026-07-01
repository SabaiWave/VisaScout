import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';

export const dynamic = 'force-dynamic';

export default async function ErrorTestPage() {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) notFound();
  throw new Error('[DEBUG] Intentional test error — triggered via /debug/error');
}
