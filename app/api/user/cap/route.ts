import { auth } from '@clerk/nextjs/server';
import { checkFreeTierCap, getFreeDailyLimit, getAdminDailyLimit } from '@/src/lib/freeTier';
import { isAdminUser } from '@/src/lib/adminAccess';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = isAdminUser(userId) ? getAdminDailyLimit() : getFreeDailyLimit();
  const cap = await checkFreeTierCap(userId, limit);
  return Response.json(cap);
}
