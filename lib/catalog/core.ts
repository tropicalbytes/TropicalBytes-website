import type { SupabaseClient } from "@supabase/supabase-js";
import {
  subscriptionTiers,
  subscriptionPlanOptions,
  individualMenu,
  partyBulkOrders,
  slugify,
  type FoodType,
} from "../config";

// ============================================================================
// CATALOG: the menu/pricing data the public site renders, from either
// Supabase (source of truth once the admin panel ships) or lib/config.ts
// (fallback). Both produce the same shape and the same stable ids, so pages
// never need to know which one they got.
//
// Pure functions only (no Next.js APIs) so scripts/check-catalog.ts can run
// them outside Next. The cached getter lives in ./index.ts.
// ============================================================================

export type CatalogSource = "supabase" | "fallback";

export interface CatalogTier {
  id: string;
  name: string;
  durationDays: number;
  /** e.g. "6 Days" (same text lib/config.ts uses). */
  durationLabel: string;
  tagline: string;
  isPopular: boolean;
}

export interface CatalogPlanOption {
  id: string;
  tierId: string;
  foodType: FoodType;
  mealCount: 1 | 2;
  totalPrice: number;
  /** Derived: totalPrice / (days × meals), rounded to the rupee. Never stored. */
  perMealPrice: number;
  /** Derived: "2 time delivery. 6 days". Never stored. */
  deliveryLabel: string;
}

export interface CatalogMenuItem {
  id: string;
  name: string;
  price: number;
  vegetarian: boolean;
  description: string | null;
}

export interface CatalogPartyItem {
  id: string;
  name: string;
  price: number | "Seasonal";
  unit: "kg" | "piece";
  description: string | null;
}

export interface Catalog {
  source: CatalogSource;
  tiers: CatalogTier[];
  planOptions: CatalogPlanOption[];
  menu: { veg: CatalogMenuItem[]; nonVeg: CatalogMenuItem[]; desserts: CatalogMenuItem[] };
  party: {
    minimumOrderLabel: string;
    advanceNoticeLabel: string;
    veg: CatalogPartyItem[];
    nonVeg: CatalogPartyItem[];
    /** The same rows as menu.desserts, priced per piece (client decision: one shared price). */
    desserts: CatalogPartyItem[];
  };
}

const durationLabel = (days: number) => `${days} Days`;
const deliveryLabel = (meals: number, days: number) => `${meals} time delivery. ${days} days`;
const perMeal = (total: number, days: number, meals: number) => Math.round(total / (days * meals));
const dessertAsParty = (d: CatalogMenuItem): CatalogPartyItem => ({
  id: d.id, name: d.name, price: d.price, unit: "piece", description: d.description,
});

// ---------------------------------------------------------------- fallback
/** lib/config.ts in catalog shape. Ids match supabase/seed.sql exactly. */
export function catalogFromConfig(): Catalog {
  const days: Record<string, number> = {};
  const tiers = subscriptionTiers.map((t) => {
    days[t.id] = parseInt(t.durationLabel, 10);
    return {
      id: t.id, name: t.name, durationDays: days[t.id], durationLabel: t.durationLabel,
      tagline: t.tagline, isPopular: t.id === "weekly",
    };
  });
  const menuItems = (prefix: string, items: typeof individualMenu.veg) =>
    items.map((m) => ({ id: slugify(`${prefix}-${m.name}`), name: m.name, price: m.price, vegetarian: m.vegetarian, description: null }));
  const partyItems = (prefix: string, items: typeof partyBulkOrders.veg) =>
    items.map((p) => ({ id: slugify(`${prefix}-${p.name}`), name: p.name, price: p.price, unit: p.unit, description: null }));
  const desserts = menuItems("dessert", individualMenu.desserts);

  return {
    source: "fallback",
    tiers,
    planOptions: subscriptionPlanOptions.map((p) => ({
      id: p.id, tierId: p.tierId, foodType: p.foodType, mealCount: p.mealCount, totalPrice: p.totalPrice,
      perMealPrice: perMeal(p.totalPrice, days[p.tierId], p.mealCount),
      deliveryLabel: deliveryLabel(p.mealCount, days[p.tierId]),
    })),
    menu: { veg: menuItems("Veg", individualMenu.veg), nonVeg: menuItems("Non-Veg", individualMenu.nonVeg), desserts },
    party: {
      minimumOrderLabel: partyBulkOrders.minimumOrderLabel,
      advanceNoticeLabel: partyBulkOrders.advanceNoticeLabel,
      veg: partyItems("party-veg", partyBulkOrders.veg),
      nonVeg: partyItems("party-nonveg", partyBulkOrders.nonVeg),
      desserts: desserts.map(dessertAsParty),
    },
  };
}

// ---------------------------------------------------------------- supabase
type Row = Record<string, unknown>;

async function select(client: SupabaseClient, table: string, columns: string): Promise<Row[]> {
  const { data, error } = await client.from(table).select(columns).order("sort_order").order("id");
  if (error) throw new Error(`catalog: ${table}: ${error.message}`);
  return (data ?? []) as unknown as Row[];
}

/**
 * Reads the active catalog through RLS (anon/publishable key) and validates it.
 * Throws if Supabase is unreachable or the data is incomplete: the caller
 * falls back to catalogFromConfig() rather than render a half-empty site.
 */
export async function fetchCatalog(client: SupabaseClient): Promise<Catalog> {
  const [tierRows, optionRows, menuRows, bulkRows, settingsRes] = await Promise.all([
    select(client, "plan_tiers", "id, name, duration_days, tagline, is_popular"),
    select(client, "plan_options", "id, tier_id, food_type, meal_count, total_price"),
    select(client, "menu_items", "id, category, name, description, price, is_vegetarian"),
    select(client, "bulk_items", "id, category, name, description, unit, price, is_seasonal"),
    client.from("site_settings").select("key, value"),
  ]);
  if (settingsRes.error) throw new Error(`catalog: site_settings: ${settingsRes.error.message}`);
  const settings = new Map((settingsRes.data ?? []).map((s) => [s.key as string, s.value as string]));

  const tiers: CatalogTier[] = tierRows.map((t) => ({
    id: String(t.id), name: String(t.name), durationDays: Number(t.duration_days),
    durationLabel: durationLabel(Number(t.duration_days)), tagline: String(t.tagline ?? ""), isPopular: t.is_popular === true,
  }));
  const days = new Map(tiers.map((t) => [t.id, t.durationDays]));

  const planOptions: CatalogPlanOption[] = optionRows
    .filter((o) => days.has(String(o.tier_id))) // options of a disabled tier stay hidden
    .map((o) => {
      const d = days.get(String(o.tier_id))!;
      const meals = Number(o.meal_count) as 1 | 2;
      return {
        id: String(o.id), tierId: String(o.tier_id), foodType: o.food_type as FoodType, mealCount: meals,
        totalPrice: Number(o.total_price), perMealPrice: perMeal(Number(o.total_price), d, meals),
        deliveryLabel: deliveryLabel(meals, d),
      };
    });

  const menuOf = (category: string): CatalogMenuItem[] =>
    menuRows.filter((m) => m.category === category).map((m) => ({
      id: String(m.id), name: String(m.name), price: Number(m.price), vegetarian: m.is_vegetarian === true,
      description: (m.description as string | null) ?? null,
    }));
  const partyOf = (category: string): CatalogPartyItem[] =>
    bulkRows.filter((b) => b.category === category).map((b) => ({
      id: String(b.id), name: String(b.name), price: b.is_seasonal ? "Seasonal" : Number(b.price),
      unit: b.unit === "piece" ? "piece" : "kg", description: (b.description as string | null) ?? null,
    }));

  const desserts = menuOf("dessert");
  const fallbackLabels = partyBulkOrders;
  const catalog: Catalog = {
    source: "supabase",
    tiers,
    planOptions,
    menu: { veg: menuOf("veg"), nonVeg: menuOf("non_veg"), desserts },
    party: {
      minimumOrderLabel: settings.get("party_minimum_order_label") ?? fallbackLabels.minimumOrderLabel,
      advanceNoticeLabel: settings.get("party_advance_notice_label") ?? fallbackLabels.advanceNoticeLabel,
      veg: partyOf("veg"),
      nonVeg: partyOf("non_veg"),
      desserts: desserts.map(dessertAsParty),
    },
  };

  const problems = validateCatalog(catalog);
  if (problems.length) throw new Error(`catalog: incomplete data from Supabase: ${problems.join("; ")}`);
  return catalog;
}

/** Sanity checks that keep a broken/empty response from replacing working prices. */
export function validateCatalog(c: Catalog): string[] {
  const p: string[] = [];
  if (!c.tiers.length) p.push("no plan tiers");
  if (!c.planOptions.length) p.push("no plan options");
  if (!c.menu.veg.length && !c.menu.nonVeg.length) p.push("no menu items");
  if (!c.party.veg.length && !c.party.nonVeg.length) p.push("no party items");
  const prices = [
    ...c.planOptions.map((o) => o.totalPrice), ...c.menu.veg.map((m) => m.price), ...c.menu.nonVeg.map((m) => m.price),
    ...c.menu.desserts.map((m) => m.price),
    ...[...c.party.veg, ...c.party.nonVeg].flatMap((b) => (b.price === "Seasonal" ? [] : [b.price])),
  ];
  if (prices.some((n) => !Number.isInteger(n) || n <= 0)) p.push("non-positive or non-integer price");
  if (c.tiers.some((t) => !Number.isInteger(t.durationDays) || t.durationDays <= 0)) p.push("bad tier duration");
  return p;
}

/** Field-by-field differences, ignoring `source`. Empty array = identical. */
export function diffCatalogs(a: Catalog, b: Catalog): string[] {
  const out: string[] = [];
  const walk = (x: unknown, y: unknown, path: string) => {
    if (path === "source") return;
    if (Array.isArray(x) && Array.isArray(y)) {
      if (x.length !== y.length) out.push(`${path}: ${x.length} vs ${y.length} items`);
      for (let i = 0; i < Math.min(x.length, y.length); i++) {
        const xi = x[i] as { id?: string }; const yi = y[i] as { id?: string };
        walk(xi, yi, `${path}[${xi?.id ?? i}]`);
      }
    } else if (x && y && typeof x === "object" && typeof y === "object") {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)]))
        walk((x as Row)[k], (y as Row)[k], path ? `${path}.${k}` : k);
    } else if (x !== y) {
      out.push(`${path}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
    }
  };
  walk(a, b, "");
  return out;
}
