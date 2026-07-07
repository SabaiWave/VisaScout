import * as Sentry from '@sentry/nextjs';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';
import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';
import { SUPPORTED_DESTINATION_NAMES } from '@/src/config/destinations';

export const runtime = 'nodejs';

const FAKE_BRIEF_ID = 'dev-sim-00000000-0000-0000-0000-000000000001';
const FAKE_USER_ID = 'dev-sim-user_2abc123';

const DESTINATIONS = SUPPORTED_DESTINATION_NAMES;
const NATIONALITIES = ['American', 'British', 'Australian', 'German', 'French'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const VALID_EVENTS = [
  'error',
  'brief.started',
  'brief.generated',
  'brief.generated.degraded',
  'brief.failed',
  'brief.pdf_failed',
  'checkout.started',
  'payment.completed',
  'poll.job_claimed',
  'free-cap.reached',
  'input.oversized',
  'invite.redeemed',
  'invite.invalid-code',
];

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return new Response('Not found', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const event = searchParams.get('event');
  const destination = pick(DESTINATIONS);
  const nationality = pick(NATIONALITIES);

  let fired: Record<string, unknown> = {};

  switch (event) {
    case 'error': {
      const data = { source: 'dev-sim', sim: true };
      log.error('sim: pipeline error', data);
      Sentry.setUser({ id: FAKE_USER_ID });
      Sentry.captureException(new Error('Simulated: pipeline error'), { tags: { sim: 'true' }, extra: data });
      fired = { level: 'error', message: 'sim: pipeline error', ...data };
      break;
    }

    case 'brief.started': {
      const data = { userId: FAKE_USER_ID, depth: 'quick', tier: 'free', destination, nationality, sim: true };
      await trackEvent('brief.started', data);
      fired = { event: 'brief.started', ...data };
      break;
    }

    case 'brief.generated': {
      const data = {
        userId: FAKE_USER_ID,
        briefId: FAKE_BRIEF_ID,
        depth: 'quick',
        tier: 'free',
        destination,
        nationality,
        durationMs: 4200,
        estimatedCostUsd: 0.032,
        failedAgents: 0,
        degraded: false,
        sim: true,
      };
      await trackEvent('brief.generated', data);
      fired = { event: 'brief.generated', ...data };
      break;
    }

    case 'brief.generated.degraded': {
      const data = {
        userId: FAKE_USER_ID,
        briefId: FAKE_BRIEF_ID,
        depth: 'standard',
        tier: 'paid',
        destination,
        nationality,
        durationMs: 6800,
        estimatedCostUsd: 0.089,
        failedAgents: 2,
        degraded: true,
        sim: true,
      };
      await trackEvent('brief.generated', data);
      fired = { event: 'brief.generated (degraded)', ...data };
      break;
    }

    case 'brief.failed': {
      const data = {
        userId: FAKE_USER_ID,
        depth: 'standard',
        destination,
        errorMessage: 'Simulated: Anthropic API timeout after 30s',
        sim: true,
      };
      log.error('brief generation failed', { userId: FAKE_USER_ID, depth: data.depth, destination, errorMessage: data.errorMessage, sim: true });
      Sentry.setUser({ id: FAKE_USER_ID });
      Sentry.captureException(new Error(data.errorMessage), { tags: { depth: data.depth, sim: 'true' }, extra: { userId: FAKE_USER_ID, destination } });
      await trackEvent('brief.failed', data);
      fired = { event: 'brief.failed', ...data };
      break;
    }

    case 'brief.pdf_failed': {
      const data = {
        briefId: FAKE_BRIEF_ID,
        userId: FAKE_USER_ID,
        depth: 'quick',
        statusCode: 500,
        errorMessage: 'Simulated: Puppeteer launch failed',
        sim: true,
      };
      log.error('pdf generation failed', { briefId: FAKE_BRIEF_ID, userId: FAKE_USER_ID, errorMessage: data.errorMessage, sim: true });
      Sentry.setUser({ id: FAKE_USER_ID });
      Sentry.captureException(new Error(data.errorMessage), { tags: { briefId: FAKE_BRIEF_ID, depth: 'quick', sim: 'true' }, extra: { userId: FAKE_USER_ID } });
      await trackEvent('brief.pdf_failed', data);
      fired = { event: 'brief.pdf_failed', ...data };
      break;
    }

    case 'checkout.started': {
      const data = {
        userId: FAKE_USER_ID,
        briefId: FAKE_BRIEF_ID,
        depth: 'standard',
        destination,
        nationality,
        priceUsd: 19.00,
        sim: true,
      };
      await trackEvent('checkout.started', data);
      fired = { event: 'checkout.started', ...data };
      break;
    }

    case 'payment.completed': {
      const data = {
        userId: FAKE_USER_ID,
        briefId: FAKE_BRIEF_ID,
        depth: 'standard',
        destination,
        nationality,
        amountUsd: 19.00,
        sim: true,
      };
      await trackEvent('payment.completed', data);
      fired = { event: 'payment.completed', ...data };
      break;
    }

    case 'poll.job_claimed': {
      const data = {
        briefId: FAKE_BRIEF_ID,
        jobId: 'dev-sim-job-00000000-0001',
        depth: 'standard',
        destination,
        nationality,
        sim: true,
      };
      await trackEvent('poll.job_claimed', data);
      fired = { event: 'poll.job_claimed', ...data };
      break;
    }

    case 'free-cap.reached': {
      const data = {
        userId: FAKE_USER_ID,
        ipAddress: '127.0.0.1',
        briefsUsed: 3,
        destination,
        sim: true,
      };
      await trackEvent('free_cap.reached', data);
      fired = { event: 'free_cap.reached', ...data };
      break;
    }

    case 'input.oversized': {
      const data = { field: 'freeform', length: { freeform: 9999, nationality: 12, destination: 9 }, ip: '1.2.3.4', sim: true };
      await log.warn('input.oversized', data);
      fired = { level: 'warn', message: 'input.oversized', ...data };
      break;
    }

    case 'invite.redeemed': {
      const fakeCode = 'sim-code-aaaa-bbbb-cccc-000000000001';
      const data = { userId: FAKE_USER_ID, codeUsed: fakeCode, sim: true };
      await trackEvent('invite.redeemed', data);
      log.info('invite: code redeemed', data);
      fired = { event: 'invite.redeemed', ...data };
      break;
    }

    case 'invite.invalid-code': {
      const fakeCode = 'sim-code-INVALID-0000-0000-000000000000';
      const data = { userId: FAKE_USER_ID, codeAttempted: fakeCode, reason: 'Invalid invite code.', sim: true };
      await log.warn('invite: redemption failed', data);
      fired = { level: 'warn', message: 'invite: redemption failed', ...data };
      break;
    }

    default:
      return Response.json({
        ok: false,
        error: `Unknown event. Valid: ${VALID_EVENTS.join(', ')}`,
      }, { status: 400 });
  }

  return Response.json({ ok: true, fired });
}
