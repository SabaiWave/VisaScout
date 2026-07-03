import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { runDryPipeline } from '@/src/lib/dryRun';
import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';
import { updateBriefWithContent, saveBrief } from '@/src/lib/saveBrief';
import { getSupabase } from '@/src/lib/supabase';
import { withUsageTracking, getUsageLog, calculateReportCost } from '@/src/lib/cost';
import { checkFreeTierCap, incrementFreeTierCount, logIpAbuse, getFreeDailyLimit, getAdminDailyLimit } from '@/src/lib/freeTier';
import { isAdminUser } from '@/src/lib/adminAccess';
import { hasInviteAccess, incrementInviteUsage } from '@/src/lib/inviteAccess';
import { getOrCreateUser } from '@/src/lib/users';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { OffTopicError } from '@/src/lib/errors';
import type { VisaInput, VisaRequest } from '@/src/types/index';

const BriefInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  visaType: z.string().max(100).optional(),
  freeform: z.string().min(1).max(2000),
  depth: z.enum(['quick', 'standard', 'deep']).optional(),
});

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

  const user = await getOrCreateUser(userId).catch(() => null);
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

  const parsed = BriefInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { nationality, destination, visaType, freeform, depth } = parsed.data;

  if (!SUPPORTED_DESTINATIONS.has(destination.trim().toLowerCase())) {
    return new Response(
      JSON.stringify({ error: 'Destination not yet supported. VisaScout covers Thailand, Vietnam, Indonesia, Malaysia, Philippines, Cambodia, Laos, Myanmar, Singapore, and Brunei.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const rateCheck = await checkRateLimit(userId);
  if (!rateCheck.allowed) {
    await log.warn('rate.limit.exceeded', { userId, userEmail: user?.email ?? null, ip });
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

  const resolvedDepth = depth ?? 'standard';

  const dryRun = process.env.DRY_RUN === 'true';
  const isAdmin = isAdminUser(userId);

  const dailyLimit = isAdmin ? getAdminDailyLimit() : getFreeDailyLimit();

  // Invite code users bypass Quick cap — check once here, reuse at completion for usage tracking
  const earlyAccess = resolvedDepth === 'quick' ? await hasInviteAccess(userId).catch(() => false) : false;

  // Free tier daily cap — Supabase op, runs in DRY_RUN too (CLAUDE.md: Supabase saves run in DRY_RUN)
  if (resolvedDepth === 'quick' && !earlyAccess) {
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

  Sentry.setUser({ id: userId, email: user?.email ?? undefined });
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

  // Create shell brief so dashboard shows pending card immediately.
  // Non-fatal — if this fails, pipeline continues and saveBrief handles the insert at the end.
  let shellBriefId: string | undefined;
  if (user) {
    try {
      const { data: shellRow } = await getSupabase()
        .from('briefs')
        .insert({
          nationality,
          destination,
          visa_type: visaType || null,
          freeform_input: freeform,
          depth: resolvedDepth,
          user_id: user.id,
          payment_status: 'pending',
          is_dry_run: dryRun,
          degraded: false,
        })
        .select('id')
        .single();
      shellBriefId = (shellRow as { id: string } | null)?.id;
    } catch (shellErr) {
      log.error('shell brief creation failed — continuing without shell', { error: shellErr instanceof Error ? shellErr.message : String(shellErr) });
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      await withUsageTracking(async () => {
      // Client may navigate away (disconnect) mid-stream — swallow enqueue errors so the
      // pipeline continues and saves the brief to DB. The outer catch must only fire on
      // real pipeline failures, not client disconnects.
      const send = (data: unknown) => {
        try {
          controller.enqueue(new TextEncoder().encode(sseEvent(data)));
        } catch {
          // Stream cancelled — client disconnected. Continue pipeline; brief will still be saved.
        }
      };

      // Send briefId early so client can show dashboard link before pipeline completes
      if (shellBriefId) send({ type: 'brief_id', briefId: shellBriefId });

      try {
        if (dryRun) {
          log.info('pipeline start [DRY_RUN]', { destination, depth: resolvedDepth, userEmail: user?.email ?? null });
          const { brief: dryBrief, visaRequest: dryVisaRequest } = await runDryPipeline(send, process.env.NODE_ENV === 'development');

          let dryBriefId: string | undefined;
          try {
            if (shellBriefId) {
              await updateBriefWithContent({ briefId: shellBriefId, visaRequest: dryVisaRequest, brief: dryBrief, fundedBy: earlyAccess ? 'invite' : 'free', isDryRun: true });
              dryBriefId = shellBriefId;
            } else {
              dryBriefId = await saveBrief({ visaRequest: dryVisaRequest, brief: dryBrief, depth: resolvedDepth, userId, fundedBy: earlyAccess ? 'invite' : 'free', isDryRun: true });
            }
          } catch (saveErr) {
            log.error('brief save failed [DRY_RUN]', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
          }

          if (resolvedDepth === 'quick') {
            if (earlyAccess) {
              incrementInviteUsage(userId).catch((err) => {
                log.error('invite usage increment failed [DRY_RUN]', { error: err instanceof Error ? err.message : String(err) });
              });
            } else {
              incrementFreeTierCount(userId).catch((err) => {
                log.error('free tier count increment failed [DRY_RUN]', { error: err instanceof Error ? err.message : String(err) });
              });
              incrementInviteUsage(userId).catch((err) => {
                log.error('invite usage increment failed [DRY_RUN]', { error: err instanceof Error ? err.message : String(err) });
              });
            }
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

        log.info('pipeline start', { destination, depth: resolvedDepth, userEmail: user?.email ?? null });

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
            if (shellBriefId) {
              await updateBriefWithContent({ briefId: shellBriefId, visaRequest: capturedVisaRequest, brief, fundedBy: earlyAccess ? 'invite' : 'free', cost, isDryRun: false });
              briefId = shellBriefId;
            } else {
              briefId = await saveBrief({ visaRequest: capturedVisaRequest, brief, depth: resolvedDepth, userId, cost, fundedBy: earlyAccess ? 'invite' : 'free', isDryRun: false });
            }
          } catch (saveErr) {
            log.error('brief save failed', { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
          }
        }

        // Increment usage counter after successful brief
        if (resolvedDepth === 'quick') {
          if (earlyAccess) {
            incrementInviteUsage(userId).catch((err) => {
              log.error('invite usage increment failed', { error: err instanceof Error ? err.message : String(err) });
            });
          } else {
            incrementFreeTierCount(userId).catch((err) => {
              log.error('free tier count increment failed', { error: err instanceof Error ? err.message : String(err) });
            });
            incrementInviteUsage(userId).catch((err) => {
              log.error('briefs_generated increment failed', { error: err instanceof Error ? err.message : String(err) });
            });
          }
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
        // Mark shell brief as errored so dashboard doesn't show stuck pending card
        if (shellBriefId) {
          getSupabase().from('briefs').update({ payment_status: 'error' }).eq('id', shellBriefId).then(() => {});
        }
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
        try { controller.close(); } catch { /* already closed by client disconnect */ }
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
