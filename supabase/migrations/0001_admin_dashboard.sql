-- =====================================================================
-- AVARIS — Phase 2: visitor events + admin directory.
--
-- Privacy: no IPs stored, session_id is client-generated (localStorage),
-- no persistent cookies. Server-only writes via SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS. Phase 2b will add SELECT policies tied to admin
-- JWTs once we swap hardcoded auth → Supabase Auth / Clerk.
--
-- Idempotent — safe to re-run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ── Generic updated_at trigger ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── events: visitor tracking ───────────────────────────────────────────
create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  session_id        text not null,
  event_type        text not null
    check (event_type in (
      'page_view', 'video_play', 'video_progress',
      'cta_click', 'scroll_depth', 'external_link'
    )),
  event_data        jsonb not null default '{}'::jsonb,

  referrer          text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,

  user_agent        text,
  viewport_width    integer,
  viewport_height   integer,

  path              text not null
);

-- Hot query patterns:
--   "events of type X over the last N days" → composite (event_type, created_at)
--   "all events for session Y"              → session_id
--   "top pages"                             → path
--   "search inside event_data"              → gin
create index if not exists events_type_created_idx
  on public.events (event_type, created_at desc);
create index if not exists events_session_idx       on public.events (session_id);
create index if not exists events_created_at_idx    on public.events (created_at desc);
create index if not exists events_path_idx          on public.events (path);
create index if not exists events_data_gin          on public.events using gin (event_data);

-- ── admins ─────────────────────────────────────────────────────────────
create table if not exists public.admins (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text not null,
  role        text not null default 'admin'
    check (role in ('admin', 'super_admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists admins_email_idx on public.admins (email);

drop trigger if exists admins_set_updated_at on public.admins;
create trigger admins_set_updated_at
  before update on public.admins
  for each row execute function public.set_updated_at();

-- ── RLS: server-only writes ───────────────────────────────────────────
alter table public.events enable row level security;
alter table public.admins enable row level security;
-- No policies → anon/authenticated denied. Service role bypasses RLS.
