import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';

export const runtime = 'nodejs';

const FAKE_BRIEF_ID = 'dev-sim-00000000-0000-0000-0000-000000000001';
const FAKE_USER_ID = 'dev-sim-user_2abc123';

const DESTINATIONS = ['Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Singapore'];
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
  'checkout.started',
  'payment.completed',
  'free-cap.reached',
];

export async function GET(req: Request) {
  if (!process.env.DEBUG_ALLOWED) {
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
      await trackEvent('brief.failed', data);
      fired = { event: 'brief.failed', ...data };
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

    default:
      return Response.json({
        ok: false,
        error: `Unknown event. Valid: ${VALID_EVENTS.join(', ')}`,
      }, { status: 400 });
  }

  return Response.json({ ok: true, fired });
}
