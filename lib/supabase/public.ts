import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read-only Supabase client for public catalog data, used on the server only.
// It authenticates with the publishable key (safe to expose — RLS limits it to
// active rows), keeps no session, and bypasses Next's fetch cache so caching is
// controlled in one place (lib/catalog/index.ts).

export const SUPABASE_TIMEOUT_MS = 5000;

export function supabasePublicConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function createPublicClient(
  config: { url: string; key: string },
  timeoutMs = SUPABASE_TIMEOUT_MS
): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) }),
    },
  });
}
