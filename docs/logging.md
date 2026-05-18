# Logging & Observability

Two services. Different jobs. Neither replaces the other.

---

## The two services

### BetterStack — structured event log

BetterStack receives every `log.info` / `log.warn` / `log.error` call as a searchable, filterable JSON record. Think of it as a live spreadsheet of everything that happened in your app — requests, pipeline runs, costs, errors — in chronological order.

**How it works in this project:**
The logger (`src/lib/logger.ts`) serialises each call to JSON and writes it to stdout. Vercel forwards all stdout to BetterStack via a log drain (configured in the Vercel dashboard under Integrations → BetterStack). Nothing special needed in code; any `console.log` output in production ends up there.

The `trackEvent` wrapper (`src/lib/analytics.ts`) sits on top of `log.info` and adds a consistent `event` field + `ts` timestamp to every call, making it easy to filter by event name in BetterStack.

### Sentry — error tracking and alerting

Sentry catches unhandled exceptions and agent-level failures. It groups repeated errors, shows you the full stack trace, and can page you when something breaks. It also stores user context (user ID, destination, depth) so you can see exactly what a user was doing when an error occurred.

**How it works in this project:**
Sentry is initialised in `sentry.server.config.ts`. In the brief route, we set the user and tags before the pipeline runs. In agent catch blocks, we explicitly call `Sentry.captureException` so agent failures are tracked even though they don't throw (agents return `status: 'failed'` instead of throwing — see CLAUDE.md).

---

## What gets logged where

### BetterStack events (via `trackEvent`)

| Event                  | Where fired                                         | Key fields                                                                                  | What you can do with it                                                                  |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `user.signup`          | Clerk webhook                                       | `userId`, `email`                                                                           | Track growth, cohort analysis, welcome email confirmation                                |
| `brief.started`        | `app/api/brief/route.ts`                            | `userId`, `depth`, `destination`, `nationality`                                             | Funnel: how many starts turn into completions? Which destinations are most searched?     |
| `brief.generated`      | `app/api/brief/route.ts`                            | `userId`, `briefId`, `depth`, `durationMs`, `estimatedCostUsd`, `degraded`, `agentStatuses` | Pipeline health, cost tracking per brief, degraded brief rate                            |
| `brief.failed`         | `app/api/brief/route.ts`                            | `userId`, `depth`, `destination`, `errorMessage`                                            | Failure rate by destination or depth, catch systematic errors                            |
| `free_cap.reached`     | `app/api/brief/route.ts`                            | `userId`, `ipAddress`, `briefsUsed`, `destination`                                          | Upgrade funnel trigger — users hitting the cap are the warmest leads for paid conversion |
| `payment.completed`    | Stripe webhook                                      | `userId`, `briefId`, `depth`, `amountUsd`                                                   | Revenue tracking, paid brief volume, revenue by depth tier                               |
| `brief.pdf_downloaded` | `app/api/events/route.ts` (fired from BriefActions) | `userId`, `briefId`, `depth`                                                                | Engagement signal — PDF download = high-value usage                                      |
| `brief.shared`         | `app/api/events/route.ts` (fired from BriefActions) | `userId`, `briefId`                                                                         | Viral loop signal, sharing rate                                                          |

### BetterStack logs (via `log` directly — pipeline internals)

These aren't business events; they're operational logs for debugging pipeline runs.

| Message                                             | Level | Where                        |
| --------------------------------------------------- | ----- | ---------------------------- |
| `pipeline start` / `pipeline start [DRY_RUN]`       | info  | Brief route                  |
| `pipeline complete` / `pipeline complete [DRY_RUN]` | info  | Brief route                  |
| `pipeline error`                                    | error | Brief route catch block      |
| `saveBrief failed`                                  | error | Brief route                  |
| `free tier cap check failed`                        | error | Brief route                  |
| `stripe webhook: job queued`                        | info  | Stripe webhook               |
| `stripe webhook: already processed`                 | info  | Stripe webhook (idempotency) |
| `stripe webhook: brief not found`                   | error | Stripe webhook               |
| `cron: processing job` / `cron: job complete`       | info  | Cron route                   |
| `cron: job failed`                                  | error | Cron route                   |

### Sentry (errors + context)

| What                                         | Where                                                                                                            | What you can do with it                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| User context (`userId`)                      | Set at pipeline start in brief route                                                                             | Every error in a pipeline run is tagged to the user — you can look up all errors for a specific user |
| Tags (`destination`, `nationality`, `depth`) | Set at pipeline start in brief route                                                                             | Filter errors in Sentry by destination — e.g., "show me all errors where destination = Myanmar"      |
| Agent exceptions                             | All 5 agent catch blocks (`officialPolicy`, `recentChanges`, `communityIntel`, `entryRequirements`, `borderRun`) | Know which agent is failing, on which destination, and how often — without those errors being silent |
| User context cleared                         | `finally` block in brief route                                                                                   | Prevents one user's context bleeding into another request on the same process                        |

---

## How to use BetterStack

1. Open your BetterStack dashboard → **Logs**
2. Filter by `event` field to track a specific event, e.g. `event:"brief.generated"`
3. Add a chart or alert on `event:"brief.failed"` to get notified when the failure rate spikes
4. Use the `userId` field to trace everything a specific user did across their session
5. Use `estimatedCostUsd` on `brief.generated` events to build a cost dashboard (sum by day)

**Useful saved queries to set up:**

- `event:"brief.started"` — daily brief volume
- `event:"brief.generated" degraded:true` — degraded brief rate
- `event:"free_cap.reached"` — upgrade funnel candidates
- `event:"payment.completed"` — revenue events

## How to use Sentry

1. Open your Sentry dashboard → **Issues**
2. New errors appear here automatically, grouped by type and stack trace
3. Click an issue to see the full stack trace + the user context and tags set when the error occurred
4. Set up an alert rule: **Alerts → Create Alert → Issue Alert** → trigger when a new issue is created, notify via Slack or email
5. Use **Tags** in the sidebar to filter errors by `destination` or `agent`

---

## PII policy

Per the spec — these fields are **never** logged to either service:

- Freeform input / situation description text
- Passport numbers
- Full email addresses in event payloads _(exception: `user.signup` — intentional for user lookup)_
- API keys or tokens

`userId` (a Clerk opaque ID like `user_2abc123`) is safe to log — it's a reference, not identifying information on its own.
a

---

## Adding a new event

1. Add a `trackEvent('event.name', { ...props })` call at the right moment
2. Keep props to scalar types — no objects, no arrays (except serialised as JSON string)
3. Check the PII policy above before including any field
4. No new dependencies, no schema changes, no env vars needed
