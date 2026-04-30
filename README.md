# VisaScout

[![CI](https://github.com/SabaiWave/VisaScout/actions/workflows/ci.yml/badge.svg)](https://github.com/SabaiWave/VisaScout/actions/workflows/ci.yml)

**Live:** [visa-scout.vercel.app](https://visa-scout.vercel.app)

Visa intelligence for digital nomads and long-stay travelers.

Input your nationality, destination, and situation. Five parallel AI agents pull official immigration sources, recent policy changes, community intel, entry requirements, and border run rules. A conflict resolver reconciles contradictions by source authority. Synthesis outputs a structured visa brief with a recommended action, deadline, and per-claim confidence scores.

**Supported destinations (MVP):** Thailand, Vietnam, Indonesia, Malaysia, Philippines, Cambodia, Laos, Myanmar, Singapore, Brunei

---

## Getting started

### Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com)
- A [Tavily API key](https://tavily.com)

### Setup

```bash
git clone https://github.com/SabaiWave/visascout.git
cd visascout
npm install
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY and TAVILY_API_KEY in .env.local
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run in dry-run mode (zero API cost)

Set `DRY_RUN=true` in `.env.local`. The pipeline uses fixture data instead of making real API calls — useful for UI development and testing.

---

## Testing

```bash
npm test                              # run all tests
npm test -- --watch                   # watch mode
npm test -- --coverage                # with coverage report
npm test -- src/__tests__/path/to/file.test.ts  # single file
```

See [TEST.md](TEST.md) for a full list of test files and coverage targets.

---

## Architecture

```
User input → Orchestrator (normalizes freeform → VisaRequest)
  → Promise.allSettled([
      OfficialPolicy   (gov/official sources)
      RecentChanges    (last 90 days, news)
      CommunityIntel   (Reddit, Nomad List, forums)
      EntryRequirements (documents, proof of funds)
      BorderRun        (limits, crossings, enforcement)
    ])
  → ConflictResolver  (tier + recency weighting)
  → Synthesis         (final VisaBrief)
  → SSE stream → UI
```

One failed agent = degraded brief, never an error screen.

### Source tier system

| Tier | Sources                                       | Trust         |
| ---- | --------------------------------------------- | ------------- |
| 1    | Government immigration portals (.gov, .go.th) | Authoritative |
| 2    | IATA, Timatic, official travel advisories     | High          |
| 3    | Aggregators (VisaHQ, Sherpa, iVisa)           | Medium        |
| 4    | Community (Reddit, Nomad List, forums)        | Ground truth  |

Tier 1 beats all other tiers regardless of recency. Tier 4 never overrides Tier 1–2 but flags enforcement divergence.

### Key directories

```
app/api/brief/route.ts   — SSE streaming endpoint
app/page.tsx             — main UI
src/agents/              — five parallel agents (pure TS, no Next.js imports)
src/orchestrator.ts      — input normalization + agent dispatch
src/synthesis/           — conflict resolver + brief synthesis
src/prompts/             — all LLM prompt functions
src/lib/                 — parseJSON, sourceTier, cost tracking, logger
src/types/index.ts       — all shared interfaces (source of truth)
config/client.ts         — brand config (B2B white-label ready)
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.

| Variable                                                                             | Required               | Phase |
| ------------------------------------------------------------------------------------ | ---------------------- | ----- |
| `ANTHROPIC_API_KEY`                                                                  | Yes                    | 1     |
| `TAVILY_API_KEY`                                                                     | Yes                    | 1     |
| `SENTRY_DSN`                                                                         | Observability          | 2     |
| `NEXT_PUBLIC_SENTRY_DSN`                                                             | Observability (client) | 2     |
| `BETTERSTACK_SOURCE_TOKEN`                                                           | Uptime monitoring      | 2     |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`                   | Database               | 4     |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`                             | Auth                   | 5     |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments               | 6     |

---

## Tech stack

- **Framework:** Next.js 14+ (App Router)
- **AI:** Anthropic Claude (`claude-sonnet-4-6`)
- **Search:** Tavily API
- **Styling:** Tailwind CSS
- **Auth:** Clerk (Phase 5)
- **Database:** Supabase (Phase 4)
- **Payments:** Stripe (Phase 6)
- **Deployment:** Vercel

---

## Legal

VisaScout aggregates publicly available information. It is not a legal advisor. Every brief includes a disclaimer and source citations. Verify all visa requirements with official sources before travel.
