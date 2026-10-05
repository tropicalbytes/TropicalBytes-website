"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { logActionError, revalidateAfterCatalogWrite } from "@/lib/admin/server";
import { firstIssue, friendlyDbError, planTierUpdateSchema, type ActionResult } from "@/lib/admin/shared";

/** Saves one plan (tier details + its option prices/visibility). Only changed rows are written, so the audit log stays meaningful. */
export async function savePlanTier(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = planTierUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { tier, options } = parsed.data;

  const [{ data: currentTier }, { data: currentOptions }] = await Promise.all([
    supabase.from("plan_tiers").select("name, tagline, duration_days, is_popular, is_active").eq("id", tier.id).maybeSingle(),
    supabase.from("plan_options").select("id, total_price, is_active").eq("tier_id", tier.id),
  ]);
  if (!currentTier) return { ok: false, message: "That plan no longer exists. Reload the page." };

  const tierPatch = {
    name: tier.name, tagline: tier.tagline, duration_days: tier.durationDays, is_popular: tier.isPopular, is_active: tier.isActive,
  };
  const tierChanged = (Object.keys(tierPatch) as (keyof typeof tierPatch)[]).some((k) => tierPatch[k] !== currentTier[k]);
  let writes = 0;

  if (tierChanged) {
    const { error } = await supabase.from("plan_tiers").update(tierPatch).eq("id", tier.id);
    if (error) { logActionError("plans", error); return { ok: false, message: friendlyDbError(error) }; }
    writes++;
  }
  const byId = new Map((currentOptions ?? []).map((o) => [o.id, o]));
  for (const o of options) {
    const cur = byId.get(o.id);
    if (!cur) return { ok: false, message: "One of the plan options no longer exists. Reload the page." };
    if (cur.total_price === o.totalPrice && cur.is_active === o.isActive) continue;
    const { error } = await supabase.from("plan_options").update({ total_price: o.totalPrice, is_active: o.isActive }).eq("id", o.id).eq("tier_id", tier.id);
    if (error) { logActionError("plans", error); return { ok: false, message: friendlyDbError(error) }; }
    writes++;
  }

  revalidateAfterCatalogWrite("/admin/plans");
  return { ok: true, message: writes ? `Saved ${tier.name}.` : "No changes to save." };
}
