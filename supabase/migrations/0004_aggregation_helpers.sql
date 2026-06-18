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
