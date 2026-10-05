"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin, type AdminContext } from "@/lib/admin/auth";
import { logActionError, revalidateAfterCatalogWrite } from "@/lib/admin/server";
import { MAX_MENU_PDF_BYTES, firstIssue, friendlyDbError, type ActionResult } from "@/lib/admin/shared";

const BUCKET = "menus";
const PATH = "/admin/menu-pdf";
/** Also refreshes /menu.pdf, which serves the current menu. */
const refresh = () => revalidateAfterCatalogWrite(PATH);

/**
 * After a publish, deletes menus that were published before and are no longer
 * current (row + file), so old weekly menus don't pile up in Storage. Uploads
 * that were never published are kept. Best effort: the publish has already
 * succeeded, so a failure here is only logged (the old menu stays listed and
 * can be deleted by hand).
 */
async function removeOldPublishedMenus(supabase: AdminContext["supabase"]) {
  const { data: old, error } = await supabase.from("menus").select("id, file_path").eq("is_current", false).not("published_at", "is", null);
  if (error) { logActionError("menu-pdf", error); return; }
  if (!old?.length) return;
  const { error: delErr } = await supabase.from("menus").delete().in("id", old.map((m) => m.id));
  if (delErr) { logActionError("menu-pdf", delErr); return; }
  const { error: rmErr } = await supabase.storage.from(BUCKET).remove(old.map((m) => m.file_path));
  if (rmErr) logActionError("menu-pdf", rmErr); // rows are gone; a leftover file is harmless and not listed anywhere
}

export async function uploadMenuPdf(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const title = z.string().trim().min(1, "Give the menu a title (e.g. “Week of 6 Oct”)").max(120, "Keep the title under 120 characters").safeParse(formData.get("title"));
  if (!title.success) return { ok: false, message: firstIssue(title.error) };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a PDF file to upload." };
  if (file.size > MAX_MENU_PDF_BYTES) return { ok: false, message: "That file is over 5 MB. Please export a smaller PDF." };

  // Check the file really is a PDF (its first bytes), not just named .pdf.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return { ok: false, message: "That file isn't a PDF." };

  const path = `${new Date().getFullYear()}/${randomUUID()}.pdf`;
  const fileName = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "menu.pdf";
  // Each upload gets a new random path and is never overwritten, so browsers/CDN may cache it for a year.
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: false, cacheControl: "31536000" });
  if (upErr) { logActionError("menu-pdf", upErr); return { ok: false, message: "Upload failed. Please try again." }; }

  const { data: row, error } = await supabase.from("menus")
    .insert({ title: title.data, file_path: path, file_name: fileName, size_bytes: file.size })
    .select("id").single();
  if (error || !row) {
    logActionError("menu-pdf", error);
    await supabase.storage.from(BUCKET).remove([path]); // don't leave an orphaned file
    return { ok: false, message: friendlyDbError(error) };
  }

  if (formData.get("publish") === "on") {
    const { error: pubErr } = await supabase.rpc("publish_menu", { p_menu_id: row.id });
    if (pubErr) { logActionError("menu-pdf", pubErr); refresh(); return { ok: false, message: "Uploaded, but publishing failed. Use Publish below." }; }
    await removeOldPublishedMenus(supabase);
    refresh();
    return { ok: true, message: `Uploaded and published “${title.data}”.` };
  }
  refresh();
  return { ok: true, message: `Uploaded “${title.data}”. Publish it when you're ready.` };
}

export async function publishMenu(id: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown menu." };
  const { error } = await supabase.rpc("publish_menu", { p_menu_id: parsed.data });
  if (error) { logActionError("menu-pdf", error); return { ok: false, message: friendlyDbError(error) }; }
  await removeOldPublishedMenus(supabase);
  refresh();
  return { ok: true, message: "Published. This is now the current menu." };
}

export async function deleteMenu(id: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown menu." };
  const { data: menu } = await supabase.from("menus").select("file_path, is_current").eq("id", parsed.data).maybeSingle();
  if (!menu) return { ok: false, message: "That menu was already removed." };
  if (menu.is_current) return { ok: false, message: "This is the current menu. Publish a different one first." };

  const { error, count } = await supabase.from("menus").delete({ count: "exact" }).eq("id", parsed.data);
  if (error || !count) { logActionError("menu-pdf", error); return { ok: false, message: error ? friendlyDbError(error) : "Couldn't delete it." }; }
  const { error: rmErr } = await supabase.storage.from(BUCKET).remove([menu.file_path]);
  if (rmErr) logActionError("menu-pdf", rmErr); // row is gone; a leftover file is harmless and not listed anywhere
  refresh();
  return { ok: true, message: "Menu deleted." };
}
