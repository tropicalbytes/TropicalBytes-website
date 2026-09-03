# TropicalBytes — meal subscription website

A premium, mobile-first Next.js website for a meal subscription/enquiry business, with no online
payment — every form submission is a request that a Google Sheet + email notification lets the team
follow up on manually.

## Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Google Apps Script + Google Sheets
(backend) · deployable on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_GAS_WEB_APP_URL
npm run dev
```

Open http://localhost:3000.

## Set up the backend (Google Sheets + email)
See `google-apps-script/README.md` — takes about five minutes, no server required. Until
`NEXT_PUBLIC_GAS_WEB_APP_URL` is set, forms will show the friendly error state instead of submitting.

## Project structure

```
app/
  page.tsx                Home
  about/page.tsx           About
  menu/page.tsx             Full menu — meal plans, salads, add-ons, party/bulk (sticky sub-nav)
  menu/request/page.tsx      Individual meal request form
  plans/page.tsx            Plan durations + combo pricing
  plans/subscribe/page.tsx   Subscription request wizard (5 steps)
  party-request/page.tsx    Standalone bulk/party order request form
  how-it-works/page.tsx     How It Works
  faq/page.tsx               FAQ
  contact/page.tsx          Contact + enquiry form
  robots.ts / sitemap.ts    Basic SEO
components/                Shared UI (Navbar, Footer, cards, MultiSelectCombobox, form pieces)
lib/config.ts               ALL menu data + business info — start here (menu is sourced from CATERING.pdf)
lib/constants.ts            Shared request-type strings + option lists (kept in sync with the GAS backend)
lib/validation.ts           Form validation helpers
lib/submitForm.ts            Submits form payloads to the Apps Script Web App
scripts/generate-gas-allowlist.ts  Regenerates the backend's allowlist from lib/config.ts
google-apps-script/          Code.gs backend (4 sheet tabs) + its own setup README
```

## Editing content
Business info, service areas, and the full menu (weekly meal plans, salads, add-ons, party/bulk pricing)
all live in **`lib/config.ts`**, transcribed from the client's CATERING.pdf. Update prices or dishes there
and they propagate to the Menu page, both request forms, and the price-estimate shown in the subscription
wizard automatically. A few pasta items in the source menu had no listed price — those are marked with a
comment in the file rather than a made-up number; fill them in once confirmed.

## Images
The homepage hero, the About page banner, and the four "signature dish" cards on the homepage use
placeholder photos from picsum.photos — the hero/About URLs live in `lib/config.ts`
(`placeholderImages.homeHero` / `placeholderImages.aboutBanner`), and the signature dishes are defined
inline in `app/page.tsx` (`signatureDishes`, each with a `seed` used to build its picsum URL). The full
Menu page is intentionally photo-free — it's information-dense by design rather than a photo grid.
`next.config.mjs` only allows images from `picsum.photos`; swap any of these to a local file under
`public/images/` once real photography is available, and you can remove the `picsum.photos` entry from
`next.config.mjs` once nothing references it.

## Security
The frontend is not treated as a trusted boundary — every form submission is independently re-validated by
the Apps Script backend against allowlists, and business-sensitive values (Enquiry ID, timestamp, status,
price) are generated server-side rather than trusted from the browser. See
`google-apps-script/README.md`'s **Security model** section for the full picture, including the known
rate-limiting limitation of the Apps Script architecture. `next.config.mjs` also sets standard security
headers (CSP, clickjacking protection, etc.) — see the comments there for what's intentionally deferred to
a later phase and why.

## Deploying to Vercel
1. Push this project to a GitHub repo.
2. Import it in Vercel.
3. Add the `NEXT_PUBLIC_GAS_WEB_APP_URL` environment variable in the Vercel project settings.
4. Deploy.
