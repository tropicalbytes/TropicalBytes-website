# Setting these files up in your real TropicalBytes repo

> **Completed 2026-10-04 (kept for history only).** All files are in place, the price corrections are applied, `seed.sql` was generated, and checkpoints A/A.1/B/A.2 are live. Current runbook: `supabase/README.md`.

Extract this zip into the root of your TropicalBytes project (same level as `package.json`), so you get:

```
your-project/
  CLAUDE.md                              ← paste separately, given to you earlier
  supabase/migrations/0001_init.sql
  scripts/generate-seed-sql.ts
  docs/ADMIN-PHASE1-BLUEPRINT.md
  docs/AUDIT-SUPABASE-INTEGRATION.md
```

## One file is deliberately NOT included: `supabase/seed.sql`

That file is *generated* from your real `lib/config.ts`: it contains all 79 of TropicalBytes' actual menu items, prices, and plan combinations. Reconstructing it from memory in this conversation risked silently getting a price wrong, which is exactly the kind of mistake this whole project exists to prevent. So instead, generate it correctly from your real source data:

### 1. Confirm (or apply) two corrections in your local `lib/config.ts`

Check whether your local copy already has these: they were applied in an earlier session but may not have made it back into your real repo yet:

- `monthly-veg-1`: `totalPrice` should be **4560**, `perMealPrice` **190**
- `monthly-veg-2`: `totalPrice` should be **9120**, `perMealPrice` **190**

(Both previously had these transposed: 1-Meal and 2-Meal totals were swapped.)

### 2. Regenerate the Apps Script allowlist (pre-existing script in your repo)

```bash
npx tsx scripts/generate-gas-allowlist.ts
```

This updates `google-apps-script/generated-allowlist.gs` from your corrected `config.ts`. **Do not paste this into the live Apps Script project yet**; that's a separate approval step per `CLAUDE.md`'s process rules.

### 3. Generate the seed file (the script just added)

```bash
npx tsx scripts/generate-seed-sql.ts
```

This reads your real `lib/config.ts`, cross-checks it against the allowlist for drift, and writes `supabase/seed.sql`. It will print a warning if it finds any pricing anomaly (like the one already fixed) or any id mismatch between `config.ts` and the Apps Script allowlist. If you see `✓ config and Apps Script allowlist are in exact parity`, you're good; that's the expected output.

If `tsx` isn't installed: `npm install --save-dev tsx` first.

### 4. Then point Claude Code at the folder

Once all five files above exist (plus the generated `seed.sql`), open the project in Claude Code and ask it to read `CLAUDE.md` first. It will pick up the full project state and process rules from there.
