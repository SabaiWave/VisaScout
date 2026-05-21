import { auth, clerkClient } from '@clerk/nextjs/server';
import { type NextRequest } from 'next/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';

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
  const deleted: Record<string, number | string> = {};

  // Get brief IDs first — brief_jobs FK has no CASCADE
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
    deleted.brief_jobs = count ?? 0;
  } else {
    deleted.brief_jobs = 0;
  }

  const { count: briefCount } = await supabase
    .from('briefs')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId);
  deleted.briefs = briefCount ?? 0;

  const { count: freeCount } = await supabase
    .from('free_brief_daily')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId);
  deleted.free_brief_daily = freeCount ?? 0;

  const { count: abuseCount } = await supabase
    .from('ip_abuse_log')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId);
  deleted.ip_abuse_log = abuseCount ?? 0;

  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(targetUserId);
    deleted.clerk = 'deleted';
  } catch (err) {
    deleted.clerk = `error: ${err instanceof Error ? err.message : 'unknown'}`;
  }

  return Response.json({ ok: true, deleted });
}
