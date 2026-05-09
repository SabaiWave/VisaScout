import { getSupabase } from '@/src/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const briefId = searchParams.get('brief_id');

  if (!briefId) {
    return new Response(JSON.stringify({ error: 'brief_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await getSupabase()
    .from('briefs')
    .select('id, payment_status')
    .eq('id', briefId)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ status: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: data.payment_status, briefId: data.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
