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
