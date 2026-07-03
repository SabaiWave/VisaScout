-- Add is_dry_run flag to briefs.
-- Marks briefs generated with DRY_RUN=true (fixture data, no real API calls).
-- Defaults to false — all existing production briefs are real.
--
-- Dev backfill (run manually in local Supabase, not in production):
--   UPDATE visascout.briefs SET is_dry_run = true WHERE funded_by = 'free';

ALTER TABLE visascout.briefs
  ADD COLUMN IF NOT EXISTS is_dry_run boolean NOT NULL DEFAULT false;
