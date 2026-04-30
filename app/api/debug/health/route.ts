import { VERSION } from '@/src/lib/version';

export const runtime = 'nodejs';

// Used by BetterStack uptime monitors and deployment smoke tests.
// Returns 200 + ok:true when required keys are configured.
// Returns 503 + ok:false when required keys are missing — triggers BetterStack alert.
export async function GET() {
  const keys = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    tavily:    !!process.env.TAVILY_API_KEY,
    sentry:    !!process.env.SENTRY_DSN,
    betterstack: !!process.env.BETTERSTACK_SOURCE_TOKEN,
  };

  const ok = keys.anthropic && keys.tavily;

  const body = {
    ok,
    env:     process.env.NODE_ENV ?? 'unknown',
    version: VERSION,
    dry_run: process.env.DRY_RUN === 'true',
    keys,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, { status: ok ? 200 : 503 });
}
