"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { CATEGORY_LABELS, moveItem, placement } from "@/lib/admin/items";
import { logActionError, revalidateAfterCatalogWrite } from "@/lib/admin/server";
import { firstIssue, friendlyDbError, menuItemSchema, type ActionResult } from "@/lib/admin/shared";

const PATH = "/admin/menu-items";

export async function saveMenuItem(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const v = parsed.data;
  const row = { name: v.name, description: v.description, price: v.price, is_vegetarian: v.vegetarian, is_active: v.isActive };

  const { moved, ...place } = await placement(supabase, "menu_items", v.id, v.category);
  const { error } = v.id
    ? await supabase.from("menu_items").update({ ...row, ...place }).eq("id", v.id)
    : await supabase.from("menu_items").insert({ ...row, ...place });
  if (error) { logActionError("menu-items", error); return { ok: false, message: friendlyDbError(error) }; }
  revalidateAfterCatalogWrite(PATH);
  const section = CATEGORY_LABELS[v.category];
  return { ok: true, message: !v.id ? `Added ${v.name} to ${section}.` : moved ? `Saved ${v.name} and moved it to ${section}.` : `Saved ${v.name}.` };
}

export async function deleteMenuItem(id: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown item." };
  const { error, count } = await supabase.from("menu_items").delete({ count: "exact" }).eq("id", parsed.data);
  if (error || !count) { logActionError("menu-items", error); return { ok: false, message: error ? friendlyDbError(error) : "That item was already removed." }; }
  revalidateAfterCatalogWrite(PATH);
  return { ok: true, message: "Item deleted." };
}

export async function moveMenuItem(id: unknown, direction: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.tuple([z.string().min(1), z.enum(["up", "down"])]).safeParse([id, direction]);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const err = await moveItem(supabase, "menu_items", ...parsed.data);
  if (err) return { ok: false, message: err };
  revalidateAfterCatalogWrite(PATH);
  return { ok: true, message: "Order updated." };
}
