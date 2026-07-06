import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { saveBrief } from '@/src/lib/saveBrief';
import { log } from '@/src/lib/logger';
import type { VisaInput, AgentStatus, VisaRequest } from '@/src/types/index';

export const runtime = 'nodejs';

// Hardcoded test case: US → Thailand, tourist visa exemption, 28-day stay + border run.
// Respects DRY_RUN — uses fixtures if true, makes real API calls if false.
const TEST_INPUT: VisaInput = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'Visa Exemption',
  freeform:
    'Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company.',
};

export async function GET() {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return new Response('Not found', { status: 404 });
  }

  const startTime = Date.now();
  const agentStatuses: AgentStatus[] = [];

  try {
    if (process.env.DRY_RUN === 'true') {
      log.info('debug/pipeline [DRY_RUN]', { input: TEST_INPUT });

      const { runDryPipeline } = await import('@/src/lib/dryRun');
      const events: unknown[] = [];
      const { brief: dryBrief, visaRequest: dryVisaRequest } = await runDryPipeline((event) => events.push(event), false, 'deep');

      let briefId: string | undefined;
      try {
        briefId = await saveBrief({ visaRequest: dryVisaRequest, brief: dryBrief, depth: 'standard', userId, fundedBy: 'free' });
      } catch (saveErr) {
        log.error('debug/pipeline saveBrief failed [DRY_RUN]', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
      }

      return Response.json({
        ok: true,
        dry_run: true,
        briefId: briefId ?? null,
        durationMs: Date.now() - startTime,
        agentStatuses: [],
        brief: dryBrief,
        events,
      });
    }

    log.info('debug/pipeline start', { input: TEST_INPUT });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let capturedVisaRequest: VisaRequest | null = null;
    const envelope = await runOrchestrator(
      TEST_INPUT,
      client,
      'standard',
      (visaRequest) => {
        capturedVisaRequest = visaRequest;
        log.info('debug/pipeline parsed', { parsedSummary: visaRequest.parsedSummary });
      },
      (event) => {
        if (event.status === 'complete') {
          agentStatuses.push({
            agent: event.agent,
            status: 'success',
            confidence: event.confidence as 'high' | 'medium' | 'low',
            sourceTier: event.sourceTier as 1 | 2 | 3 | 4,
            durationMs: event.durationMs,
          });
        } else if (event.status === 'failed') {
          agentStatuses.push({
            agent: event.agent,
            status: 'failed',
            confidence: 'low',
            sourceTier: 4,
            durationMs: 0,
            error: event.error,
          });
        }
      }
    );

    const conflictReport = await resolveConflicts(envelope, client);
    const brief = await synthesizeBrief(envelope, conflictReport, client, 'standard', startTime);

    let briefId: string | undefined;
    if (capturedVisaRequest) {
      try {
        briefId = await saveBrief({ visaRequest: capturedVisaRequest, brief, depth: 'standard', userId, fundedBy: 'free' });
      } catch (saveErr) {
        log.error('debug/pipeline saveBrief failed', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
      }
    }

    const durationMs = Date.now() - startTime;
    log.info('debug/pipeline complete', { durationMs, degraded: brief.metadata.degraded, briefId });

    return Response.json({
      ok: true,
      dry_run: false,
      briefId: briefId ?? null,
      durationMs,
      agentStatuses,
      brief,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('debug/pipeline error', { error: message });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
