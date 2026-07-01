import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { getSupabase } from '@/src/lib/supabase';

export const runtime = 'nodejs';

const NATIONALITIES = ['American', 'British', 'Australian', 'German', 'French'];
const DESTINATIONS = ['Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Singapore'];
const DEPTHS = ['quick', 'standard'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return new Response('Not found', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const scenario = searchParams.get('scenario');

  if (scenario !== '2' && scenario !== '3') {
    return Response.json({ ok: false, error: 'scenario must be 2 or 3' }, { status: 400 });
  }
  const supabase = getSupabase();
  const nationality = pick(NATIONALITIES);
  const destination = pick(DESTINATIONS);
  const depth = pick(DEPTHS);
  const fakeSessionId = `cs_test_sim_${Date.now()}`;
  // Backdate so stuck-count endpoint (15 min threshold) detects it immediately
  const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  // Insert brief with stripe_session_id (payment confirmed) but no job record yet
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .insert({
      nationality,
      destination,
      depth,
      freeform_input: `[DEV SIM scenario ${scenario}] How long can I stay?`,
      payment_status: 'queued',
      stripe_session_id: fakeSessionId,
      user_id: userId ?? null,
      created_at: twentyMinAgo,
    })
    .select('id')
    .single();

  if (briefError || !brief) {
    return Response.json({ ok: false, error: briefError?.message ?? 'Insert failed' }, { status: 500 });
  }

  const briefId = (brief as { id: string }).id;

  // Scenario 3: also insert a failed job so Retry button appears
  if (scenario === '3') {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabase.from('brief_jobs').insert({
      brief_id: briefId,
      status: 'failed',
      started_at: tenMinutesAgo,
      completed_at: new Date().toISOString(),
      error: 'Simulated: Anthropic API timeout after 300s',
    });
  }

  return Response.json({
    ok: true,
    scenario: Number(scenario),
    briefId,
    nationality,
    destination,
    depth,
    stripeSessionId: fakeSessionId,
    next: `Check /admin → SUPPORT — STUCK BRIEFS to verify the action button`,
  });
}
