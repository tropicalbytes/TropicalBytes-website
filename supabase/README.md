# Supabase — TropicalBytes admin data

Project: `tropicalbytes-production` (ref `bftbqypdbbcqmxsaisxx`, region ap-northeast-2, Postgres 17, Free plan).
Every change below was run by hand in **Dashboard → SQL Editor**, one checkpoint at a time, and verified
with the matching read-only query in `verify/` (every row must show `ok = true`). Because the SQL Editor
was used rather than the CLI, Supabase's own migration history is empty — the files here are the record.

| Order | Checkpoint | File | What it does | Verify with | Status |
|---|---|---|---|---|---|
| 1 | A | `migrations/0001_init.sql` | 9 tables, RLS (29 policies), audit triggers, `publish_menu()`, explicit table privileges, `menus` storage bucket | `verify/checkpoint_a_verify.sql` | ✅ 2026-10-04 |
| 2 | A.1 | `migrations/0002_lock_trigger_functions.sql` | Trigger functions no longer callable over the API | — (advisor) | ✅ 2026-10-04 |
| 3 | B | `seed.sql` | Today's catalog: 4 tiers, 16 plan options, 42 menu items, 39 bulk items, 2 settings | `verify/checkpoint_b_verify.sql` | ✅ 2026-10-04 |
| 4 | A.2 | `migrations/0003_definer_functions_out_of_api.sql` | `is_admin()` → `private` schema; `publish_menu()` runs as the caller | `verify/checkpoint_a2_verify.sql` | ✅ 2026-10-04 |
| 5 | C | Dashboard user + `admin/checkpoint_c_grant_admin.sql` | Owner login + admin row | `verify/checkpoint_c_verify.sql` | ✅ 2026-10-04 |

After each step, check Supabase **Advisors → Security**. As of C the only finding is *Leaked Password Protection Disabled*, a Pro-plan feature (accepted on Free).

## Security model in one paragraph
Tables are readable by the public website only through explicit `GRANT select` + RLS (`is_active` rows,
the current menu, offers inside their IST date window). Writes are granted per column to signed-in users,
and RLS then lets through only users listed in `public.admins` (checked by `private.is_admin()`, which is
not exposed by the API). `id` columns are never writable, so stable keys can't change. Plans can be
disabled but not deleted. Every insert/update/delete is written to `audit_log` with the actor's id and
email. The `menus` bucket is public-read by URL, admin-only write, PDF-only, 5 MB max.

## For the app code
- Public catalog reads: `getCatalog()` from `lib/catalog` (server components). Cached 5 min under tag
  `catalog`; falls back to `lib/config.ts` if Supabase is unconfigured, unreachable, slow (>5 s) or
  returns incomplete data. `npm run check:catalog` verifies live parity with `lib/config.ts`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_…` key).
- Detect admin status with `select … from admins` (RLS returns the caller's own row only to admins);
  `rpc('is_admin')` does not exist.
- Publish a menu with `rpc('publish_menu', { p_menu_id })`.
- Party desserts are the `menu_items` rows with `category = 'dessert'` — there are none in `bulk_items`.
- Prices are integer rupees; per-meal price and delivery labels are derived in code, not stored.

## Tests
`npm run test:db` replays every file above (in the production order) on a throwaway in-memory Postgres
with production's default privileges and runs ~100 checks as anon / non-admin / owner. It never connects
to Supabase. `npm run generate:seed` regenerates `seed.sql` from `lib/config.ts` and fails on any
price/id drift against `google-apps-script/generated-allowlist.gs`.

## Rules (from CLAUDE.md)
No `drop`/`truncate`/unscoped `delete` against production. Show SQL before running it. New schema
changes go in a new numbered migration — never edit an applied one.
