import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { redeemInviteCode } from '@/src/lib/inviteAccess';
import { getOrCreateUser } from '@/src/lib/users';
import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';
import { checkRateLimit } from '@/src/lib/rateLimit';

export const runtime = 'nodejs';

const RedeemSchema = z.object({
  code: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: rateCheck.retryAfter ? { 'Retry-After': String(rateCheck.retryAfter) } : {},
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RedeemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'code is required' }, { status: 400 });
  }

  const { code } = parsed.data;
  const user = await getOrCreateUser(userId).catch(() => null);
  const result = await redeemInviteCode(userId, code);

  if (!result.ok) {
    await log.warn('invite: redemption failed', { userId, userEmail: user?.email ?? null, codeAttempted: code, reason: result.error });
    return Response.json({ error: result.error }, { status: result.status });
  }

  await trackEvent('invite.redeemed', { userId, codeUsed: code });
  log.info('invite: code redeemed', { userId, userEmail: user?.email ?? null, codeUsed: code });

  return Response.json({ ok: true });
}
