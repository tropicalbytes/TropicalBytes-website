"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { logActionError } from "@/lib/admin/server";
import { firstIssue, type ActionResult } from "@/lib/admin/shared";

const MIN_PASSWORD_LENGTH = 10; // keep in sync with ChangePasswordForm.tsx

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`).max(72, "Keep it under 72 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "The new passwords don't match" })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Choose a password different from the current one" });

/**
 * Changes the signed-in admin's password. The current password is checked
 * first (so an unattended, signed-in device can't be used to lock the owner
 * out), then every OTHER signed-in device is signed out.
 */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const { supabase, email } = await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password: parsed.data.current });
  if (authError) {
    return { ok: false, message: authError.status === 429 ? "Too many attempts. Wait a minute and try again." : "Your current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) {
    logActionError("account", error);
    if (error.code === "weak_password") return { ok: false, message: "That password is too weak or has appeared in a data breach. Choose another." };
    if (error.code === "same_password") return { ok: false, message: "Choose a password different from the current one." };
    return { ok: false, message: "Couldn't change the password. Please try again." };
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) logActionError("account", signOutError);
  return { ok: true, message: "Password changed. Any other devices signed in to the admin have been signed out." };
}
