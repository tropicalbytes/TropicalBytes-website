/**
 * Generates google-apps-script/generated-allowlist.gs directly from this
 * project's lib/config.ts — the single source of truth for menu data.
 *
 * Run this after any change to subscription plan pricing, the individual
 * meal menu, desserts, or party/bulk items, then copy the output file into
 * the Apps Script project as a second .gs file (Apps Script merges all
 * files in a project into one global scope, so no manual merging is
 * needed).
 *
 *   npm run generate:gas
 */
import {
  subscriptionTiers,
  subscriptionPlanOptions,
  buildMealOptionGroups,
  buildAddOnOptionGroups,
  partyBulkOrders,
  slugify,
} from "../lib/config";
import { MEAL_PREFERENCE_OPTIONS, FOOD_PREFERENCE_OPTIONS } from "../lib/constants";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildMealIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const foodTypes = ["Veg", "Non-Veg"] as const;
  for (const foodType of foodTypes) {
    for (const group of buildMealOptionGroups(foodType)) {
      for (const opt of group.options) {
        map[opt.id] = opt.label;
      }
    }
  }
  return map;
}

function buildAddOnIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of buildAddOnOptionGroups()) {
    for (const opt of group.options) {
      map[opt.id] = opt.label;
    }
  }
  return map;
}

function buildPartyIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  partyBulkOrders.veg.forEach((item) => {
    map[slugify(`party-veg-${item.name}`)] = item.name;
  });
  partyBulkOrders.nonVeg.forEach((item) => {
    map[slugify(`party-nonveg-${item.name}`)] = item.name;
  });
  partyBulkOrders.desserts.forEach((item) => {
    map[slugify(`party-dessert-${item.name}`)] = item.name;
  });
  return map;
}

// Authoritative, server-validated subscription plan table — replaces the
// previous duration x combo formula. Each row carries its own fixed,
// client-approved total price; the backend looks up by planOptionId
// instead of computing a price.
const planMap: Record<
  string,
  { tierId: string; foodType: string; mealCount: number; totalPrice: number; deliveryLabel: string; label: string }
> = {};
subscriptionPlanOptions.forEach((p) => {
  const tierName = subscriptionTiers.find((t) => t.id === p.tierId)?.name || p.tierId;
  planMap[p.id] = {
    tierId: p.tierId,
    foodType: p.foodType,
    mealCount: p.mealCount,
    totalPrice: p.totalPrice,
    deliveryLabel: p.deliveryLabel,
    label: `${tierName} - ${p.mealCount} Meal (${p.foodType})`,
  };
});

const output = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Produced by scripts/generate-gas-allowlist.ts from lib/config.ts.
 * Re-run "npm run generate:gas" after changing menu/pricing data, then
 * re-paste this file's contents into the Apps Script project.
 *
 * This is the backend's authoritative allowlist: Code.gs validates every
 * submitted subscription plan option id, and every selected
 * meal/add-on/party-item id, against these maps rather than trusting
 * anything the browser sends. SUBSCRIPTION_PLANS.totalPrice is the
 * server-side source of truth for subscription pricing — the frontend's
 * clientEstimatedTotal is advisory only.
 */

var GENERATED_ALLOWLIST = {
  MEAL_PREFERENCES: ${JSON.stringify(MEAL_PREFERENCE_OPTIONS)},
  FOOD_PREFERENCES: ${JSON.stringify(FOOD_PREFERENCE_OPTIONS)},
  SUBSCRIPTION_PLANS: ${JSON.stringify(planMap, null, 2)},
  MEAL_IDS: ${JSON.stringify(buildMealIdMap(), null, 2)},
  ADDON_IDS: ${JSON.stringify(buildAddOnIdMap(), null, 2)},
  PARTY_ITEM_IDS: ${JSON.stringify(buildPartyIdMap(), null, 2)}
};
`;

const outPath = path.join(__dirname, "../google-apps-script/generated-allowlist.gs");
writeFileSync(outPath, output, "utf-8");
console.log(`Wrote ${outPath}`);
