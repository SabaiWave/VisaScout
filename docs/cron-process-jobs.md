# Cron: Process Brief Jobs

**Route:** `GET /api/cron/process-jobs`
**Schedule:** Every minute (`* * * * *`) — defined in `vercel.json`

## Purpose

Decouples Stripe webhook handling from the brief generation pipeline.

Stripe requires a webhook response within 30 seconds. The brief pipeline takes 2–4 minutes. Running the pipeline inline would cause Stripe to time out, retry, and potentially trigger double-processing.

The webhook returns 200 immediately and queues a job. This cron picks it up.

## Flow

1. Fetch the oldest `pending` job from `brief_jobs`
2. Atomically claim it — `UPDATE WHERE status = 'pending'` + `.select()` to confirm exactly one row was updated. If 0 rows updated, another invocation already claimed it — skip.
3. Fetch the brief record (nationality, destination, depth, etc.)
4. Run the full pipeline (`runOrchestrator` → `resolveConflicts` → `synthesizeBrief`), or dry run fixture if `DRY_RUN=true`
5. Save brief content + cost columns to Supabase, set `payment_status = 'paid'`
6. Mark job `done`
7. On any failure: mark job `failed`, set brief `payment_status = 'error'`

## Job statuses

| Status | Meaning |
|---|---|
| `pending` | Queued by webhook, not yet picked up |
| `processing` | Claimed by a cron invocation, pipeline running |
| `done` | Pipeline complete, brief content saved |
| `failed` | Pipeline threw — error message stored in `brief_jobs.error` |

## Local testing

Vercel Cron doesn't run locally. Trigger manually:

```bash
curl http://localhost:3000/api/cron/process-jobs
```

## Related files

- `app/api/webhooks/stripe/route.ts` — inserts the job
- `app/api/cron/process-jobs/route.ts` — this handler
- `app/brief/pending/page.tsx` — polls `payment_status` until `paid`, then redirects
- `supabase/migrations/20260516000000_phase9_cost_and_limits.sql` — `brief_jobs` table schema
