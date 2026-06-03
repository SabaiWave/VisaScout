import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { revokeEarlyAccess } from '@/src/lib/earlyAccess';
import { log } from '@/src/lib/logger';

export const runtime = 'nodejs';

const RevokeSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId || !isAdminUser(adminId)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RevokeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'userId is required' }, { status: 400 });
  }

  const { userId } = parsed.data;
  await revokeEarlyAccess(userId);
  log.info('early-access: access revoked', { targetUserId: userId, adminId });

  return Response.json({ ok: true });
}
