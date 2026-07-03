-- Migrate free_brief_daily.user_id from Clerk text to internal uuid FK.
-- Add increment_user_brief_count RPC for universal briefs_generated tracking.

-- ============================================================
-- 1. ENSURE ALL free_brief_daily USERS EXIST IN users TABLE
-- ============================================================

insert into visascout.users (clerk_user_id)
select distinct fbd.user_id
from visascout.free_brief_daily fbd
where not exists (
  select 1 from visascout.users u where u.clerk_user_id = fbd.user_id
)
on conflict (clerk_user_id) do nothing;

-- ============================================================
-- 2. MIGRATE free_brief_daily.user_id text → uuid FK
-- ============================================================

alter table visascout.free_brief_daily
  add column if not exists _user_id_new uuid references visascout.users(id);

update visascout.free_brief_daily fbd
set _user_id_new = u.id
from visascout.users u
where u.clerk_user_id = fbd.user_id;

-- Drop old PK (covers user_id text + date)
alter table visascout.free_brief_daily drop constraint if exists free_brief_daily_pkey;

-- Drop old index on (user_id, date) — was text-based
drop index if exists visascout.free_brief_daily_user_date;

-- Drop old text column
alter table visascout.free_brief_daily drop column user_id;

-- Rename uuid column
alter table visascout.free_brief_daily rename column _user_id_new to user_id;

-- NOT NULL + new PK + FK
alter table visascout.free_brief_daily alter column user_id set not null;
alter table visascout.free_brief_daily add constraint free_brief_daily_pkey primary key (user_id, date);

create index if not exists free_brief_daily_user_date on visascout.free_brief_daily(user_id, date);

-- ============================================================
-- 3. UPDATE increment_free_daily_count RPC — now takes uuid
-- ============================================================

create or replace function visascout.increment_free_daily_count(p_user_id uuid, p_date date)
returns void language plpgsql security definer
set search_path = visascout
as $$
begin
  insert into free_brief_daily (user_id, date, count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set count = free_brief_daily.count + 1;
end;
$$;

-- ============================================================
-- 4. ADD increment_user_brief_count RPC — universal counter by internal uuid
-- ============================================================

create or replace function visascout.increment_user_brief_count(p_user_id uuid)
returns void language plpgsql security definer
set search_path = visascout
as $$
begin
  update users
  set briefs_generated = briefs_generated + 1,
      last_brief_at    = now()
  where id = p_user_id;
end;
$$;

grant execute on function visascout.increment_user_brief_count(uuid) to service_role;
