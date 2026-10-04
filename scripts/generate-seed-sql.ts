/**
 * Generates supabase/seed.sql from lib/config.ts (the CURRENT source of truth)
 * so the database starts out identical to what the live site shows today.
 *
 *   npx tsx scripts/generate-seed-sql.ts
 *
 * - Stable keys: every row keeps the exact id the site + Apps Script already
 *   use (e.g. "weekly-veg-1", "veg-alfredo-penne-pasta-veg"). Ids never derive
 *   from editable names again once the data lives in the database.
 * - Idempotent: ON CONFLICT DO NOTHING, so re-running never overwrites
 *   edits the owner made in the admin panel.
 * - Parity checks: cross-checks against google-apps-script/generated-allowlist.gs
 *   and fails loudly if the two disagree.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { subscriptionTiers, subscriptionPlanOptions, individualMenu, partyBulkOrders, slugify } from "../lib/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const warnings: string[] = [];

// ---- tiers -----------------------------------------------------------------
const tierDays: Record<string, number> = {};
const tierRows = subscriptionTiers.map((t, i) => {
  const days = parseInt(t.durationLabel, 10);
  if (!Number.isFinite(days)) throw new Error(`Cannot parse days from "${t.durationLabel}"`);
  tierDays[t.id] = days;
  return `(${q(t.id)}, ${q(t.name)}, ${days}, ${q(t.tagline)}, ${t.id === "weekly"}, true, ${(i + 1) * 10})`;
});

// ---- plan options ------------------------------------------------------------
const optionRows = subscriptionPlanOptions.map((p, i) => {
  const derivedLabel = `${p.mealCount} time delivery. ${tierDays[p.tierId]} days`;
  if (derivedLabel !== p.deliveryLabel) throw new Error(`Delivery label not derivable for ${p.id}: "${p.deliveryLabel}"`);
  const expected = tierDays[p.tierId] * p.mealCount * p.perMealPrice;
  if (expected !== p.totalPrice) {
    warnings.push(`PRICE ANOMALY ${p.id}: total ₹${p.totalPrice} but ${tierDays[p.tierId]} days × ${p.mealCount} meal(s) × ₹${p.perMealPrice} = ₹${expected}`);
  }
  return `(${q(p.id)}, ${q(p.tierId)}, ${q(p.foodType)}, ${p.mealCount}, ${p.totalPrice}, true, ${(i + 1) * 10})`;
});

// ---- individual menu -------------------------------------------------------
type Cat = "veg" | "non_veg" | "dessert";
const menuIds: string[] = [];
const menuRows: string[] = [];
const addMenu = (cat: Cat, prefix: string, items: typeof individualMenu.veg) =>
  items.forEach((m, i) => {
    const id = slugify(`${prefix}-${m.name}`);
    menuIds.push(id);
    menuRows.push(`(${q(id)}, ${q(cat)}, ${q(m.name)}, ${m.price}, ${m.vegetarian}, true, ${(i + 1) * 10})`);
  });
addMenu("veg", "Veg", individualMenu.veg);
addMenu("non_veg", "Non-Veg", individualMenu.nonVeg);
addMenu("dessert", "dessert", individualMenu.desserts);

// ---- party / bulk ----------------------------------------------------------
const bulkIds: string[] = [];
const bulkRows: string[] = [];
const addBulk = (cat: Cat, prefix: string, items: { name: string; price: number | "Seasonal"; unit: "kg" | "piece" }[]) =>
  items.forEach((m, i) => {
    const id = slugify(`${prefix}-${m.name}`);
    bulkIds.push(id);
    const seasonal = m.price === "Seasonal";
    bulkRows.push(`(${q(id)}, ${q(cat)}, ${q(m.name)}, ${q(m.unit)}, ${seasonal ? "null" : m.price}, ${seasonal}, true, ${(i + 1) * 10})`);
  });
addBulk("veg", "party-veg", partyBulkOrders.veg);
addBulk("non_veg", "party-nonveg", partyBulkOrders.nonVeg);
// Party desserts intentionally NOT seeded into bulk_items (confirmed 2026-09-29):
// they share menu_items rows where category='dessert', so there is one priced
// row per dessert, not two that could drift apart. Party UI queries menu_items
// directly for the "Desserts" group instead of bulk_items.

// ---- settings --------------------------------------------------------------
const settingRows = [
  `('party_minimum_order_label', ${q(partyBulkOrders.minimumOrderLabel)})`,
  `('party_advance_notice_label', ${q(partyBulkOrders.advanceNoticeLabel)})`,
];

// ---- parity check vs the live Apps Script allowlist -------------------------
const gasSrc = readFileSync(path.join(__dirname, "../google-apps-script/generated-allowlist.gs"), "utf-8");
const GAS = new Function(`${gasSrc}; return GENERATED_ALLOWLIST;`)() as {
  SUBSCRIPTION_PLANS: Record<string, { totalPrice: number }>;
  INDIVIDUAL_ITEM_PRICES: Record<string, number>;
  PARTY_ITEM_IDS: Record<string, string>;
};
const diff = (label: string, a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  const missing = [...A].filter((x) => !B.has(x)), extra = [...B].filter((x) => !A.has(x));
  if (missing.length || extra.length) warnings.push(`ALLOWLIST DRIFT (${label}): only in config=${JSON.stringify(missing)} only in .gs=${JSON.stringify(extra)}`);
};
diff("plan ids", subscriptionPlanOptions.map((p) => p.id), Object.keys(GAS.SUBSCRIPTION_PLANS));
diff("individual item ids", menuIds, Object.keys(GAS.INDIVIDUAL_ITEM_PRICES));
// The DB intentionally keeps party desserts out of bulk_items (see above), but
// Apps Script still needs their party-dessert-* ids to validate party orders.
// Compare them against menu_items' dessert rows instead of reporting them as drift.
const partyDessertIds = individualMenu.desserts.map((d) => slugify(`party-dessert-${d.name}`));
diff("party item ids", [...bulkIds, ...partyDessertIds], Object.keys(GAS.PARTY_ITEM_IDS));
for (const p of subscriptionPlanOptions) {
  const g = GAS.SUBSCRIPTION_PLANS[p.id]?.totalPrice;
  if (g !== undefined && g !== p.totalPrice) warnings.push(`PRICE DRIFT ${p.id}: config ₹${p.totalPrice} vs .gs ₹${g}`);
}
const menuPrices = [...individualMenu.veg, ...individualMenu.nonVeg, ...individualMenu.desserts].map((m) => m.price);
menuIds.forEach((id, i) => {
  const g = GAS.INDIVIDUAL_ITEM_PRICES[id];
  if (g !== undefined && g !== menuPrices[i]) warnings.push(`PRICE DRIFT ${id}: config ₹${menuPrices[i]} vs .gs ₹${g}`);
});
if (new Set([...menuIds]).size !== menuIds.length) throw new Error("Duplicate menu ids");
if (new Set([...bulkIds]).size !== bulkIds.length) throw new Error("Duplicate bulk ids");

const sql = `-- GENERATED by scripts/generate-seed-sql.ts from lib/config.ts — do not edit by hand.
-- Idempotent: never overwrites rows the owner has since edited.
begin;

insert into public.plan_tiers (id, name, duration_days, tagline, is_popular, is_active, sort_order) values
${tierRows.join(",\n")}
on conflict (id) do nothing;

insert into public.plan_options (id, tier_id, food_type, meal_count, total_price, is_active, sort_order) values
${optionRows.join(",\n")}
on conflict (id) do nothing;

insert into public.menu_items (id, category, name, price, is_vegetarian, is_active, sort_order) values
${menuRows.join(",\n")}
on conflict (id) do nothing;

insert into public.bulk_items (id, category, name, unit, price, is_seasonal, is_active, sort_order) values
${bulkRows.join(",\n")}
on conflict (id) do nothing;

insert into public.site_settings (key, value) values
${settingRows.join(",\n")}
on conflict (key) do nothing;

commit;
`;
mkdirSync(path.join(__dirname, "../supabase"), { recursive: true });
writeFileSync(path.join(__dirname, "../supabase/seed.sql"), sql, "utf-8");

console.log(`tiers=${tierRows.length} plan_options=${optionRows.length} menu_items=${menuRows.length} bulk_items=${bulkRows.length} settings=${settingRows.length}`);
console.log(warnings.length ? `\n⚠ ${warnings.length} finding(s):\n- ${warnings.join("\n- ")}` : "\n✓ config and Apps Script allowlist are in exact parity");
if (warnings.length) process.exitCode = 1;
