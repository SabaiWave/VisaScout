import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { getSupabase } from '@/src/lib/supabase';
import { getOrCreateUser } from '@/src/lib/users';

export const runtime = 'nodejs';

// Mirrors the data shape created by real checkout + Stripe webhook.
// Uses the same Supabase inserts — no special-casing anywhere downstream.
// Poll route + runPipeline execute identically to a real paid brief.
const SIM_INPUT = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'Visa Exemption',
  freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
  depth: 'standard' as const,
};

export async function GET() {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const user = await getOrCreateUser(userId);

    // Step 1: create shell brief — same as createShellBrief() in checkout flow
    const { data: briefRow, error: briefErr } = await getSupabase()
      .from('briefs')
      .insert({
        nationality: SIM_INPUT.nationality,
        destination: SIM_INPUT.destination,
        visa_type: SIM_INPUT.visaType,
        freeform_input: SIM_INPUT.freeform,
        depth: SIM_INPUT.depth,
        user_id: user.id,
        payment_status: 'queued',  // same state webhook sets after Stripe payment
        funded_by: 'stripe',
        is_dry_run: process.env.DRY_RUN === 'true',
        degraded: false,
      })
      .select('id')
      .single();

    if (briefErr || !briefRow) {
      return Response.json({ error: `Failed to create sim brief: ${briefErr?.message ?? 'unknown'}` }, { status: 500 });
    }

    const briefId = (briefRow as { id: string }).id;

    // Step 2: create brief_jobs row — same as what the Stripe webhook inserts
    const { data: jobRow, error: jobErr } = await getSupabase()
      .from('brief_jobs')
      .insert({
        brief_id: briefId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (jobErr || !jobRow) {
      // Non-fatal — clean up brief and return error
      await getSupabase().from('briefs').delete().eq('id', briefId);
      return Response.json({ error: `Failed to create sim job: ${jobErr?.message ?? 'unknown'}` }, { status: 500 });
    }

    // Step 3: redirect to real pending page — poll route handles everything from here
    // No dev=true param: pending page enters real polling mode, not the dev brief API shortcut
    return new Response(null, {
      status: 302,
      headers: { Location: `/brief/pending?brief_id=${briefId}&depth=${SIM_INPUT.depth}` },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
