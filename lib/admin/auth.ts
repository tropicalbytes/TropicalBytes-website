import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";

export type AdminContext = {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  userId: string;
  email: string;
};

/**
 * The signed-in admin, or null. A user is an admin only if RLS returns their
 * own row from public.admins (private.is_admin() is not callable over the API).
 */
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: row } = await supabase.from("admins").select("user_id, email").eq("user_id", auth.user.id).maybeSingle();
  if (!row) return null;
  return { supabase, userId: auth.user.id, email: row.email };
}

/**
 * Use at the top of every admin page and server action. Signed-out users go
 * to the login page; signed-in non-admins are signed out and told why. RLS
 * enforces the same rule in the database, so this is defence in depth.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (admin) return admin;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  redirect("/admin/login");
}
