-- Migrate all VisaScout objects from public to a dedicated visascout schema.
-- This migration targets the shared sbw-dev Supabase project.
-- All application code points at this schema via db: { schema: 'visascout' } in the JS client.

-- ============================================================
-- SCHEMA
-- ============================================================

create schema if not exists visascout;

grant usage on schema visascout to anon, authenticated, service_role;

-- ============================================================
-- TABLES (final state — incorporates all prior ALTER migrations)
-- ============================================================

-- briefs: persisted VisaBrief output per generation
create table if not exists visascout.briefs (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  nationality           text        not null,
  destination           text        not null,
  visa_type             text,
  freeform_input        text,
  visa_request          jsonb,
  brief_markdown        text,
  conflict_report       jsonb,
  agent_statuses        jsonb,
  overall_confidence    text,
  degraded              boolean     not null default false,
  depth                 text        not null,
  user_id               text,
  stripe_session_id     text,
  payment_status        text        not null default 'unpaid',
  total_tokens_input    integer,
  total_tokens_output   integer,
  tavily_searches       integer,
  estimated_cost_usd    numeric(10, 6),
  deleted_at            timestamptz
);

alter table visascout.briefs enable row level security;

create policy "briefs_public_read_by_id"
  on visascout.briefs for select
  using (deleted_at is null);

create policy "briefs_insert_service_role_only"
  on visascout.briefs for insert
  with check (false);

create policy "briefs_update_service_role_only"
  on visascout.briefs for update
  using (false);

create policy "briefs_delete_service_role_only"
  on visascout.briefs for delete
  using (false);

grant select           on visascout.briefs to anon, authenticated;
grant insert, update, delete on visascout.briefs to service_role;

-- brief_jobs: background job queue for paid brief pipeline
create table if not exists visascout.brief_jobs (
  id           uuid        primary key default gen_random_uuid(),
  brief_id     uuid        not null references visascout.briefs(id),
  status       text        not null default 'pending', -- pending | processing | done | failed
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz,
  error        text,
  constraint brief_jobs_brief_id_unique unique (brief_id)
);

alter table visascout.brief_jobs enable row level security;
create policy "brief_jobs_no_direct_access" on visascout.brief_jobs using (false);

grant select, insert, update, delete on visascout.brief_jobs to service_role;

-- free_brief_daily: one Quick brief per userId per calendar day
create table if not exists visascout.free_brief_daily (
  user_id text not null,
  date    date not null default current_date,
  count   integer not null default 0,
  primary key (user_id, date)
);

alter table visascout.free_brief_daily enable row level security;
create policy "free_brief_daily_no_direct_access" on visascout.free_brief_daily using (false);

grant select, insert, update, delete on visascout.free_brief_daily to service_role;

-- ip_abuse_log: soft flag only — no hard blocks (shared IPs penalise legitimate users)
create table if not exists visascout.ip_abuse_log (
  id         uuid        primary key default gen_random_uuid(),
  ip         text        not null,
  user_id    text,
  created_at timestamptz not null default now(),
  reason     text
);

alter table visascout.ip_abuse_log enable row level security;
create policy "ip_abuse_log_no_direct_access" on visascout.ip_abuse_log using (false);

grant select, insert, update, delete on visascout.ip_abuse_log to service_role;

-- early_access_users: invited users with unlimited paid brief access
create table if not exists visascout.early_access_users (
  id               uuid        primary key default gen_random_uuid(),
  user_id          text        not null unique,
  code_used        text        not null,
  redeemed_at      timestamptz not null default now(),
  briefs_generated integer     not null default 0,
  last_brief_at    timestamptz,
  revoked_at       timestamptz
);

alter table visascout.early_access_users enable row level security;
create policy "early_access_users_no_direct_access" on visascout.early_access_users using (false);

grant select, insert, update, delete on visascout.early_access_users to service_role;

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists free_brief_daily_user_date on visascout.free_brief_daily(user_id, date);
create index if not exists ip_abuse_log_ip            on visascout.ip_abuse_log(ip);
create index if not exists ip_abuse_log_created       on visascout.ip_abuse_log(created_at desc);
create index if not exists brief_jobs_status          on visascout.brief_jobs(status) where status = 'pending';
create index if not exists early_access_users_user_id on visascout.early_access_users(user_id);
create index if not exists early_access_users_code    on visascout.early_access_users(code_used);

-- ============================================================
-- RPC FUNCTIONS (search_path = visascout so unqualified table refs resolve correctly)
-- ============================================================

-- insert_brief: SECURITY DEFINER insert bypassing RLS for server-side writes
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
    nullif(p_data->>'user_id', '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function visascout.insert_brief(jsonb) to anon, authenticated, service_role;

-- increment_free_daily_count: atomic upsert-increment (avoids race conditions)
create or replace function visascout.increment_free_daily_count(p_user_id text, p_date date)
returns void
language plpgsql
security definer
set search_path = visascout
as $$
begin
  insert into free_brief_daily (user_id, date, count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set count = free_brief_daily.count + 1;
end;
$$;

grant execute on function visascout.increment_free_daily_count(text, date) to service_role;

-- increment_early_access_usage: atomic counter increment
create or replace function visascout.increment_early_access_usage(p_user_id text)
returns void
language plpgsql
security definer
set search_path = visascout
as $$
begin
  update early_access_users
  set briefs_generated = briefs_generated + 1,
      last_brief_at    = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function visascout.increment_early_access_usage(text) to service_role;
