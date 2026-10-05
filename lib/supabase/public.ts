import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read-only Supabase client for public catalog data, used on the server only.
// It authenticates with the publishable key (safe to expose — RLS limits it to
// active rows) and keeps no session. Inside Next, callers pass `cache` options
// (lib/catalog/index.ts tags every request "catalog" so an admin save purges
// it); outside Next (scripts) requests are simply uncached.

export const SUPABASE_TIMEOUT_MS = 5000;

export function supabasePublicConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/** Extra fetch options for every request, e.g. Next's `{ next: { tags, revalidate } }`. */
export type FetchCacheOptions = Pick<RequestInit, "cache"> & { next?: { tags?: string[]; revalidate?: number | false } };

export function createPublicClient(
  config: { url: string; key: string },
  timeoutMs = SUPABASE_TIMEOUT_MS,
  cache: FetchCacheOptions = { cache: "no-store" }
): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, ...cache, signal: AbortSignal.timeout(timeoutMs) } as RequestInit),
    },
  });
}
