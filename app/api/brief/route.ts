import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import * as Sentry from '@sentry/nextjs';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { runDryPipeline } from '@/src/lib/dryRun';
import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';
import { saveBrief } from '@/src/lib/saveBrief';
import { withUsageTracking, getUsageLog, calculateReportCost } from '@/src/lib/cost';
import { checkFreeTierCap, incrementFreeTierCount, logIpAbuse, getFreeDailyLimit, getAdminDailyLimit } from '@/src/lib/freeTier';
import { isAdminUser } from '@/src/lib/adminAccess';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { OffTopicError } from '@/src/lib/errors';
import type { VisaInput, VisaRequest } from '@/src/types/index';

const SUPPORTED_DESTINATIONS = new Set([
  'thailand', 'vietnam', 'indonesia', 'malaysia', 'philippines',
  'cambodia', 'laos', 'myanmar', 'singapore', 'brunei',
]);

export const runtime = 'nodejs';

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  try {
    return await briefHandler(req);
  } catch (outerErr) {
    log.error('brief route unhandled error', { error: outerErr instanceof Error ? outerErr.message : String(outerErr) });
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again or contact support.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function briefHandler(req: Request) {
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

  if (freeform.length > 2000 || nationality.length > 100 || destination.length > 100 || (visaType && visaType.length > 100)) {
    const field = freeform.length > 2000 ? 'freeform' : nationality.length > 100 ? 'nationality' : visaType && visaType.length > 100 ? 'visaType' : 'destination';
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    await log.warn('input.oversized', { field, length: { freeform: freeform.length, nationality: nationality.length, destination: destination.length }, ip });
    return new Response(JSON.stringify({ error: 'Input exceeds maximum allowed length' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!SUPPORTED_DESTINATIONS.has(destination.trim().toLowerCase())) {
    return new Response(
      JSON.stringify({ error: 'Destination not yet supported. VisaScout covers Thailand, Vietnam, Indonesia, Malaysia, Philippines, Cambodia, Laos, Myanmar, Singapore, and Brunei.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const rateCheck = await checkRateLimit(userId);
  if (!rateCheck.allowed) {
    await log.warn('rate.limit.exceeded', { userId, ip });
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment before trying again.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...(rateCheck.retryAfter ? { 'Retry-After': String(rateCheck.retryAfter) } : {}),
        },
      }
    );
  }

  const validDepths = ['quick', 'standard', 'deep'] as const;
  const resolvedDepth = validDepths.includes(depth as 'quick' | 'standard' | 'deep')
    ? (depth as 'quick' | 'standard' | 'deep')
    : 'standard';

  const dryRun = process.env.DRY_RUN === 'true';
  const isAdmin = isAdminUser(userId);

  const dailyLimit = isAdmin ? getAdminDailyLimit() : getFreeDailyLimit();

  // Free tier daily cap — Supabase op, runs in DRY_RUN too (CLAUDE.md: Supabase saves run in DRY_RUN)
  if (resolvedDepth === 'quick') {
    try {
      const cap = await checkFreeTierCap(userId, dailyLimit);
      if (!cap.allowed) {
        await logIpAbuse(ip, userId, 'free_tier_daily_cap_exceeded').catch(() => {});
        await trackEvent('free_cap.reached', {
          userId,
          ipAddress: ip ?? null,
          briefsUsed: dailyLimit,
          destination: destination ?? null,
        });
        return new Response(
          JSON.stringify({ error: 'Daily free brief limit reached. Upgrade to Standard or Deep for unlimited research.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (capErr) {
      log.error('free tier cap check failed — allowing request', { error: capErr instanceof Error ? capErr.message : String(capErr) });
    }
  }

  Sentry.setUser({ id: userId });
  Sentry.setTag('destination', destination);
  Sentry.setTag('nationality', nationality);
  Sentry.setTag('depth', resolvedDepth);

  const tier = isAdmin ? 'admin' : resolvedDepth === 'quick' ? 'free' : 'paid';

  await trackEvent('brief.started', {
    userId,
    depth: resolvedDepth,
    tier,
    destination,
    nationality,
  });

  const stream = new ReadableStream({
    async start(controller) {
      await withUsageTracking(async () => {
      const send = (data: unknown) => {
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));
      };

      try {
        if (dryRun) {
          log.info('pipeline start [DRY_RUN]', { destination, depth: resolvedDepth });
          const { brief: dryBrief, visaRequest: dryVisaRequest } = await runDryPipeline(send, process.env.NODE_ENV === 'development');

          let dryBriefId: string | undefined;
          try {
            dryBriefId = await saveBrief({ visaRequest: dryVisaRequest, brief: dryBrief, depth: resolvedDepth, userId });
          } catch (saveErr) {
            log.error('saveBrief failed [DRY_RUN]', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
          }

          if (resolvedDepth === 'quick') {
            incrementFreeTierCount(userId).catch((err) => {
              log.error('free tier count increment failed [DRY_RUN]', { error: err instanceof Error ? err.message : String(err) });
            });
          }

          send({ type: 'complete', brief: dryBrief, briefId: dryBriefId });
          await trackEvent('brief.generated', {
            userId,
            briefId: dryBriefId ?? null,
            depth: resolvedDepth,
            tier,
            destination,
            nationality,
            durationMs: null,
            estimatedCostUsd: null,
            failedAgents: 0,
            degraded: false,
          });
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
          (event) => { send({ type: 'status', ...event }); },
          userId ?? undefined
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

        const agentStatuses = brief.metadata?.agentStatuses ?? [];
        await trackEvent('brief.generated', {
          userId,
          briefId: briefId ?? null,
          depth: resolvedDepth,
          tier,
          destination,
          nationality,
          durationMs: Date.now() - startTime,
          estimatedCostUsd: cost.estimatedCostUsd,
          failedAgents: agentStatuses.filter((s) => s.status === 'failed').length,
          degraded: agentStatuses.some((s) => s.status === 'failed'),
        });

        log.info('pipeline complete', {
          destination, depth: resolvedDepth,
          durationMs: Date.now() - startTime,
          degraded: brief.metadata.degraded,
          briefId,
          estimatedCostUsd: cost.estimatedCostUsd.toFixed(4),
        });
      } catch (err) {
        if (err instanceof OffTopicError) {
          send({ type: 'error', message: 'Your input doesn\'t appear to be about visa travel to a supported SEA destination. Please describe your nationality, destination country, and visa situation.' });
          return;
        }
        const internalMessage = err instanceof Error ? err.message : 'Pipeline failed';
        log.error('pipeline error', { error: internalMessage, destination, depth: resolvedDepth });
        await trackEvent('brief.failed', {
          userId,
          depth: resolvedDepth,
          destination: destination ?? null,
          errorMessage: internalMessage,
        });
        send({ type: 'error', message: 'Something went wrong generating your brief. Please try again or contact support.' });
      } finally {
        Sentry.setUser(null);
        controller.close();
      }
      });
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
