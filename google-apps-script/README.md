# Google Apps Script backend: setup guide

This connects the website's forms to Google Sheets + email notifications, with no backend server required.
The backend is hardened to treat the frontend as untrusted (see **Security model** below).

## 1. Create the Google Sheet
Create a new Google Sheet (any name, e.g. "TropicalBytes Enquiries"). You do **not** need to pre-create tabs:
`Code.gs` creates `Subscription Requests`, `Individual Meal Requests`, `Party Bulk Orders`, and
`Contact Enquiries` tabs automatically (with headers) the first time each type of form is submitted.

## 2. Add the scripts
In the Sheet: **Extensions → Apps Script**. Delete the default `Code.gs` contents and paste in this
folder's `Code.gs`. Update the `BUSINESS_EMAIL` constant near the top to the real inbox that should
receive enquiry notifications.

Then add a **second file** in the same Apps Script project: click the **+** next to Files, choose
**Script**, name it `generated-allowlist`, and paste in this folder's `generated-allowlist.gs`. Apps
Script merges every file in a project into one shared scope, so `Code.gs` can reference
`GENERATED_ALLOWLIST` from the second file automatically (no imports needed).

**Keeping the allowlist in sync:** whenever you change menu items, prices, subscription plans, or add-ons in
`lib/config.ts`, run `npm run generate:gas` locally, then copy the regenerated
`google-apps-script/generated-allowlist.gs` content into that same file inside the Apps Script project.
This is the single source of truth for the menu: the backend never hand-maintains a second copy.

## 3. Deploy as a Web App
**Deploy → New deployment**
- Type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone**

Click Deploy, authorize the requested permissions (this script only needs access to this Sheet and
Gmail/MailApp), then copy the generated **Web app URL** (ends in `/exec`).

## 4. Connect it to the website
Set the copied URL as an environment variable for the Next.js app:

```
NEXT_PUBLIC_GAS_WEB_APP_URL=https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
```

Add this in a local `.env.local` file for development, and in your Vercel project's
**Settings → Environment Variables** for production. Redeploy after adding it.

This URL is meant to be public (the browser has to call it directly), so the `NEXT_PUBLIC_` prefix is
correct here. It is not a secret; treat it the way you'd treat any publicly reachable API endpoint (the
backend hardening in `Code.gs` is what actually protects it, not the URL being hard to guess).

## 5. Re-deploying after script edits
Apps Script Web App URLs stay the same across **Manage deployments → Edit → New version**, so you can
update `Code.gs` or `generated-allowlist.gs` later without changing the URL on the website side. You do
need to create a **new version** in that dialog for edits to take effect on the live URL.

## 6. Signed enquiries from the website (admin panel)
The website no longer posts to this script from the browser. Every form goes to the site's own
`/api/enquiry` route, which looks the chosen items up in the live catalog the owner edits at `/admin`,
works out labels and totals on the server (including party/bulk totals), and forwards the enquiry here
with a shared secret. For those **signed** requests `Code.gs` trusts the server's item labels and totals
(it can't know about dishes added in the admin) but still validates every customer field.

Setup (one-time):
1. Paste the current `Code.gs` and `generated-allowlist.gs` into the Apps Script project, then
   **Deploy → Manage deployments → Edit → Version: New version → Deploy** (the URL doesn't change).
2. **Project Settings → Script Properties → Add property**: `ENQUIRY_SHARED_SECRET` = the same 64-character
   value as `GAS_SHARED_SECRET` in the website's environment (Vercel → Settings → Environment Variables,
   type *Secret*). Never put it in a `NEXT_PUBLIC_` variable.
3. Deploy the website. Submit one test enquiry per form and check the Sheet row and email.
4. Once that works, add Script Property `REQUIRE_SIGNED` = `true`. From then on, requests that don't come
   through the website (e.g. someone calling this URL directly) are rejected.

Steps 1–2 and 3 can happen in either order: unsigned requests keep working until step 4, and the website
also sends the original item ids, so the old script accepts enquiries for existing items.
`npm run check:enquiry` runs this script locally against the website's output to prove both paths.

## Security model
`Code.gs` assumes the frontend is not trusted: anyone can `curl` the Web App URL directly. It:
- Re-validates every field against allowlists (never trusts a "meal preference is a string" style check)
- Generates the Enquiry ID, submission timestamp, and subscription price itself; client-sent
  versions of these are ignored or kept only as a clearly-labeled non-authoritative reference
- Escapes any value that looks like a spreadsheet formula before writing it to a cell
- Applies a coarse, global per-minute request cap and suppresses obvious duplicate double-submits
- Never returns raw error text to the caller: internal errors are logged in **Executions** only

**Known limitation:** Apps Script Web Apps do not expose the caller's IP address, so the rate limit above
is global (protects the endpoint from a traffic burst) rather than per-visitor (can't specifically throttle
one abusive client). For a small commercial site this is a reasonable trade-off without adding paid
infrastructure; if abuse becomes a real problem, the next practical step is fronting the endpoint with
Cloudflare Turnstile or a similar CAPTCHA on the frontend before submission.
