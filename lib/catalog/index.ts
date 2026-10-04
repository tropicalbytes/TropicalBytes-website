import { unstable_cache } from "next/cache";
import { createPublicClient, supabasePublicConfig, SUPABASE_TIMEOUT_MS } from "../supabase/public";
import { catalogFromConfig, fetchCatalog, type Catalog } from "./core";

export * from "./core";

/** Cache tag for catalog data — admin saves will call revalidateTag(CATALOG_TAG). */
export const CATALOG_TAG = "catalog";
/** Safety-net refresh even if a revalidateTag is missed. */
export const CATALOG_REVALIDATE_SECONDS = 300;

const cachedFetch = unstable_cache(
  async () => {
    const config = supabasePublicConfig();
    if (!config) throw new Error("catalog: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set");
    // One overall deadline: the client may retry network errors, each with its own timeout.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`catalog: Supabase did not answer within ${SUPABASE_TIMEOUT_MS} ms`)), SUPABASE_TIMEOUT_MS);
    });
    try {
      return await Promise.race([fetchCatalog(createPublicClient(config)), deadline]);
    } finally {
      clearTimeout(timer);
    }
  },
  ["catalog-v1"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS }
);

/**
 * The catalog for server components. Supabase first; on any failure (not
 * configured, unreachable, no answer within 5 s, incomplete data) it logs and serves
 * lib/config.ts so the site never renders empty. Failures are not cached, so
 * the next request retries Supabase.
 *
 * Not used by any page yet — public pages still import lib/config.ts directly
 * (CLAUDE.md rule 6). Wiring it in is plan step 6.
 */
export async function getCatalog(): Promise<Catalog> {
  try {
    return await cachedFetch();
  } catch (error) {
    console.error("[catalog] falling back to lib/config.ts:", error instanceof Error ? error.message : error);
    return catalogFromConfig();
  }
}
