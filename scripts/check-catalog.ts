/**
 * Read-only check of the catalog data layer against the LIVE Supabase project.
 *
 *   npm run check:catalog        (reads NEXT_PUBLIC_SUPABASE_* from .env.local)
 *
 * 1. Fetches the catalog with the publishable key (anon, RLS) and requires it to
 *    match lib/config.ts field for field — the gate before public pages switch over.
 * 2. Proves the fallback triggers: an unreachable host, a wrong key, and a timeout
 *    must all throw (getCatalog() then serves lib/config.ts), and the config
 *    catalog itself must validate.
 * Never writes anything.
 */
import { createPublicClient, supabasePublicConfig } from "../lib/supabase/public";
import { catalogFromConfig, diffCatalogs, fetchCatalog, validateCatalog } from "../lib/catalog/core";

let failed = 0;
const report = (ok: boolean, label: string) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};
const throws = async (p: Promise<unknown>) => p.then(() => false, () => true);

async function main() {
  const config = supabasePublicConfig();
  if (!config) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set (.env.local).");
    process.exit(1);
  }

  const fallback = catalogFromConfig();
  report(validateCatalog(fallback).length === 0, "fallback (lib/config.ts) catalog is valid");

  const started = Date.now();
  const live = await fetchCatalog(createPublicClient(config));
  report(live.source === "supabase", `live catalog fetched from Supabase in ${Date.now() - started} ms`);
  console.log(
    `      tiers=${live.tiers.length} options=${live.planOptions.length} veg=${live.menu.veg.length} ` +
      `nonVeg=${live.menu.nonVeg.length} desserts=${live.menu.desserts.length} ` +
      `partyVeg=${live.party.veg.length} partyNonVeg=${live.party.nonVeg.length}`
  );
  const diffs = diffCatalogs(live, fallback);
  report(diffs.length === 0, diffs.length ? `live data differs from lib/config.ts:\n      - ${diffs.join("\n      - ")}` : "live data matches lib/config.ts exactly");
  const mv = live.planOptions.filter((o) => o.id.startsWith("monthly-veg-")).map((o) => `${o.id}=${o.totalPrice}/${o.perMealPrice}`).join(" ");
  report(mv === "monthly-veg-1=4560/190 monthly-veg-2=9120/190", `monthly veg ${mv}`);

  report(await throws(fetchCatalog(createPublicClient({ url: "https://invalid.invalid", key: config.key }))), "unreachable host → throws (falls back)");
  report(await throws(fetchCatalog(createPublicClient({ url: config.url, key: "sb_publishable_wrong" }))), "wrong key → throws (falls back)");
  report(await throws(fetchCatalog(createPublicClient(config, 1))), "timeout → throws (falls back)");

  console.log(failed ? `\n${failed} check(s) failed` : "\nall catalog checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error("FAIL  live catalog fetch:", error instanceof Error ? error.message : error);
  process.exit(1);
});
