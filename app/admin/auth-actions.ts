"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { SESSION_COOKIES, lastSeenCookie, signedInCookie } from "@/lib/admin/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

/** Only same-site /admin paths; never an open redirect. */
function safeNext(next: string | undefined) {
  return next && /^\/admin(\/[A-Za-z0-9\-/]*)?$/.test(next) && next !== "/admin/login" ? next : "/admin";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details", email };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) {
    // Same message for unknown email and wrong password: don't reveal which accounts exist.
    return { error: error?.status === 429 ? "Too many attempts. Wait a minute and try again." : "Incorrect email or password.", email };
  }

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access.", email };
  }
  // Start the session clocks (lib/admin/session.ts).
  const now = Date.now();
  cookies().set(lastSeenCookie(now));
  cookies().set(signedInCookie(now));
  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  SESSION_COOKIES.forEach((name) => cookies().delete({ name, path: "/admin" }));
  redirect("/admin/login?signed-out=1");
}

/** Signs out every device signed in to this admin account, including this one. */
export async function signOutEverywhere() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut({ scope: "global" });
  SESSION_COOKIES.forEach((name) => cookies().delete({ name, path: "/admin" }));
  redirect("/admin/login?signed-out=all");
}
