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
