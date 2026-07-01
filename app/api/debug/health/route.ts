import { VERSION } from '@/src/lib/version';

export const runtime = 'nodejs';

// Used by BetterStack uptime monitors and deployment smoke tests.
// Returns 200 + ok:true when required keys are configured.
// Returns 503 + ok:false when required keys are missing — triggers BetterStack alert.
// Intentionally unauthenticated — BetterStack needs production access without a session.
export async function GET() {
  const ok =
    !!process.env.ANTHROPIC_API_KEY &&
    !!process.env.TAVILY_API_KEY &&
    !!process.env.CLERK_SECRET_KEY &&
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return Response.json({ ok, version: VERSION, timestamp: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
