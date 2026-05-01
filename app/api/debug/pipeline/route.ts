import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { log } from '@/src/lib/logger';
import type { VisaInput, AgentStatus } from '@/src/types/index';

export const runtime = 'nodejs';

// Hardcoded test case: US → Thailand, tourist visa exemption, 28-day stay + border run.
// Respects DRY_RUN — uses fixtures if true, makes real API calls if false.
// Never set DEBUG_ALLOWED=true in Vercel production.
const TEST_INPUT: VisaInput = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'Visa Exemption',
  freeform:
    'Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company.',
};

export async function GET() {
  if (!process.env.DEBUG_ALLOWED) {
    return new Response('Not found', { status: 404 });
  }

  const startTime = Date.now();
  const agentStatuses: AgentStatus[] = [];

  try {
    if (process.env.DRY_RUN === 'true') {
      log.info('debug/pipeline [DRY_RUN]', { input: TEST_INPUT });

      const { runDryPipeline } = await import('@/src/lib/dryRun');
      const events: unknown[] = [];
      await runDryPipeline((event) => events.push(event));

      const completeEvent = events.find(
        (e) => (e as Record<string, unknown>).type === 'complete'
      ) as { type: 'complete'; brief: unknown } | undefined;

      return Response.json({
        ok: true,
        dry_run: true,
        durationMs: Date.now() - startTime,
        agentStatuses: [],
        brief: completeEvent?.brief ?? null,
        events,
      });
    }

    log.info('debug/pipeline start', { input: TEST_INPUT });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const envelope = await runOrchestrator(
      TEST_INPUT,
      client,
      'standard',
      (visaRequest) => {
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

    const durationMs = Date.now() - startTime;
    log.info('debug/pipeline complete', { durationMs, degraded: brief.metadata.degraded });

    return Response.json({
      ok: true,
      dry_run: false,
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
