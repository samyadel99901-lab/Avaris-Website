# Scripts

## `initial-sync.ts` — One-time Monday → Supabase backfill

Run with: `npm run sync:monday:initial`

### When to run it
Run this **once**, locally, after you've:
1. Applied the Phase 3 migration in Supabase (`0002_real_data_layer.sql`)
2. Set `MONDAY_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
   in `.env.local`

After this initial run, the **Vercel cron** keeps everything in sync —
you should never need to run this again.

### Why local, not on Vercel?
The full sync of ~3,700 items takes about 3-5 minutes. Vercel's Hobby
plan has a 60-second function-execution limit, so a full sync there
would time out. Locally there's no timeout.

### Is it safe to re-run?
Yes. Upserts key on `monday_item_id`, so a re-run just refreshes any
rows that changed. If a previous run failed partway through, just run
it again — there's no clean-up to do.

### What if it fails?
- The script writes one row per source to `sync_runs` with status,
  errors, and timing.
- If you see "Another sync is already running", a previous attempt
  crashed without releasing the lock. Wait 15 minutes (the stale-lock
  window) or manually update the row:
  ```sql
  update sync_runs
     set status='failed', finished_at=now()
   where status='running'
     and source='monday_full';
  ```
- For per-item failures, check `sync_runs.error_message` for the first
  five errors. Common cause: a field on a Monday item is in an
  unexpected shape — the normalizer logs which item id and what failed.

### How do I know it succeeded?
Open the Supabase Table Editor:
- `clients` → ~310 rows
- `projects` → ~3,381 rows
- `sync_runs` → 3 rows: `monday_clients` (success), `monday_projects`
  (success), `monday_full` (success)

The script also prints a summary at the end:
```
✅ Initial sync complete!
   Clients:                 310 fetched, 310 inserted, 0 updated, 0 failed
   Projects:                3381 fetched, 3381 inserted, 0 updated, 0 failed
   Resolved client links:   3300
   Total duration:          4m 12s
```

---

## `hash-password.mjs` — Argon2id password hasher

Run with: `npm run hash-password`

Interactive prompt that produces an `ADMIN_PASSWORD_HASH_N=…` line
ready to paste into `.env.local` (escaped `$` characters and all).

---

## `generate-thumbnails.mjs` — Video thumbnail extractor

Runs as `prebuild` automatically. Generates poster images for the
landing-page videos so we don't ship raw MP4 first frames.
