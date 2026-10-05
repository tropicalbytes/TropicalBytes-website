import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicConfig } from "./public";

/**
 * Supabase client bound to the signed-in user's session cookie, for admin
 * server components and server actions. Uses only the publishable key: every
 * read/write runs as the user, so RLS (private.is_admin()) is what grants
 * access. The service-role key is never used here.
 */
export function createSupabaseServerClient() {
  const config = supabasePublicConfig();
  if (!config) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
  const cookieStore = cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only. The
          // middleware refreshes the session cookie on every /admin request.
        }
      },
    },
  });
}
