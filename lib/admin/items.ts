import type { SupabaseClient } from "@supabase/supabase-js";

// Ordering helpers shared by the menu-item and party/bulk server actions.

type Table = "menu_items" | "bulk_items";

export async function nextSortOrder(supabase: SupabaseClient, table: Table, category: string): Promise<number> {
  const { data } = await supabase.from(table).select("sort_order").eq("category", category).order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 10;
}

/**
 * Category + position columns for a save. New items go to the end of their
 * category; an edited item moved to another category goes to the end of that
 * one. Unchanged category: nothing to write.
 */
export async function placement(supabase: SupabaseClient, table: Table, id: string | undefined, category: string): Promise<{ category?: string; sort_order?: number; moved: boolean }> {
  if (id) {
    const { data } = await supabase.from(table).select("category").eq("id", id).maybeSingle();
    if (!data || data.category === category) return { moved: false };
  }
  return { category, sort_order: await nextSortOrder(supabase, table, category), moved: !!id };
}

export const CATEGORY_LABELS: Record<string, string> = { veg: "Veg", non_veg: "Non-Veg", dessert: "Desserts" };

/** Swaps an item with its neighbour in the same category. Returns an error message or null. */
export async function moveItem(supabase: SupabaseClient, table: Table, id: string, direction: "up" | "down"): Promise<string | null> {
  const { data: item } = await supabase.from(table).select("category").eq("id", id).maybeSingle();
  if (!item) return "That item no longer exists. Reload the page.";
  const { data: rows, error } = await supabase.from(table).select("id, sort_order").eq("category", item.category).order("sort_order").order("id");
  if (error || !rows) return "Couldn't reorder. Please try again.";
  const i = rows.findIndex((r) => r.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return null;

  // Re-space positions if two rows share a sort_order, so the swap is meaningful.
  const orders = rows.map((r) => r.sort_order);
  const spaced = new Set(orders).size === orders.length ? orders : rows.map((_, k) => (k + 1) * 10);
  const updates = rows.map((r, k) => ({ id: r.id, sort_order: spaced[k] }));
  [updates[i].sort_order, updates[j].sort_order] = [updates[j].sort_order, updates[i].sort_order];
  for (const u of updates) {
    const original = rows.find((r) => r.id === u.id)!;
    if (original.sort_order === u.sort_order) continue;
    const { error: e } = await supabase.from(table).update({ sort_order: u.sort_order }).eq("id", u.id);
    if (e) return "Couldn't reorder. Please try again.";
  }
  return null;
}
