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
`/admin` (sign in at `/admin/login`) lets the owner manage plan prices, menu items, party/bulk items,
offers, the weekly menu PDF and short site notes, with an Activity log of every change. Only accounts
listed in the database's `admins` table can sign in; every write is re-checked by Supabase RLS.
Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).

**Not live yet:** the public pages still render from `lib/config.ts`, so admin edits are stored but not
shown on the site until the catalog is switched over (plan step 6). See `supabase/README.md`,
`docs/ADMIN-PHASE1-BLUEPRINT.md` and `docs/AUDIT-SUPABASE-INTEGRATION.md`.
