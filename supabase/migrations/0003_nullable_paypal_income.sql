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
