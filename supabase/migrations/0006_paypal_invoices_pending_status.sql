-- =====================================================================
-- AVARIS — widen paypal_invoices.status to allow a 'pending' state.
--
-- The invoicing runner now reserves a row as 'pending' BEFORE calling
-- PayPal, then flips it to 'sent' (or 'failed'). The original 0005 CHECK
-- only allowed ('sent','failed'), so this migration widens it.
--
-- This ONLY widens the allowed values — it adds 'pending' and keeps
-- 'sent' and 'failed'. It does NOT read, modify, or migrate any existing
-- rows (every existing row is already 'sent' or 'failed', which remain
-- valid under the new constraint). Idempotent / safe to re-run.
-- =====================================================================

alter table public.paypal_invoices
  drop constraint if exists paypal_invoices_status_check;

alter table public.paypal_invoices
  add constraint paypal_invoices_status_check
  check (status in ('pending','sent','failed'));
