import { waitUntil } from '@vercel/functions';
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
export const maxDuration = 300;

const DRY_RUN = process.env.DRY_RUN === 'true';

async function runPipeline(jobId: string, briefId: string) {
  const { data: briefRow, error: briefFetchError } = await getSupabase()
    .from('briefs')
    .select('nationality, destination, visa_type, freeform_input, depth, stripe_session_id')
    .eq('id', briefId)
    .single();

  if (briefFetchError || !briefRow) {
    await failJob(jobId, briefId, 'Brief not found');
    return;
  }

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
      briefId,
      visaRequest: visaRequest!,
      brief,
      stripeSessionId: briefRow.stripe_session_id ?? '',
      paymentStatus: 'paid',
      cost,
    });

    await getSupabase()
      .from('brief_jobs')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    log.info('poll: job complete', { jobId, briefId, estimatedCostUsd: cost.estimatedCostUsd.toFixed(4) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('poll: job failed', { jobId, briefId, error: message });
    await failJob(jobId, briefId, message);
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

  // First poll after payment — claim the job and fire pipeline in background
  if (data.payment_status === 'queued') {
    const { data: job } = await getSupabase()
      .from('brief_jobs')
      .select('id')
      .eq('brief_id', briefId)
      .eq('status', 'pending')
      .single();

    if (job) {
      const { data: claimed } = await getSupabase()
        .from('brief_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', job.id)
        .eq('status', 'pending')
        .select('id');

      if (claimed && claimed.length > 0) {
        log.info('poll: claimed job, firing pipeline', { jobId: job.id, briefId });
        waitUntil(runPipeline(job.id, briefId));
      }
    }
  }

  return new Response(JSON.stringify({ status: data.payment_status, briefId: data.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
