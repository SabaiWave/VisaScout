import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { runDryPipeline } from '@/src/lib/dryRun';
import { log } from '@/src/lib/logger';
import { saveBrief } from '@/src/lib/saveBrief';
import { resetUsage, getUsageLog, calculateReportCost } from '@/src/lib/cost';
import { checkFreeTierCap, incrementFreeTierCount, logIpAbuse } from '@/src/lib/freeTier';
import type { VisaInput, VisaRequest } from '@/src/types/index';

export const runtime = 'nodejs';

const DRY_RUN = process.env.DRY_RUN === 'true';

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { nationality, destination, visaType, freeform, depth } = body as Record<string, string>;

  if (!nationality || !destination || !freeform) {
    return new Response(JSON.stringify({ error: 'nationality, destination, and freeform are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validDepths = ['quick', 'standard', 'deep'] as const;
  const resolvedDepth = validDepths.includes(depth as 'quick' | 'standard' | 'deep')
    ? (depth as 'quick' | 'standard' | 'deep')
    : 'standard';

  // Free tier daily cap — enforced per userId via Supabase (not IP; resets on cold start)
  if (resolvedDepth === 'quick' && !DRY_RUN) {
    try {
      const cap = await checkFreeTierCap(userId);
      if (!cap.allowed) {
        await logIpAbuse(ip, userId, 'free_tier_daily_cap_exceeded').catch(() => {});
        return new Response(
          JSON.stringify({ error: 'Daily free brief limit reached. Upgrade to Standard or Deep for unlimited research.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (capErr) {
      log.error('free tier cap check failed — allowing request', { error: capErr instanceof Error ? capErr.message : String(capErr) });
    }
  }

  resetUsage();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));
      };

      try {
        if (DRY_RUN) {
          log.info('pipeline start [DRY_RUN]', { destination, depth: resolvedDepth });
          const { brief: dryBrief, visaRequest: dryVisaRequest } = await runDryPipeline(send);

          let dryBriefId: string | undefined;
          try {
            dryBriefId = await saveBrief({ visaRequest: dryVisaRequest, brief: dryBrief, depth: resolvedDepth, userId });
          } catch (saveErr) {
            log.error('saveBrief failed [DRY_RUN]', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
          }

          send({ type: 'complete', brief: dryBrief, briefId: dryBriefId });
          log.info('pipeline complete [DRY_RUN]', { destination, depth: resolvedDepth, briefId: dryBriefId });
          return;
        }

        const input: VisaInput = { nationality, destination, visaType: visaType || undefined, freeform };
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const startTime = Date.now();

        log.info('pipeline start', { destination, depth: resolvedDepth });

        let capturedVisaRequest: VisaRequest | null = null;
        const envelope = await runOrchestrator(
          input,
          client,
          resolvedDepth,
          (visaRequest) => { capturedVisaRequest = visaRequest; send({ type: 'parsed', data: visaRequest }); },
          (event) => { send({ type: 'status', ...event }); }
        );

        const conflictReport = await resolveConflicts(envelope, client);
        send({ type: 'conflict', data: conflictReport });

        const brief = await synthesizeBrief(envelope, conflictReport, client, resolvedDepth, startTime);
        const cost = calculateReportCost(getUsageLog());

        let briefId: string | undefined;
        if (capturedVisaRequest) {
          try {
            briefId = await saveBrief({ visaRequest: capturedVisaRequest, brief, depth: resolvedDepth, userId, cost });
          } catch (saveErr) {
            log.error('saveBrief failed', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
          }
        }

        // Increment free tier counter after successful brief
        if (resolvedDepth === 'quick') {
          incrementFreeTierCount(userId).catch((err) => {
            log.error('free tier count increment failed', { error: err instanceof Error ? err.message : String(err) });
          });
        }

        send({ type: 'complete', brief, briefId });

        log.info('pipeline complete', {
          destination, depth: resolvedDepth,
          durationMs: Date.now() - startTime,
          degraded: brief.metadata.degraded,
          briefId,
          estimatedCostUsd: cost.estimatedCostUsd.toFixed(4),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Pipeline failed';
        log.error('pipeline error', { error: message, destination, depth: resolvedDepth });
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
