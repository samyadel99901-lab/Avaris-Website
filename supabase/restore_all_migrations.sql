-- =====================================================================
-- AVARIS — combined restore script (migrations 0001 → 0005, in order).
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to re-run (every migration is idempotent).
-- =====================================================================



-- ###################################################################
-- # migrations/0001_admin_dashboard.sql
-- ###################################################################

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


-- ###################################################################
-- # migrations/0002_real_data_layer.sql
-- ###################################################################

-- =====================================================================
-- AVARIS — Phase 3: Monday-synced clients + projects, sync audit log.
--
-- Source of truth: Monday.com boards
--   - Customer Projects (id 6589241558) → projects
--   - 2025 Clients Data (id 6589322272) → clients
--
-- One-way sync. Every run upserts on monday_item_id (unique).
--
-- Currency convention (explicit suffixes — no ambiguity):
--   *_cents  → USD in cents          (paypal, deposit, samy_paypal, prices)
--   *_egp    → EGP in whole units    (editor_cost, bonus)
--   text price columns left as text  (price_class_c)
--
-- RLS: enabled on all 3 tables, no policies. Service role bypasses.
-- All admin reads + sync writes go through SUPABASE_SERVICE_ROLE_KEY
-- on the server side.
--
-- Idempotent — safe to re-run. Depends on the 0001 migration's
-- public.set_updated_at() trigger function and pgcrypto extension.
-- =====================================================================

-- ── pg_trgm enables fuzzy search on client name/email/code ────────────
create extension if not exists pg_trgm;

-- ── clients ───────────────────────────────────────────────────────────
create table if not exists public.clients (
  id                       uuid primary key default gen_random_uuid(),
  monday_item_id           bigint not null unique,
  monday_group_id          text,

  name                     text not null,
  email                    text,
  code                     text,
  country                  text,
  team_leader              text,
  platform                 text,
  eta                      text,
  payment_schedule         text,

  -- standard pricing (USD cents)
  price_a_less_1min_cents  integer,
  price_a_more_1min_cents  integer,
  price_b_less_1min_cents  integer,
  price_b_more_1min_cents  integer,

  -- special-deal pricing (USD cents)
  special_a_video_cents    integer,
  special_a_reel_cents     integer,
  special_b_video_cents    integer,
  special_b_reel_cents     integer,

  price_class_c            text,

  is_special_deal          boolean not null default false,
  needs_followup           boolean not null default false,
  is_reconnecting          boolean not null default false,

  last_project_at          timestamptz,

  status                   text not null default 'active'
    check (status in (
      'new','to_review','important','active',
      'quiet','not_found','upset','inactive'
    )),

  monday_updated_at        timestamptz,
  synced_at                timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists clients_email_idx     on public.clients (email);
create index if not exists clients_status_idx    on public.clients (status);
create index if not exists clients_group_idx     on public.clients (monday_group_id);
create index if not exists clients_country_idx   on public.clients (country);
create index if not exists clients_last_proj_idx on public.clients (last_project_at desc nulls last);

-- Trigram search across name + email + code (used by /admin/clients search box)
create index if not exists clients_search_trgm_idx
  on public.clients
  using gin (
    (coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(code,''))
    gin_trgm_ops
  );

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ── projects ──────────────────────────────────────────────────────────
create table if not exists public.projects (
  id                       uuid primary key default gen_random_uuid(),
  monday_item_id           bigint not null unique,
  monday_group_id          text,

  name                     text not null,
  code                     text,

  client_id                uuid references public.clients(id) on delete set null,
  client_name_text         text,                -- fallback if board_relation empty
  monday_client_item_id    bigint,              -- raw Monday id, used to resolve client_id

  class                    text check (class in ('A','B','C')),
  video_type               text check (video_type in (
    'reel_short','reel_long','video_short','video_long','photo','other'
  )),
  video_type_raw           text,

  status                   text,
  invoice_status           text,
  editor_pay_status        text,
  delivery_status          text,

  timeline_start           date,
  timeline_end             date,

  paypal_income_cents      integer not null default 0,
  deposit_cents            integer not null default 0,
  samy_paypal_cents        integer not null default 0,
  editor_cost_egp          integer not null default 0,
  bonus_egp                integer not null default 0,

  is_scammer               boolean not null default false,

  client_eta               text,
  footage_link             text,
  final_video_link         text,

  monday_updated_at        timestamptz,
  synced_at                timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists projects_client_idx         on public.projects (client_id);
create index if not exists projects_status_idx         on public.projects (status);
create index if not exists projects_class_idx          on public.projects (class);
create index if not exists projects_video_type_idx     on public.projects (video_type);
create index if not exists projects_invoice_idx        on public.projects (invoice_status);
create index if not exists projects_timeline_idx       on public.projects (timeline_start desc nulls last);
create index if not exists projects_monday_updated_idx on public.projects (monday_updated_at desc nulls last);
create index if not exists projects_monday_client_idx  on public.projects (monday_client_item_id);

-- Composite for "popular combination" report
create index if not exists projects_class_videotype_idx
  on public.projects (class, video_type)
  where class is not null and video_type is not null;

-- Trigram search across name + code + client_name_text
create index if not exists projects_search_trgm_idx
  on public.projects
  using gin (
    (coalesce(name,'') || ' ' || coalesce(code,'') || ' ' || coalesce(client_name_text,''))
    gin_trgm_ops
  );

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ── sync_runs (audit log) ─────────────────────────────────────────────
create table if not exists public.sync_runs (
  id              uuid primary key default gen_random_uuid(),
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  source          text not null
    check (source in ('monday_clients','monday_projects','monday_full')),
  status          text not null default 'running'
    check (status in ('running','success','partial','failed','skipped')),
  mode            text not null default 'full'
    check (mode in ('full','incremental')),
  triggered_by    text not null default 'manual_local'
    check (triggered_by in ('cron','manual_admin','manual_local')),
  items_fetched   integer not null default 0,
  items_inserted  integer not null default 0,
  items_updated   integer not null default 0,
  items_failed    integer not null default 0,
  error_message   text,
  duration_ms     integer
);

create index if not exists sync_runs_started_idx   on public.sync_runs (started_at desc);
create index if not exists sync_runs_source_status_idx
  on public.sync_runs (source, status, finished_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────
alter table public.clients   enable row level security;
alter table public.projects  enable row level security;
alter table public.sync_runs enable row level security;
-- No policies → anon/authenticated denied. Service role bypasses RLS.

-- ── Helper: re-link projects to clients after a sync ──────────────────
-- Called at the end of a sync run. Cheap because of monday_client_idx.
create or replace function public.resolve_project_client_ids()
returns integer language plpgsql as $$
declare touched integer;
begin
  update public.projects p
     set client_id = c.id
    from public.clients c
   where p.monday_client_item_id = c.monday_item_id
     and (p.client_id is null or p.client_id <> c.id);
  get diagnostics touched = row_count;
  return touched;
end;
$$;


-- ###################################################################
-- # migrations/0003_nullable_paypal_income.sql
-- ###################################################################

-- =====================================================================
-- AVARIS — Phase 3 follow-up: distinguish "no PayPal data" from "$0".
--
-- Background: paypal_income_cents was originally NOT NULL DEFAULT 0
-- because we expected every project to have a PayPal Income value. In
-- reality:
--   - Pre-2026 projects: only "Samy's PayPal" was filled (older col)
--   - Recent projects: only "PayPal Income" is filled (newer col)
--   - Some have both
--   - Some have neither (legitimate — e.g. pro-bono work, scammers)
--
-- The sync now picks PayPal Income → Samy's PayPal → null. Storing 0
-- when neither column has data would skew aggregates (sum, average,
-- "did any project earn money this month") into thinking those rows
-- are real $0 deals.
--
-- Idempotent — safe to re-run.
-- =====================================================================

alter table public.projects
  alter column paypal_income_cents drop not null;

alter table public.projects
  alter column paypal_income_cents drop default;


-- ###################################################################
-- # migrations/0004_aggregation_helpers.sql
-- ###################################################################

-- =====================================================================
-- AVARIS — Phase 3 follow-up: aggregation helpers.
--
-- Supabase ships PostgREST with `db-max-rows = 1000` by default. That
-- cap silently truncates `.select()` results — our "fetch all rows,
-- aggregate in JS" pattern then computes against only 1000 rows out of
-- (currently) 3,382 projects, producing wildly wrong charts.
--
-- For the simplest aggregation — status distribution — pushing it into
-- Postgres keeps the round-trip to one row per distinct status. The
-- other aggregations are handled by client-side pagination because
-- they need richer per-row data (timeline, FK joins, etc.) that's
-- awkward to express in a single grouping query.
--
-- Idempotent — safe to re-run.
-- =====================================================================

create or replace function public.project_status_distribution()
returns table(status text, count bigint)
language sql
stable
security invoker
as $$
  select p.status, count(*)::bigint as count
  from public.projects p
  where p.status is not null
  group by p.status
  order by count(*) desc;
$$;


-- ###################################################################
-- # migrations/0005_paypal_automation.sql
-- ###################################################################

-- =====================================================================
-- AVARIS — PayPal invoicing automation.
--
-- Records every PayPal invoice the automation creates + sends. Serves
-- two purposes:
--   1. History — the admin "Automation" page lists past sends.
--   2. Idempotency — before invoicing a project we check whether its
--      monday_item_id already appears in a prior send, so a customer is
--      never double-invoiced.
--
-- Currency convention matches 0002: amounts stored in USD cents.
--
-- RLS: enabled, no policies. Service role (server) bypasses; anon and
-- authenticated are denied. Idempotent — safe to re-run. Depends on the
-- 0001 migration's public.set_updated_at() trigger function.
-- =====================================================================

create table if not exists public.paypal_invoices (
  id                 uuid primary key default gen_random_uuid(),

  customer_email     text not null,
  customer_name      text,
  currency           text not null default 'USD',
  total_cents        integer not null,

  -- 'sent'   → created in PayPal and sent to the recipient
  -- 'failed' → create or send threw; error_message holds the reason
  status             text not null
    check (status in ('sent','failed')),

  paypal_invoice_id  text,
  error_message      text,
  sent_at            timestamptz,

  -- Monday "Customer Projects" item ids bundled into this invoice.
  -- Used for the double-invoice guard.
  monday_item_ids    bigint[] not null default '{}',

  -- Snapshot of the invoiced videos: [{ monday_item_id, project_name,
  -- description, amount_cents }]. Frozen at send time for the history view.
  line_items         jsonb not null default '[]'::jsonb,

  triggered_by       text not null default 'manual_admin'
    check (triggered_by in ('manual_admin','cron')),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists paypal_invoices_created_idx
  on public.paypal_invoices (created_at desc);
create index if not exists paypal_invoices_email_idx
  on public.paypal_invoices (customer_email);
create index if not exists paypal_invoices_status_idx
  on public.paypal_invoices (status);

-- Containment lookups for the idempotency guard
-- (monday_item_ids && ARRAY[...]::bigint[]).
create index if not exists paypal_invoices_monday_items_idx
  on public.paypal_invoices using gin (monday_item_ids);

drop trigger if exists paypal_invoices_set_updated_at on public.paypal_invoices;
create trigger paypal_invoices_set_updated_at
  before update on public.paypal_invoices
  for each row execute function public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────
alter table public.paypal_invoices enable row level security;
-- No policies → anon/authenticated denied. Service role bypasses.
