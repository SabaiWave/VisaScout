import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { getSupabase } from '@/src/lib/supabase';
import { log } from '@/src/lib/logger';

const RERUN_LIMIT = 1;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: briefId } = await params;

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabase();
  const isAdmin = isAdminUser(userId);

  // Resolve Clerk ID → internal UUID for ownership check
  const { data: userRecord } = await db
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  // Fetch brief — verify ownership (or admin bypass)
  const { data: brief, error: briefErr } = await db
    .from('briefs')
    .select('id, payment_status, user_id, rerun_count')
    .eq('id', briefId)
    .single();

  if (briefErr || !brief) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  if (!isAdmin && (!userRecord || brief.user_id !== userRecord.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only paid briefs can be re-run
  if (brief.payment_status !== 'paid') {
    return Response.json({ error: 'Brief is not eligible for re-run' }, { status: 409 });
  }

  // Enforce re-run cap (admin bypass)
  if (!isAdmin && (brief.rerun_count ?? 0) >= RERUN_LIMIT) {
    return Response.json({ error: 'Re-run limit reached' }, { status: 409 });
  }

  // Find the completed job for this brief
  const { data: job, error: jobErr } = await db
    .from('brief_jobs')
    .select('id')
    .eq('brief_id', briefId)
    .eq('status', 'done')
    .single();

  if (jobErr || !job) {
    return Response.json({ error: 'No completed job found for this brief' }, { status: 409 });
  }

  // Reset both records so the poll mechanism re-claims and re-runs; increment rerun_count
  const [briefReset, jobReset] = await Promise.all([
    db.from('briefs').update({ payment_status: 'queued', rerun_count: (brief.rerun_count ?? 0) + 1 }).eq('id', briefId),
    db.from('brief_jobs').update({ status: 'pending', started_at: null, completed_at: null, error: null }).eq('id', job.id),
  ]);

  if (briefReset.error || jobReset.error) {
    await log.error('rerun: reset failed', {
      briefId,
      briefError: briefReset.error?.message,
      jobError: jobReset.error?.message,
    });
    return Response.json({ error: 'Reset failed' }, { status: 500 });
  }

  log.info('rerun: brief queued for re-run', { briefId, jobId: job.id, requestedBy: userId, isAdmin, rerunCount: (brief.rerun_count ?? 0) + 1 });

  return Response.json({ ok: true });
}
