-- Add visascout.users table (replaces early_access_users), add funded_by on briefs,
-- and migrate briefs.user_id from Clerk text to internal uuid FK.

-- ============================================================
-- 1. USERS TABLE
-- ============================================================

create table if not exists visascout.users (
  id               uuid        primary key default gen_random_uuid(),
  clerk_user_id    text        not null unique,
  invite_code      text,
  access_type      text,        -- 'invited' | null (extendable for future plan types)
  briefs_generated integer     not null default 0,
  last_brief_at    timestamptz,
  invited_at       timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now()
);

alter table visascout.users enable row level security;
create policy "users_no_direct_access" on visascout.users using (false);
grant select, insert, update, delete on visascout.users to service_role;

create index if not exists users_clerk_user_id on visascout.users(clerk_user_id);

-- ============================================================
-- 2. BACKFILL USERS FROM early_access_users
-- ============================================================

insert into visascout.users (
  clerk_user_id, invite_code, access_type,
  briefs_generated, last_brief_at, invited_at, revoked_at
)
select
  user_id,
  code_used,
  'invited',
  briefs_generated,
  last_brief_at,
  redeemed_at,
  revoked_at
from visascout.early_access_users
on conflict (clerk_user_id) do nothing;

-- ============================================================
-- 3. BACKFILL USERS FROM briefs (free users with no early_access row)
-- ============================================================

insert into visascout.users (clerk_user_id)
select distinct b.user_id
from visascout.briefs b
where b.user_id is not null
  and not exists (
    select 1 from visascout.users u where u.clerk_user_id = b.user_id
  )
on conflict (clerk_user_id) do nothing;

-- ============================================================
-- 4. ADD funded_by TO briefs
-- ============================================================

alter table visascout.briefs
  add column if not exists funded_by text;

-- ============================================================
-- 5. BACKFILL funded_by ON EXISTING BRIEFS
-- ============================================================

-- Paid via Stripe: has a real stripe_session_id
update visascout.briefs
set funded_by = 'stripe'
where stripe_session_id is not null
  and stripe_session_id != ''
  and payment_status = 'paid';

-- Invite code: payment_status = 'paid' but no Stripe session (the bug being fixed)
update visascout.briefs b
set funded_by = 'invite'
where (b.stripe_session_id is null or b.stripe_session_id = '')
  and b.payment_status = 'paid'
  and exists (
    select 1 from visascout.users u
    where u.clerk_user_id = b.user_id
      and u.access_type = 'invited'
  );

-- Free/quick briefs
update visascout.briefs
set funded_by = 'free'
where payment_status = 'unpaid';

-- ============================================================
-- 6. MIGRATE briefs.user_id FROM text (Clerk ID) TO uuid FK
-- ============================================================

alter table visascout.briefs
  add column if not exists _user_id_new uuid references visascout.users(id);

update visascout.briefs b
set _user_id_new = u.id
from visascout.users u
where u.clerk_user_id = b.user_id
  and b.user_id is not null;

alter table visascout.briefs drop column user_id;
alter table visascout.briefs rename column _user_id_new to user_id;

create index if not exists briefs_user_id on visascout.briefs(user_id);

-- ============================================================
-- 7. UPDATE increment_early_access_usage RPC → use users table
-- ============================================================

create or replace function visascout.increment_early_access_usage(p_user_id text)
returns void language plpgsql security definer
set search_path = visascout
as $$
begin
  update users
  set briefs_generated = briefs_generated + 1,
      last_brief_at    = now()
  where clerk_user_id = p_user_id;
end;
$$;

-- ============================================================
-- 8. UPDATE insert_brief RPC — user_id column is now uuid
-- (legacy RPC, not called by app code, kept for tooling)
-- ============================================================

create or replace function visascout.insert_brief(p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = visascout
as $$
declare
  v_id uuid;
begin
  insert into briefs (
    nationality,
    destination,
    visa_type,
    freeform_input,
    visa_request,
    brief_markdown,
    conflict_report,
    agent_statuses,
    overall_confidence,
    degraded,
    depth,
    user_id
  ) values (
    p_data->>'nationality',
    p_data->>'destination',
    nullif(p_data->>'visa_type', ''),
    nullif(p_data->>'freeform_input', ''),
    p_data->'visa_request',
    p_data->>'brief_markdown',
    p_data->'conflict_report',
    p_data->'agent_statuses',
    p_data->>'overall_confidence',
    (p_data->>'degraded')::boolean,
    p_data->>'depth',
    nullif(p_data->>'user_id', '')::uuid
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ============================================================
-- 9. DROP early_access_users (data migrated to users table)
-- ============================================================

drop table if exists visascout.early_access_users;
