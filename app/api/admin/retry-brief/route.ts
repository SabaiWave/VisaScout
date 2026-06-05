import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { briefId, jobId } = await req.json() as { briefId?: string; jobId?: string };
  if (!briefId || !jobId) {
    return Response.json({ error: 'briefId and jobId required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const [jobReset, briefReset] = await Promise.all([
    supabase
      .from('brief_jobs')
      .update({ status: 'pending', started_at: null, completed_at: null, error: null })
      .eq('id', jobId),
    supabase
      .from('briefs')
      .update({ payment_status: 'queued' })
      .eq('id', briefId),
  ]);

  if (jobReset.error || briefReset.error) {
    const errMsg = jobReset.error?.message ?? briefReset.error?.message ?? 'DB error';
    log.error('admin: retry-brief failed', { briefId, jobId, errorMessage: errMsg });
    return Response.json({ error: errMsg }, { status: 500 });
  }

  log.info('admin: brief reset for retry', { briefId, jobId, adminUserId: userId });
  return Response.json({ ok: true, briefId, jobId });
}
