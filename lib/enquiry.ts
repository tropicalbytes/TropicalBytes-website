import { formatINR } from "./config";
import { REQUEST_TYPES } from "./constants";
import type { Catalog, CatalogMenuItem, CatalogPartyItem } from "./catalog/core";

// ============================================================================
// ENQUIRY PRICING: turns what a form sent (ids + quantities) into the
// authoritative record Apps Script stores and emails: labels and totals come
// from the catalog (Supabase, or lib/config.ts as fallback), never from the
// browser. Pure: no network, no Next APIs (unit-tested by scripts/check-enquiry.ts).
//
// The output keeps the ORIGINAL request fields too (ids mapped to the old
// allowlist names), so an Apps Script that hasn't been updated yet still
// accepts enquiries for existing items. The updated Code.gs prefers `server`.
// ============================================================================

export const MAX_QUANTITY = 20; // per item (mirrors Code.gs)
export const MAX_SELECTED_ITEMS = 40;

/** Fields Apps Script validates itself (contact/delivery details); forwarded as-is when they are strings. */
const PASS_THROUGH = [
  "fullName", "phone", "email", "notes", "honeypot",
  "mealPreference", "foodPreference", "startDate", "address", "area", "city", "pincode",
  "deliveryLocation", "eventDate", "message",
] as const;

export interface ServerComputed {
  selectedPlan?: string;
  duration?: string;
  foodPreference?: string;
  selectedMeals?: string;
  addOns?: string;
  selectedItems?: string;
  estimatedTotal?: string;
}

export type EnquiryResult =
  | { ok: true; payload: Record<string, unknown> & { requestType: string; server: ServerComputed } }
  | { ok: false; message: string; reason: string };

const UNAVAILABLE = "Some of the items you chose are no longer available. Please refresh the page and choose again.";
const INVALID = "Please check the form and try again.";
const fail = (reason: string, message = INVALID): EnquiryResult => ({ ok: false, reason, message });

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const idList = (v: unknown): string[] | null =>
  v === undefined || v === null ? [] : Array.isArray(v) && v.every((x) => typeof x === "string") && v.length <= MAX_SELECTED_ITEMS ? (v as string[]) : null;

/** Quantity for an id: absent → 1; otherwise an integer 1..MAX_QUANTITY, or null if invalid. */
function quantityOf(quantities: Record<string, unknown>, id: string): number | null {
  if (!(id in quantities)) return 1;
  const q = Number(quantities[id]);
  return Number.isInteger(q) && q >= 1 && q <= MAX_QUANTITY ? q : null;
}

/** Legacy allowlist name for a party dessert (menu_items id `dessert-x` → `party-dessert-x`). */
const legacyPartyId = (id: string, desserts: Set<string>) => (desserts.has(id) && id.startsWith("dessert-") ? `party-${id}` : id);

export function buildEnquiry(raw: unknown, catalog: Catalog): EnquiryResult {
  if (!isRecord(raw)) return fail("not_an_object");
  const requestType = raw.requestType;
  if (typeof requestType !== "string" || !Object.values(REQUEST_TYPES).includes(requestType as never)) return fail("unknown_request_type");

  const base: Record<string, unknown> & { requestType: string } = { requestType };
  for (const key of PASS_THROUGH) if (typeof raw[key] === "string") base[key] = raw[key];
  const quantities = isRecord(raw.itemQuantities) ? raw.itemQuantities : {};

  // ---------------------------------------------------------------- subscription
  if (requestType === REQUEST_TYPES.SUBSCRIPTION) {
    const option = catalog.planOptions.find((o) => o.id === raw.planOptionId);
    if (!option) return fail("plan_unavailable", "That plan option is no longer available. Please refresh the page and choose again.");
    if (raw.foodPreference !== option.foodType) return fail("plan_food_mismatch");
    const tier = catalog.tiers.find((t) => t.id === option.tierId)!;
    return {
      ok: true,
      payload: {
        ...base,
        planOptionId: option.id,
        server: {
          selectedPlan: `${tier.name} - ${option.mealCount} Meal (${option.foodType})`,
          duration: option.deliveryLabel,
          estimatedTotal: formatINR(option.totalPrice),
        },
      },
    };
  }

  // ---------------------------------------------------------------- individual meal
  if (requestType === REQUEST_TYPES.INDIVIDUAL_MEAL) {
    const mealIds = idList(raw.selectedMealIds);
    const addOnIds = idList(raw.selectedAddOnIds);
    if (!mealIds || !addOnIds) return fail("bad_item_lists");

    const byId = new Map<string, { item: CatalogMenuItem; kind: "veg" | "non_veg" | "dessert" }>();
    catalog.menu.veg.forEach((item) => byId.set(item.id, { item, kind: "veg" }));
    catalog.menu.nonVeg.forEach((item) => byId.set(item.id, { item, kind: "non_veg" }));
    catalog.menu.desserts.forEach((item) => byId.set(item.id, { item, kind: "dessert" }));

    const seen = new Set<string>();
    const meals: string[] = [];
    const desserts: string[] = [];
    let hasVeg = false, hasNonVeg = false, total = 0;
    for (const id of [...mealIds, ...addOnIds]) {
      if (seen.has(id)) continue;
      seen.add(id);
      const entry = byId.get(id);
      if (!entry) return fail(`unknown_item:${id}`, UNAVAILABLE);
      if (addOnIds.includes(id) && entry.kind !== "dessert") return fail(`not_an_addon:${id}`);
      const qty = quantityOf(quantities, id);
      if (qty === null) return fail(`bad_quantity:${id}`, `You can order up to ${MAX_QUANTITY} of each item.`);
      const label = `${entry.item.name} × ${qty}`;
      total += entry.item.price * qty;
      if (entry.kind === "dessert") desserts.push(label);
      else { meals.push(label); if (entry.kind === "veg") hasVeg = true; else hasNonVeg = true; }
    }
    if (seen.size === 0) return fail("no_items", "Please select at least one meal or dessert.");

    const dessertsOnly = !hasVeg && !hasNonVeg;
    return {
      ok: true,
      payload: {
        ...base,
        selectedMealIds: mealIds,
        selectedAddOnIds: addOnIds,
        itemQuantities: quantities,
        server: {
          foodPreference: hasVeg && hasNonVeg ? "Veg & Non-Veg" : hasVeg ? "Veg" : hasNonVeg ? "Non-Veg" : "Desserts",
          selectedMeals: (dessertsOnly ? desserts : meals).join(", "),
          addOns: dessertsOnly ? "" : desserts.join(", "),
          estimatedTotal: formatINR(total),
        },
      },
    };
  }

  // ---------------------------------------------------------------- party / bulk
  if (requestType === REQUEST_TYPES.PARTY_BULK) {
    const ids = idList(raw.selectedItemIds);
    if (!ids) return fail("bad_item_lists");
    const byId = new Map<string, CatalogPartyItem>();
    [...catalog.party.veg, ...catalog.party.nonVeg, ...catalog.party.desserts].forEach((i) => byId.set(i.id, i));
    const dessertIds = new Set(catalog.party.desserts.map((d) => d.id));

    const seen = new Set<string>();
    const labels: string[] = [];
    let total = 0, seasonal = 0;
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const item = byId.get(id);
      if (!item) return fail(`unknown_item:${id}`, UNAVAILABLE);
      const qty = quantityOf(quantities, id);
      if (qty === null) return fail(`bad_quantity:${id}`, `You can order up to ${MAX_QUANTITY} of each item.`);
      labels.push(`${item.name} × ${qty} ${item.unit === "kg" ? "kg" : qty === 1 ? "piece" : "pieces"}${item.price === "Seasonal" ? " (seasonal price)" : ""}`);
      if (item.price === "Seasonal") seasonal++;
      else total += item.price * qty;
    }
    if (seen.size === 0) return fail("no_items", "Please select at least one item.");

    const legacyQuantities: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(quantities)) legacyQuantities[legacyPartyId(k, dessertIds)] = v;
    return {
      ok: true,
      payload: {
        ...base,
        selectedItemIds: ids.map((id) => legacyPartyId(id, dessertIds)),
        itemQuantities: legacyQuantities,
        estimatedTotal: formatINR(total),
        server: {
          selectedItems: labels.join(", "),
          estimatedTotal: formatINR(total) + (seasonal ? ` + ${seasonal} seasonal item${seasonal > 1 ? "s" : ""} (price on request)` : ""),
        },
      },
    };
  }

  // ---------------------------------------------------------------- contact
  return { ok: true, payload: { ...base, server: {} } };
}
