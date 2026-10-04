# TropicalBytes - meal subscription website

A premium, mobile-first Next.js website for a meal subscription/enquiry business, with no online
payment - every form submission is a request that a Google Sheet + email notification lets the team
follow up on manually.

## Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind. Forms post to a Google Apps Script Web App
(`google-apps-script/`). Catalog data (plans, menu, party/bulk items, prices) currently comes from
`lib/config.ts`.

## Getting started
```bash
npm install
cp .env.example .env.local   # then set NEXT_PUBLIC_GAS_WEB_APP_URL
npm run dev
```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build |
| `npm run lint` / `typecheck` | ESLint (`next/core-web-vitals`) / `tsc --noEmit` |
| `npm run generate:gas` | Regenerate `google-apps-script/generated-allowlist.gs` from `lib/config.ts` (then paste it into the Apps Script project) |
| `npm run generate:seed` | Regenerate `supabase/seed.sql` from `lib/config.ts`; fails on any price/id drift vs. the allowlist |
| `npm run test:db` | Replay all Supabase migrations + seed on an in-memory Postgres and run the RLS/privilege test suite |
| `npm run check:catalog` | Read-only: fetch the live Supabase catalog and require it to match `lib/config.ts`; prove the fallback triggers |
| `npm run check` | All of the above checks in one go |

**Changing a price today:** edit `lib/config.ts`, run `npm run generate:gas` and `npm run generate:seed`,
paste the new allowlist into Apps Script, deploy.

## Admin panel (Phase 1, in progress)
A Supabase-backed admin panel will let the owner manage menu, prices, plans and offers without a
deploy. The database is live and verified, and `lib/catalog` (Supabase reads with a `lib/config.ts`
fallback) is built and tested but not yet used by the public pages; the admin screens are not built yet. See `supabase/README.md`
(runbook + checkpoint status), `docs/ADMIN-PHASE1-BLUEPRINT.md` and
`docs/AUDIT-SUPABASE-INTEGRATION.md`. Until the admin panel ships, `lib/config.ts` remains the source
the site renders from.
