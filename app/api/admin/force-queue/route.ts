import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { userId } = await auth();
  const isDev = process.env.ENVIRONMENT === 'development';
  if (!userId || (!isAdminUser(userId) && !isDev)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { briefId } = await req.json() as { briefId?: string };
  if (!briefId) {
    return Response.json({ error: 'briefId required' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Insert job row — 23505 = already exists, safe to ignore
  const { error: jobError } = await supabase
    .from('brief_jobs')
    .insert({ brief_id: briefId });

  if (jobError && jobError.code !== '23505') {
    log.error('admin: force-queue failed', { briefId, errorMessage: jobError.message });
    return Response.json({ error: jobError.message }, { status: 500 });
  }

  // Ensure brief is queued so poll endpoint will claim it
  await supabase
    .from('briefs')
    .update({ payment_status: 'queued' })
    .eq('id', briefId);

  log.info('admin: brief force-queued', { briefId, adminUserId: userId });
  return Response.json({ ok: true });
}
