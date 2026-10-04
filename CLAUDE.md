# TropicalBytes Admin Panel — Project Context for Claude Code

Read this before doing anything. It carries over state from prior planning work done in claude.ai chat. Don't repeat already-completed research/design work — build on it.

## What this project is

TropicalBytes.in is a live, deployed meal-subscription website (Next.js 14.2.35, React 18, TS, Tailwind). We are adding **Phase 1 of an Admin Panel** so the non-technical owner can manage menu/pricing/plans/offers without developer involvement, backed by Supabase (Postgres + Auth + Storage). Full background, architecture rationale, and the "why" behind every schema decision: **`docs/ADMIN-PHASE1-BLUEPRINT.md`** and **`docs/AUDIT-SUPABASE-INTEGRATION.md`**. Read both before making architectural changes — don't rediscover decisions already made there. If these two files are NOT present in this folder, say so immediately and ask the user to add them before proceeding with anything architectural.

Commercial context: existing site delivered for ₹8,000; this admin panel is a separately scoped ₹30,000 Phase 1. Future phases (customer auth, payments, orders) are explicitly out of scope — see blueprint §"Future Roadmap". Do not build toward them speculatively.

## Current status (as of 2026-10-04)

- **Audit of the existing codebase: done.** Findings F1–F13 in the blueprint, all cross-checked against the actual repo.
- **Two pricing/data corrections from the client: applied 2026-10-04 (prices finalized by the client).** `lib/config.ts`, the regenerated `google-apps-script/generated-allowlist.gs` (local file only), and the regenerated `supabase/seed.sql` are consistent — `generate-seed-sql.ts` reports exact parity and exits non-zero on any price/id drift:
  - Monthly Veg 1-Meal = ₹4,560, 2-Meal = ₹9,120 (previously transposed in the original data).
  - Party desserts intentionally share pricing with individual desserts — modeled as ONE row in `menu_items` (category `dessert`), NOT duplicated into `bulk_items`. `bulk_items.category` only allows `veg`/`non_veg`.
- **`supabase/migrations/0001_init.sql` and `supabase/seed.sql`: revised and re-tested 2026-10-04.** The migration now GRANTs table privileges explicitly — `tropicalbytes-production`'s default privileges give `anon`/`authenticated` NO select/insert/update/delete on new tables (only truncate/references/trigger/maintain), so the original migration would have left the site unable to read data and admins unable to edit prices. UPDATE grants are per-column and exclude `id`, enforcing stable keys in the database. Also: `touch_updated_at` pins `search_path`, policies use `(select public.is_admin())`, `menus.uploaded_by` defaults to `auth.uid()` (indexed), whole file runs in one transaction. Tested end-to-end (59 checks, all passing) on disposable PGlite with stubbed `auth`/`storage` and prod's exact default privileges; storage-policy creation by `postgres` confirmed allowed via prod's `supautils.policy_grants`. Verification query: `supabase/verify/checkpoint_a_verify.sql`.
- **Supabase project `tropicalbytes-production` (ref `bftbqypdbbcqmxsaisxx`, ap-northeast-2, Postgres 17) exists, on the Free plan.**
- **Checkpoint A: DONE (2026-10-04).** User ran `0001_init.sql` in the Dashboard SQL Editor; `supabase/verify/checkpoint_a_verify.sql` returned ok = true for all 15 checks, independently re-confirmed by Claude via read-only query. 9 tables, 0 rows. (Migrations were run in the SQL Editor, so Supabase's `list_migrations` is empty — that's expected.)
- **Checkpoint A.1 (`0002_lock_trigger_functions.sql`): DONE (2026-10-04)**, confirmed read-only — trigger functions no longer callable via the API.
- **Checkpoint B (seed): DONE (2026-10-04).** User ran `seed.sql` + `checkpoint_b_verify.sql`; independently re-confirmed read-only: 4/16/42/39/2 rows, monthly-veg 4560/9120, 103 audited inserts, no admins/menus/offers.
- **Checkpoint A.2 (`0003_definer_functions_out_of_api.sql`): DONE (2026-10-04)**, verified by the user and re-confirmed read-only. `is_admin()` now lives in the non-exposed `private` schema; `publish_menu()` is SECURITY INVOKER. **Supabase Security Advisor: 0 findings.** App code must detect admin status by selecting its own row from `public.admins` — `rpc('is_admin')` no longer exists.
- **RLS re-verified on the real project as `anon` (2026-10-04, read-only):** sees 4/16/42/39/2 catalog rows, 0 menus/offers, cannot read admins/audit_log, update prices, or publish.
- **Checkpoint C (admin user): DONE (2026-10-04).** Auth user `tropicalbytes.in@gmail.com` (email confirmed) is the only auth user and the only row in `public.admins`; `checkpoint_c_verify.sql` all ok (user) and re-confirmed read-only by Claude impersonating the owner's JWT: `private.is_admin()` = true, can read audit log, can edit prices. Security Advisor: only `auth_leaked_password_protection` (a Pro-plan feature — accepted on Free). Performance Advisor: only `unused_index` INFO (expected before app traffic).
- **Repo tooling added 2026-10-04:** ESLint (`next/core-web-vitals`, clean), `npm run typecheck`, `npm run test:db` (PGlite replay of every migration/seed/grant + ~100 RLS checks, all passing), `npm run generate:seed` (fails on drift), `npm run check` (all of the above). `npm run build` passes. Runbook: `supabase/README.md`.
- **Known, not yet addressed:** `npm audit` reports advisories against Next 14.2.35 whose only fix is a major upgrade (Next 16) — separate decision for the client; none is triggered by the current config (no AVIF image optimization, not Windows-hosted).
- **Google Apps Script (`Code.gs`) has NOT been modified.** The regenerated `generated-allowlist.gs` exists in this repo but has not been pasted into the live Apps Script project. Do not touch Apps Script without explicit approval (see rules below).
- **Plan step 5 (data layer): DONE 2026-10-04, NOT wired into any public page.** `lib/supabase/public.ts` (server-side read client, publishable key, no session, 5 s per-request timeout), `lib/catalog/core.ts` (pure: `catalogFromConfig`, `fetchCatalog`, `validateCatalog`, `diffCatalogs`), `lib/catalog/index.ts` (`getCatalog()`: `unstable_cache`, tag `catalog`, 5 min revalidate, overall 5 s deadline, falls back to `lib/config.ts` on any failure). Party desserts come from `menu_items` (ids `dessert-*`; Apps Script still expects `party-dessert-*` — map in `/api/enquiry`). CSP `connect-src` adds the Supabase origin when `NEXT_PUBLIC_SUPABASE_URL` is set. `npm run check:catalog` (read-only, live): Supabase data == `lib/config.ts` field for field; unreachable host / wrong key / timeout all fall back. Verified in the Next runtime: live → `source: supabase`, cached; bad URL → `source: fallback` in 5.0 s. Env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are in `.env.local` only — **must also be added in Vercel** before step 6 ships. No `middleware.ts`, `/api/enquiry` or `/admin` yet.

## Hard process rules (the client set these explicitly — follow them)

1. **Checkpointed, not batched.** Schema migration, seed data, and admin-user creation are three separate approval gates. Never run more than one without the user explicitly confirming the previous one is verified.
2. **No destructive SQL ever** against `tropicalbytes-production` — no `drop`, `truncate`, unscoped `delete`.
3. **Show exact SQL/commands before running them**, and explain what each one changes, before executing anything against the real database.
4. **Migration method is the Supabase Dashboard SQL Editor**, not CLI/`psql`, unless the user says otherwise — each step should be independently visible and verifiable in the dashboard.
5. **Don't modify `google-apps-script/Code.gs` or push the regenerated allowlist** to the live Apps Script without separate, explicit approval — this is tracked independently of the Supabase work.
6. **Don't change public website behavior** until Supabase data has been verified against `lib/config.ts`.
7. **Keep `lib/config.ts` and `public/tropicalbytes-menu.pdf` as fallbacks** until the Supabase-backed versions are verified in production — don't delete them.
8. **Don't build the full admin UI yet.** Sequence is: schema → seed → auth → RLS verification → catalog/data access layer (with fallback) → *then* admin UI.
9. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to any client-side code or `NEXT_PUBLIC_*` variable.
10. **Ids are stable keys, assigned once.** Never derive a database id from an editable name (this was the bug in the original `config.ts` — `slugify(name)` — that we're deliberately moving away from).

## Files expected in this repo from prior work

- `supabase/migrations/0001_init.sql` — full schema, RLS, functions, triggers, storage bucket config.
- `supabase/seed.sql` — generated seed data, idempotent (`on conflict do nothing`), matches live site exactly.
- `scripts/generate-seed-sql.ts` — regenerates `seed.sql` from `lib/config.ts`; also cross-checks against `google-apps-script/generated-allowlist.gs` for drift. Re-run this if `lib/config.ts` changes: `npx tsx scripts/generate-seed-sql.ts`.
- `docs/ADMIN-PHASE1-BLUEPRINT.md` — original audit, architecture, schema rationale, F1–F13 findings.
- `docs/AUDIT-SUPABASE-INTEGRATION.md` — second-pass audit against the real empty Supabase project, checkpointed implementation plan (§8), exact env vars needed (§6), files that will/won't change (§9/§10).

If any of the above are missing from this folder when you check, STOP and tell the user which ones are missing rather than recreating them from scratch or guessing their contents — ask the user to copy them in from the deliverables already provided in the earlier claude.ai conversation.

## Immediate next step

Database (A, A.1, B, A.2, C) and data layer (step 5) are done; work is on branch `admin-phase1-db` (pushed to github.com/tropicalbytes/TropicalBytes-website, not merged). Next, each needing the user's go-ahead: (1) add the two Supabase env vars in Vercel; (2) paste the regenerated allowlist into Apps Script (separate approval) before deploying the price fix; (3) plan step 6 — wire `getCatalog()` into the public pages (server page + client form split for the 3 form pages), shown as a diff before merging.

Do not run any SQL yourself against the live project — this workflow has the user running it manually in their Dashboard, per rule #4 above.