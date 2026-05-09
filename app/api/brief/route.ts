import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { runDryPipeline } from '@/src/lib/dryRun';
import { log } from '@/src/lib/logger';
import { saveBrief } from '@/src/lib/saveBrief';
import type { VisaInput, VisaRequest } from '@/src/types/index';

export const runtime = 'nodejs';

const DRY_RUN = process.env.DRY_RUN === 'true';

// In-memory rate limiter — sufficient for local dev/MVP; upgrade to Upstash for production
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

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

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in an hour.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

        let briefId: string | undefined;
        if (capturedVisaRequest) {
          try {
            briefId = await saveBrief({ visaRequest: capturedVisaRequest, brief, depth: resolvedDepth, userId });
          } catch (saveErr) {
            log.error('saveBrief failed', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
          }
        }

        send({ type: 'complete', brief, briefId });

        log.info('pipeline complete', { destination, depth: resolvedDepth, durationMs: Date.now() - startTime, degraded: brief.metadata.degraded, briefId });
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
