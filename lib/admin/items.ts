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

type Row = { id: string; sort_order: number };

/** Indices of one longest strictly increasing run of values (not necessarily adjacent). */
function longestIncreasing(values: number[]): Set<number> {
  const len = values.map(() => 1);
  const prev = values.map(() => -1);
  let best = -1;
  values.forEach((v, i) => {
    for (let j = 0; j < i; j++) if (values[j] < v && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
    if (best < 0 || len[i] > len[best]) best = i;
  });
  const keep = new Set<number>();
  for (let i = best; i >= 0; i = prev[i]) keep.add(i);
  return keep;
}

/**
 * New positions for `ids` (the wanted order), changing as few rows as
 * possible: items already in increasing order keep their position and the
 * moved ones slot into the gaps (positions are spaced 10 apart), so moving one
 * item usually updates one row, and the Activity log gets one entry. If a gap
 * is too small, the whole list is renumbered 10, 20, 30... Returns only the
 * rows whose position changes.
 */
export function planOrder(current: Row[], ids: string[]): Map<string, number> {
  const old = new Map(current.map((r) => [r.id, r.sort_order]));
  const values = ids.map((id) => old.get(id)!);
  const keep = longestIncreasing(values);
  const next = new Map<string, number>();
  const at = (i: number) => next.get(ids[i]) ?? values[i];

  for (let i = 0; i < ids.length; ) {
    if (keep.has(i)) { i++; continue; }
    let j = i;
    while (j < ids.length && !keep.has(j)) j++;
    const count = j - i;
    const lo = i > 0 ? at(i - 1) : undefined;
    const hi = j < ids.length ? values[j] : undefined;
    let first: number, step: number;
    if (lo === undefined && hi === undefined) { first = 10; step = 10; }
    else if (lo === undefined) { step = 10; first = hi! - count * step; }
    else if (hi === undefined) { step = 10; first = lo + step; }
    else {
      step = Math.floor((hi - lo) / (count + 1));
      if (step < 1) return renumbered(current, ids);
      first = lo + step;
    }
    for (let n = 0; n < count; n++) next.set(ids[i + n], first + n * step);
    i = j;
  }
  for (const [id, v] of next) if (old.get(id) === v) next.delete(id);
  return next;
}

function renumbered(current: Row[], ids: string[]): Map<string, number> {
  const old = new Map(current.map((r) => [r.id, r.sort_order]));
  const next = new Map<string, number>();
  ids.forEach((id, i) => { if (old.get(id) !== (i + 1) * 10) next.set(id, (i + 1) * 10); });
  return next;
}

/**
 * Saves the order of one category in one go. `ids` must be exactly the
 * category's current items (hidden ones included); if someone added or deleted
 * an item meanwhile, nothing is changed. Returns an error message or null.
 */
export async function saveOrder(supabase: SupabaseClient, table: Table, category: string, ids: string[]): Promise<string | null> {
  const { data: rows, error } = await supabase.from(table).select("id, sort_order").eq("category", category);
  if (error || !rows) return "Couldn't save the order. Please try again.";
  const same = rows.length === ids.length && new Set(ids).size === ids.length && ids.every((id) => rows.some((r) => r.id === id));
  if (!same) return "This list was changed elsewhere. Reload the page and arrange it again.";

  for (const [id, sort_order] of planOrder(rows as Row[], ids)) {
    const { error: e } = await supabase.from(table).update({ sort_order }).eq("id", id);
    if (e) return "Couldn't save the whole order. Reload the page and check it.";
  }
  return null;
}
