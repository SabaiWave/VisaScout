import { VERSION } from '@/src/lib/version';

export const runtime = 'nodejs';

// Used by BetterStack uptime monitors and deployment smoke tests.
// Returns 200 + ok:true when required keys are configured.
// Returns 503 + ok:false when required keys are missing — triggers BetterStack alert.
export async function GET() {
  const keys = {
    // Core
    anthropic:   !!process.env.ANTHROPIC_API_KEY,
    tavily:      !!process.env.TAVILY_API_KEY,
    // Observability
    sentry:      !!process.env.SENTRY_DSN,
    betterstack: !!process.env.BETTERSTACK_SOURCE_TOKEN,
    // Auth (Phase 5)
    clerk:       !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    // Database (Phase 4)
    supabase:    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Payments (Phase 6)
    stripe:      !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // Domain + email (Phase 7)
    resend:      !!process.env.RESEND_API_KEY,
    appUrl:      !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const ok = keys.anthropic && keys.tavily && keys.clerk && keys.supabase;

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
