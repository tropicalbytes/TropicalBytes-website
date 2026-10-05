"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { logActionError, revalidateAfterCatalogWrite } from "@/lib/admin/server";
import { firstIssue, friendlyDbError, offerSchema, type ActionResult } from "@/lib/admin/shared";

const PATH = "/admin/offers";

export async function saveOffer(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const v = parsed.data;
  const row = {
    title: v.title, description: v.description, discount_label: v.discountLabel, offer_price: v.offerPrice,
    start_date: v.startDate, end_date: v.endDate, is_active: v.isActive,
  };
  const { error } = v.id ? await supabase.from("offers").update(row).eq("id", v.id) : await supabase.from("offers").insert(row);
  if (error) { logActionError("offers", error); return { ok: false, message: friendlyDbError(error) }; }
  revalidateAfterCatalogWrite(PATH);
  return { ok: true, message: v.id ? `Saved “${v.title}”.` : `Created “${v.title}”.` };
}

export async function deleteOffer(id: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { error, count } = await supabase.from("offers").delete({ count: "exact" }).eq("id", parsed.data);
  if (error || !count) { logActionError("offers", error); return { ok: false, message: error ? friendlyDbError(error) : "That offer was already removed." }; }
  revalidateAfterCatalogWrite(PATH);
  return { ok: true, message: "Offer deleted." };
}
