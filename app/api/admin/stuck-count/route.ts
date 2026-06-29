import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';

export const runtime = 'nodejs';

const STUCK_THRESHOLD_MIN = 15;

export async function GET(req: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  const isDev = process.env.ENVIRONMENT === 'development';
  const isAuthorized =
    (userId && isAdminUser(userId)) ||
    (token && process.env.MONITOR_SECRET && token === process.env.MONITOR_SECRET) ||
    (isDev && !!userId);

  if (!isAuthorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const thresholdTime = new Date(Date.now() - STUCK_THRESHOLD_MIN * 60 * 1000).toISOString();

  const { data, error } = await getSupabase()
    .from('briefs')
    .select('id, payment_status, created_at, destination, depth, nationality')
    .in('payment_status', ['pending', 'queued'])
    .lt('created_at', thresholdTime)
    .not('user_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    log.error('stuck-count: query failed', { errorMessage: error.message });
    return Response.json({ ok: false, error: 'Database query failed' }, { status: 500 });
  }

  const stuckBriefs = data ?? [];
  const stuckCount = stuckBriefs.length;

  const briefs = stuckBriefs.map(b => ({
    id: b.id,
    payment_status: b.payment_status,
    destination: b.destination,
    depth: b.depth,
    nationality: b.nationality,
    minutesOld: Math.round((Date.now() - new Date(b.created_at).getTime()) / 60000),
  }));

  return Response.json({ ok: stuckCount === 0, stuckCount, briefs });
}
