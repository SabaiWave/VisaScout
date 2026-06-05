import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';

const ForceQueueSchema = z.object({ briefId: z.string().uuid() });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const parsed = ForceQueueSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'briefId must be a valid UUID' }, { status: 400 });
  const { briefId } = parsed.data;

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
