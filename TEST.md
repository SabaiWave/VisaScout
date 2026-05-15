# VisaScout Test Suite

## Test Files

| File | What it covers |
|---|---|
| `src/__tests__/lib/sourceTier.test.ts` | `classifySourceTier()` and `highestTier()` — tier assignment for .gov, .go.th, iata.org, visahq.com, reddit.com, and unknown domains |
| `src/__tests__/lib/parseJSON.test.ts` | `parseJSON()` — strips ` ```json ``` ` and ` ``` ``` ` fences from LLM responses, passes clean JSON unchanged, handles edge cases |
| `src/__tests__/lib/cost.test.ts` | `estimateCost()`, `recordUsage()`, `printCostSummary()`, `resetUsage()`, `calculateReportCost()`, `getUsageLog()` — token cost tracking, report cost aggregation, log snapshot isolation |
| `src/__tests__/lib/freeTier.test.ts` | `checkFreeTierCap()`, `incrementFreeTierCount()`, `logIpAbuse()` — userId daily limit (1 Quick/day), RPC increment, IP abuse log insert |
| `src/__tests__/api/webhooks/stripe.test.ts` | Stripe webhook queue flow — signature validation, idempotency guard, job insert into brief_jobs, duplicate-key handling, 200-immediately response |
| `src/__tests__/synthesis/conflictResolver.test.ts` | `resolveConflicts()` — Tier 1 beats Tier 4, contested flagging, unverified output, all-agents-failed fallback, invalid JSON graceful fallback |
| `src/__tests__/agents/officialPolicy.test.ts` | `runOfficialPolicyAgent()` — success path with fixture data, required output fields, failure-never-throws, official domain bias |
| `src/__tests__/agents/recentChanges.test.ts` | `runRecentChangesAgent()` — success path, 90-day date filter, required output fields, failure-never-throws |
| `src/__tests__/agents/communityIntel.test.ts` | `runCommunityIntelAgent()` — success path, sourceTier always 4, verified always false, failure-never-throws |
| `src/__tests__/agents/entryRequirements.test.ts` | `runEntryRequirementsAgent()` — success path with fixture data, required output fields, failure-never-throws |
| `src/__tests__/agents/borderRun.test.ts` | `runBorderRunAgent()` — success path, dual Tavily search (official + community), required output fields, failure-never-throws |
| `src/__tests__/pipeline.test.ts` | Full pipeline integration — all 5 agents resolve, ConflictReport produced, VisaBrief with all required sections, degraded scenario (one agent fails → brief still produced, metadata.degraded=true) |

## Running Tests

```bash
# Run the full suite
npm test

# Run a single file
npm test -- src/__tests__/lib/sourceTier.test.ts

# Watch mode (re-runs on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Coverage Targets

| Scope | Target |
|---|---|
| `src/lib/` | 100% line coverage |
| `src/synthesis/conflictResolver.ts` | 90%+ line coverage |
| `src/agents/` | 70%+ line coverage |
| Overall | 70%+ line coverage |

All targets must pass before Phase 2.
