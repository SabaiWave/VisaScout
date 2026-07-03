-- Add email column to visascout.users
-- Populated at create time (via Clerk API) and backfilled via scripts/backfill-user-emails.ts

ALTER TABLE visascout.users
  ADD COLUMN IF NOT EXISTS email text;
