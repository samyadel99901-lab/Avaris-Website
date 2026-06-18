# Phase 3 — One-time Setup

Run these once after pulling Phase 3. After that, the Vercel cron does the
work and you only ever come back here for new admins or rotating tokens.

## What this gives you
- `clients` + `projects` tables in Supabase, kept in sync from Monday.com
- A scheduled cron that syncs every 30 minutes
- Real data in `/admin/overview`, `/admin/clients`, `/admin/projects`,
  `/admin/reports`, and `/admin/analytics`

---

## 0. Prerequisites

Make sure these env vars are set in `.env.local` before continuing:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
SUPABASE_SERVICE_ROLE_KEY=sb_secret_…

# Monday API token — Profile → Developers → Personal API token
MONDAY_API_TOKEN=eyJ…

# Cron auth (any random 32+ chars)
CRON_SECRET=…

# Stay on mock until step 5; then flip to "supabase"
ADMIN_DATA_SOURCE=mock
```

---

## 1. Run the migration in Supabase

1. Open the Supabase dashboard → **SQL Editor**.
2. Paste the contents of `supabase/migrations/0002_real_data_layer.sql`.
3. Run.
4. Verify three new tables exist in the **Table Editor**:
   - `clients`
   - `projects`
   - `sync_runs`

The migration is idempotent — safe to re-run if you tweak it.

---

## 2. Initial sync (local, ~3-5 min)

```bash
npm install     # picks up tsx if you don't have it
npm run sync:monday:initial
```

You'll see live progress: pages fetched, rows upserted, links resolved.

When it finishes you should see something like:

```
✅ Initial sync complete!
   Clients:   310 fetched, 310 inserted, 0 updated, 0 failed
   Projects:  3381 fetched, 3381 inserted, 0 updated, 0 failed
   Resolved client links:   3300
   Total duration:          4m 12s
```

If a row or two fail, the script keeps going. The numbers + errors land
in the `sync_runs` table for review. Re-running is always safe — upsert
keys on `monday_item_id`.

---

## 3. Verify in Supabase

Open Table Editor → **clients** and confirm a sample row:
- `name`, `email`, `country` populated
- `status` reflects the Monday group (e.g. "active", "important")
- `is_special_deal` correct for your special-deal clients

Same for **projects**:
- `client_id` filled in (FK to clients)
- `class`, `video_type`, `paypal_income_cents` look right
- `is_scammer` only true for the SCAMMER-tagged ones

Pop into **sync_runs** to see the audit log of the run.

---

## 4. Switch the dashboard to live data

Edit `.env.local`:

```diff
- ADMIN_DATA_SOURCE=mock
+ ADMIN_DATA_SOURCE=supabase
```

Restart the dev server:

```bash
npm run dev
```

Open `/admin/overview` — KPIs should now show real numbers from Supabase.

---

## 5. Deploy + cron

```bash
git push origin main
```

In **Vercel dashboard → Project → Settings → Environment Variables**, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONDAY_API_TOKEN`
- `MONDAY_BOARD_CLIENTS_ID` (defaults to 6589322272)
- `MONDAY_BOARD_PROJECTS_ID` (defaults to 6589241558)
- `CRON_SECRET`
- `ADMIN_DATA_SOURCE=supabase`
- `NEXT_PUBLIC_TRACKING_ENABLED=true` (if you want live tracking too)
- All `SESSION_SECRET` + `ADMIN_*` vars from `.env.local`

After the deploy completes, Vercel automatically picks up `vercel.json`
and starts running the incremental sync every 30 minutes. You can verify
by checking **Vercel → Logs → /api/cron/sync-monday** and the `sync_runs`
table.

---

## 6. Manual sync from the dashboard

Super-admins can also trigger a sync from `/admin/settings` → **Sync now**.
The button is disabled for non-super admins.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Initial sync says "Another sync is already running" | Previous attempt crashed | Wait 15 min for the stale-lock window OR `update sync_runs set status='failed' where status='running'` |
| Sync fails with `unauthorized` from Monday | Wrong / expired token | Regenerate Monday personal API token, paste into `.env.local`, re-run |
| Most projects have `client_id IS NULL` | Client board wasn't synced first OR missing board_relation values | Re-run sync — runner always syncs clients first then resolves FKs |
| `/admin/overview` shows zeros | `ADMIN_DATA_SOURCE` still set to `mock` | Set to `supabase`, restart dev server |
| Cron not firing in production | `CRON_SECRET` mismatch | Verify env var matches what's in `vercel.json` log header |
| 5xx from `/api/admin/sync-monday/run` | Function timeout (60s on Hobby) | Use the local `npm run sync:monday:initial` for full syncs; cron handles incrementals |

---

## What changes after Phase 3

- The `(panel)` admin layout now expects Supabase to be configured. Mock
  mode still works for local dev — flip `ADMIN_DATA_SOURCE` to switch.
- Adding new admins still happens via env vars (Phase 2b will swap to
  Clerk / Supabase Auth and remove the `ADMIN_*_N` block).
- Tracking events keep writing to `events` — Phase 3 turns those into
  the live `/admin/overview` charts via `analytics.supabase.ts`.
