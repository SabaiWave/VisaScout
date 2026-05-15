import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from '@/src/lib/supabase';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { updateBriefWithContent } from '@/src/lib/saveBrief';
import { runDryPipeline } from '@/src/lib/dryRun';
import { resetUsage, getUsageLog, calculateReportCost } from '@/src/lib/cost';
import { log } from '@/src/lib/logger';
import type { VisaInput, VisaRequest } from '@/src/types/index';

export const runtime = 'nodejs';
// Generous timeout — deep pipeline can take 200–240s
export const maxDuration = 300;

const DRY_RUN = process.env.DRY_RUN === 'true';

export async function GET(req: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  // In local dev CRON_SECRET is not set, so skip the check
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Pick up one pending job at a time — claim it atomically
  const { data: jobs, error: fetchError } = await getSupabase()
    .from('brief_jobs')
    .select('id, brief_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError) {
    log.error('cron: failed to fetch pending jobs', { error: fetchError.message });
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return Response.json({ ok: true, processed: 0 });
  }

  const job = jobs[0] as { id: string; brief_id: string };

  // Claim the job — if another cron invocation already claimed it, skip
  const { data: claimed, error: claimError } = await getSupabase()
    .from('brief_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', job.id)
    .eq('status', 'pending')  // Only claim if still pending
    .select('id');

  if (claimError || !claimed || claimed.length === 0) {
    log.info('cron: job already claimed, skipping', { jobId: job.id });
    return Response.json({ ok: true, processed: 0 });
  }

  const { data: briefRow, error: briefFetchError } = await getSupabase()
    .from('briefs')
    .select('nationality, destination, visa_type, freeform_input, depth, stripe_session_id')
    .eq('id', job.brief_id)
    .single();

  if (briefFetchError || !briefRow) {
    await failJob(job.id, job.brief_id, 'Brief not found');
    return Response.json({ ok: false, error: 'Brief not found' }, { status: 404 });
  }

  log.info('cron: processing job', { jobId: job.id, briefId: job.brief_id, destination: briefRow.destination });

  resetUsage();

  try {
    let brief;
    let visaRequest: VisaRequest | undefined;

    if (DRY_RUN) {
      const result = await runDryPipeline(() => {});
      brief = result.brief;
      visaRequest = result.visaRequest;
    } else {
      const input: VisaInput = {
        nationality: briefRow.nationality,
        destination: briefRow.destination,
        visaType: briefRow.visa_type ?? undefined,
        freeform: briefRow.freeform_input ?? '',
      };
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const startTime = Date.now();

      const envelope = await runOrchestrator(input, client, briefRow.depth, (parsed) => { visaRequest = parsed; });
      if (!visaRequest) visaRequest = envelope.visaRequest;

      const conflictReport = await resolveConflicts(envelope, client);
      brief = await synthesizeBrief(envelope, conflictReport, client, briefRow.depth, startTime);
    }

    const cost = calculateReportCost(getUsageLog());

    await updateBriefWithContent({
      briefId: job.brief_id,
      visaRequest: visaRequest!,
      brief,
      stripeSessionId: briefRow.stripe_session_id ?? '',
      paymentStatus: 'paid',
      cost,
    });

    await getSupabase()
      .from('brief_jobs')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', job.id);

    log.info('cron: job complete', { jobId: job.id, briefId: job.brief_id, estimatedCostUsd: cost.estimatedCostUsd.toFixed(4) });
    return Response.json({ ok: true, processed: 1, briefId: job.brief_id });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('cron: job failed', { jobId: job.id, briefId: job.brief_id, error: message });
    await failJob(job.id, job.brief_id, message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

async function failJob(jobId: string, briefId: string, error: string): Promise<void> {
  await Promise.all([
    getSupabase()
      .from('brief_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString(), error })
      .eq('id', jobId),
    getSupabase()
      .from('briefs')
      .update({ payment_status: 'error' })
      .eq('id', briefId),
  ]);
}
