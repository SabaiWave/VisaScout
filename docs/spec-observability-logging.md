# Phase: Observability Logging Layer

Read CLAUDE.md and CLAUDE-ops.md before starting.

---

## Goal

Add structured event logging and Sentry context tagging throughout the app.
No new services. No new env vars. Uses existing BetterStack (via logger) and Sentry.
This is pure instrumentation — no behavior changes, no schema changes.

---

## Step 1 — Create `src/lib/analytics.ts`

Single wrapper around the existing BetterStack logger.
All event tracking goes through this one function.
Never call logger directly from feature code after this — always go through `trackEvent`.

```typescript
import { logger } from './logger' // adjust import path to your BetterStack logger

type EventProperties = Record<string, string | number | boolean | null | undefined>

export async function trackEvent(event: string, props: EventProperties = {}): Promise<void> {
  try {
    logger.info(event, {
      event,
      ...props,
      ts: new Date().toISOString(),
    })
  } catch {
    // never throw — logging failure must never break the app
  }
}
```

Future: add PostHog or Segment call here when needed. One place.

---

## Step 2 — Add `trackEvent` calls at these exact moments

### 2a. User signup — `app/api/webhooks/clerk/route.ts` (or wherever Clerk webhook is handled)

On `user.created` event:

```typescript
await trackEvent('user.signup', {
  userId: event.data.id,
  email: event.data.email_addresses?.[0]?.email_address ?? null,
})
```

### 2b. Brief generation start — `app/api/brief/route.ts`

After auth check, before pipeline runs:

```typescript
await trackEvent('brief.started', {
  userId,
  depth,
  destination: visaInput.destination,
  nationality: visaInput.nationality,
})
```

### 2c. Brief generation complete — `app/api/brief/route.ts`

After synthesis resolves, before SSE `complete` event:

```typescript
await trackEvent('brief.generated', {
  userId,
  briefId,
  depth,
  destination: visaInput.destination,
  nationality: visaInput.nationality,
  durationMs,
  estimatedCostUsd: brief.metadata?.estimatedCostUsd ?? null,
  agentStatuses: JSON.stringify(brief.metadata?.agentStatuses ?? {}),
  degraded: Object.values(brief.metadata?.agentStatuses ?? {}).some(s => s === 'failed'),
})
```

### 2d. Brief generation failed — `app/api/brief/route.ts`

In catch block / SSE error event:

```typescript
await trackEvent('brief.failed', {
  userId,
  depth,
  destination: visaInput?.destination ?? null,
  errorMessage: error instanceof Error ? error.message : 'unknown',
})
```

### 2e. Free tier cap reached — wherever free brief limit is enforced (Phase 9 rate limiter)

```typescript
await trackEvent('free_cap.reached', {
  userId,
  ipAddress: ip ?? null,
  briefsUsed: currentCount,
  destination: visaInput?.destination ?? null,
})
```

### 2f. Payment completed — `app/api/webhooks/stripe/route.ts`

On `checkout.session.completed`:

```typescript
await trackEvent('payment.completed', {
  userId: session.metadata?.userId ?? null,
  depth: session.metadata?.depth ?? null,
  amountUsd: session.amount_total ? session.amount_total / 100 : null,
  briefId: session.metadata?.briefId ?? null,
})
```

### 2g. PDF downloaded — `app/api/brief/[briefId]/pdf/route.ts` (or wherever PDF is served)

```typescript
await trackEvent('brief.pdf_downloaded', {
  userId,
  briefId,
  depth,
})
```

### 2h. Brief shared — wherever share link is generated or copied

```typescript
await trackEvent('brief.shared', {
  userId,
  briefId,
})
```

---

## Step 3 — Add Sentry context tagging

In `app/api/brief/route.ts`, after userId and input are resolved, set Sentry user and tags
so every error captured during a pipeline run is automatically tagged:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.setUser({ id: userId })
Sentry.setTag('destination', visaInput.destination)
Sentry.setTag('nationality', visaInput.nationality)
Sentry.setTag('depth', depth)
```

In all agent files (`src/agents/*.ts`), wrap the main execution block and capture with context:

```typescript
} catch (error) {
  Sentry.captureException(error, {
    tags: { agent: 'officialPolicy', destination: request.destination },
  })
  return { status: 'failed', error: String(error) }
}
```

Clear user context after pipeline completes (optional but clean):
```typescript
Sentry.setUser(null)
```

---

## Step 4 — Never log PII or sensitive data

Audit every `trackEvent` call. These fields are NEVER logged:
- Freeform input / situation description text
- Passport numbers
- Full email addresses in event payloads (userId reference only)
- API keys or tokens of any kind

userId reference is fine. Raw email string is not (except signup event, which is intentional for user lookup).

---

## Step 5 — Tests

Write tests in `src/__tests__/lib/analytics.test.ts`:

- `trackEvent` resolves without throwing on valid input
- `trackEvent` resolves without throwing when logger throws (failure isolation)
- All required event name strings are exported as constants (if you choose to export them)

Run: `npm test` — must pass before this is done.

---

## Definition of Done

- [ ] `src/lib/analytics.ts` created with `trackEvent` wrapper
- [ ] All 8 event calls in place (signup, started, generated, failed, free_cap, payment, pdf, shared)
- [ ] Sentry user + tags set at pipeline start in `app/api/brief/route.ts`
- [ ] Sentry agent-level tagging in all 5 agent catch blocks
- [ ] No PII in any log payload (audit complete)
- [ ] Tests pass (`npm test`)
- [ ] BetterStack receives events — verify by triggering a brief in dev and checking BetterStack log stream

## Manual verification

1. Generate a Quick brief locally (DRY_RUN=false or use debug pipeline)
2. Check BetterStack log stream — confirm `brief.started` and `brief.generated` appear with correct fields
3. Trigger a Stripe test webhook (`stripe trigger checkout.session.completed`)
4. Confirm `payment.completed` appears in BetterStack
5. Check Sentry — confirm user ID and destination/depth tags appear on any captured error

---

No new dependencies. No schema changes. No env vars.
When all DoD items are checked, state: "Observability logging complete."
