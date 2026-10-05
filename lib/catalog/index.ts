import { unstable_cache } from "next/cache";
import { createPublicClient, supabasePublicConfig, SUPABASE_TIMEOUT_MS } from "../supabase/public";
import { catalogFromConfig, fetchCatalog, type Catalog } from "./core";

export * from "./core";

/** Cache tag for catalog data — admin saves will call revalidateTag(CATALOG_TAG). */
export const CATALOG_TAG = "catalog";
/** Safety-net refresh even if a revalidateTag is missed. */
export const CATALOG_REVALIDATE_SECONDS = 300;

/** Every Supabase request made for public pages carries the tag, so revalidateTag(CATALOG_TAG) purges it too. */
const tagged = { next: { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS } };

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
      return await Promise.race([fetchCatalog(createPublicClient(config, undefined, tagged)), deadline]);
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
 */
export async function getCatalog(): Promise<Catalog> {
  try {
    return await cachedFetch();
  } catch (error) {
    console.error("[catalog] falling back to lib/config.ts:", error instanceof Error ? error.message : error);
    return catalogFromConfig();
  }
}

// ---------------------------------------------------------------- offers & menu PDF
// Same cache tag as the catalog, so an admin save refreshes them too.

export interface LiveOffer {
  id: string;
  title: string;
  description: string;
  discountLabel: string | null;
  offerPrice: number | null;
  endDate: string | null;
}

/** Offers live today (RLS applies the IST date window). Empty on any failure — offers are optional. */
export const getLiveOffers = unstable_cache(
  async (): Promise<LiveOffer[]> => {
    const config = supabasePublicConfig();
    if (!config) return [];
    try {
      const { data, error } = await createPublicClient(config, undefined, tagged)
        .from("offers")
        .select("id, title, description, discount_label, offer_price, end_date")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw new Error(error.message);
      return (data ?? []).map((o) => ({
        id: o.id, title: o.title, description: o.description, discountLabel: o.discount_label,
        offerPrice: o.offer_price, endDate: o.end_date,
      }));
    } catch (error) {
      console.error("[offers] not shown:", error instanceof Error ? error.message : error);
      return [];
    }
  },
  ["offers-v1"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS }
);

/** Public URL of the menu PDF published in /admin, or null (callers fall back to the static file). */
export const getCurrentMenuPdfUrl = unstable_cache(
  async (): Promise<string | null> => {
    const config = supabasePublicConfig();
    if (!config) return null;
    try {
      const client = createPublicClient(config, undefined, tagged);
      const { data, error } = await client.from("menus").select("file_path").eq("is_current", true).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? client.storage.from("menus").getPublicUrl(data.file_path).data.publicUrl : null;
    } catch (error) {
      console.error("[menu-pdf] using the static file:", error instanceof Error ? error.message : error);
      return null;
    }
  },
  ["menu-pdf-v1"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS }
);
