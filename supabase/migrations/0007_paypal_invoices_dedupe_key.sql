-- =====================================================================
-- AVARIS — concurrency guard for the invoicing automation.
--
-- Adds a per-send dedupe key + a partial unique index so two concurrent
-- runs (double-click, retried request, two tabs) can't both insert a row
-- for the SAME set of Monday item ids — the second insert is rejected
-- atomically by Postgres, so a customer can never be double-invoiced.
--
-- The runner computes dedupe_key from the SORTED monday_item_ids.
-- Failed attempts (status='failed') are excluded from the index so a
-- genuine failure can be retried. Existing rows have dedupe_key = NULL
-- and are excluded from the index — this migration does NOT read, modify,
-- or migrate any existing rows. Idempotent / safe to re-run.
-- =====================================================================

alter table public.paypal_invoices
  add column if not exists dedupe_key text;

create unique index if not exists paypal_invoices_dedupe_key_uidx
  on public.paypal_invoices (dedupe_key)
  where status <> 'failed' and dedupe_key is not null;
