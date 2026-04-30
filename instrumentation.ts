export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    logStartup();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

function logStartup() {
  const env = process.env.NODE_ENV ?? 'unknown';
  const isDev = env === 'development';

  const checks = {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
    SENTRY_DSN: !!process.env.SENTRY_DSN,
    BETTERSTACK_SOURCE_TOKEN: !!process.env.BETTERSTACK_SOURCE_TOKEN,
  };

  const missing = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  // Use plain console.log for startup — structured logging isn't set up yet at this point
  if (isDev) {
    console.log('\n─────────────────────────────────────────');
    console.log(`  VisaScout  [${env.toUpperCase()}]`);
    console.log('─────────────────────────────────────────');
    console.log(`  ANTHROPIC_API_KEY      ${checks.ANTHROPIC_API_KEY ? '✓ set' : '✗ MISSING — app will not work'}`);
    console.log(`  TAVILY_API_KEY         ${checks.TAVILY_API_KEY ? '✓ set' : '✗ MISSING — app will not work'}`);
    console.log(`  SENTRY_DSN             ${checks.SENTRY_DSN ? '✓ set' : '– not configured'}`);
    console.log(`  BETTERSTACK_TOKEN      ${checks.BETTERSTACK_SOURCE_TOKEN ? '✓ set' : '– not configured'}`);
    console.log(`  DRY_RUN                ${process.env.DRY_RUN === 'true' ? 'true — fixture data, zero API cost' : 'false — real API calls'}`);
    console.log('─────────────────────────────────────────\n');
  } else {
    // Production: structured JSON so it shows up cleanly in Vercel logs
    console.log(JSON.stringify({
      level: 'info',
      message: 'VisaScout server starting',
      env,
      keysConfigured: Object.entries(checks).filter(([, v]) => v).map(([k]) => k),
      keysMissing: missing,
    }));
  }

  if (missing.includes('ANTHROPIC_API_KEY') || missing.includes('TAVILY_API_KEY')) {
    console.error('ERROR: Required API keys are not set. See .env.example for setup instructions.');
  }
}
