"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { logActionError, revalidateAfterCatalogWrite } from "@/lib/admin/server";
import { firstIssue, friendlyDbError, settingSchema, SETTINGS, type ActionResult } from "@/lib/admin/shared";

export async function saveSetting(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { error, count } = await supabase.from("site_settings").update({ value: parsed.data.value }, { count: "exact" }).eq("key", parsed.data.key);
  if (error || !count) { logActionError("settings", error); return { ok: false, message: error ? friendlyDbError(error) : "That setting doesn't exist." }; }
  revalidateAfterCatalogWrite("/admin/settings");
  return { ok: true, message: `Saved “${SETTINGS[parsed.data.key]}”.` };
}
