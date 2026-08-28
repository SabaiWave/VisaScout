import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { userId } = await auth();
  const isDev = process.env.ENVIRONMENT === 'development';
  if (!userId || (!isAdminUser(userId) && !isDev)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { briefId?: string };
  const { briefId } = body;
  if (!briefId || typeof briefId !== 'string') {
    return NextResponse.json({ error: 'briefId required' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: brief, error: fetchErr } = await supabase
    .from('briefs')
    .select('id, depth, payment_status, stripe_session_id')
    .eq('id', briefId)
    .single();

  if (fetchErr || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  // Only dismiss free (quick) briefs with no stripe session that are stuck in pending
  if (brief.stripe_session_id || brief.payment_status !== 'pending') {
    return NextResponse.json({ error: 'Not a dismissible brief' }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from('briefs')
    .update({ payment_status: 'error' })
    .eq('id', briefId);

  if (updateErr) {
    await log.error('Admin dismiss-brief failed', { details: updateErr.message, briefId });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
