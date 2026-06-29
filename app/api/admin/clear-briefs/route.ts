import { auth } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';

export async function POST(req: NextRequest) {
  const { userId: callerId } = await auth();
  if (!callerId || !isAdminUser(callerId)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let targetUserId: string;
  try {
    const body = await req.json() as { userId?: string };
    if (!body.userId || typeof body.userId !== 'string' || !body.userId.trim()) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }
    targetUserId = body.userId.trim();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = getSupabase();
  const cleared: Record<string, number> = {};

  const { data: userBriefs } = await supabase
    .from('briefs')
    .select('id')
    .eq('user_id', targetUserId);

  const briefIds = (userBriefs ?? []).map((b: { id: string }) => b.id);

  if (briefIds.length > 0) {
    const { count } = await supabase
      .from('brief_jobs')
      .delete({ count: 'exact' })
      .in('brief_id', briefIds);
    cleared.brief_jobs = count ?? 0;
  } else {
    cleared.brief_jobs = 0;
  }

  const { count: briefCount } = await supabase
    .from('briefs')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId);
  cleared.briefs = briefCount ?? 0;

  const { count: freeCount } = await supabase
    .from('free_brief_daily')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId);
  cleared.free_brief_daily = freeCount ?? 0;

  log.info('admin.clear_briefs', {
    callerUserId: callerId,
    targetUserId,
    briefs: cleared.briefs,
    brief_jobs: cleared.brief_jobs,
    free_brief_daily: cleared.free_brief_daily,
  });
  await trackEvent('admin.clear_briefs', {
    callerUserId: callerId,
    targetUserId,
    briefs: cleared.briefs,
    brief_jobs: cleared.brief_jobs,
    free_brief_daily: cleared.free_brief_daily,
  });

  return Response.json({ ok: true, cleared });
}
