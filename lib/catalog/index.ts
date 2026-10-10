import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient, supabasePublicConfig, SUPABASE_TIMEOUT_MS } from "../supabase/public";
import { catalogFromConfig, fetchCatalog, type Catalog } from "./core";

export * from "./core";

// ============================================================================
// PUBLIC DATA CACHE
//
// Visitors never query Supabase directly. Three layers sit in front of it:
//   1. Page cache (ISR): public pages are pre-rendered and served from Vercel's
//      edge. They re-render at most every 5 minutes (`revalidate = 300` on each
//      page). A re-render reads layer 2, not Supabase.
//   2. Data cache (unstable_cache below): one shared entry per data set,
//      refreshed from Supabase only when an admin saves (revalidateTag) or the
//      safety-net timer below expires. A stale entry keeps being served while it
//      refreshes in the background, and keeps being served if that refresh
//      fails, so a Supabase outage doesn't blank or downgrade the site.
//   3. Per-request de-duplication (React cache): one render asks layer 2 once.
//
// Admin saves call revalidateTag(CATALOG_TAG) (lib/admin/server.ts), which
// purges layer 2 and every page/route built from it, so edits show on the next
// visit. Edits made outside the admin panel (e.g. in the Supabase Dashboard)
// show within the safety-net time.
//
// Failures are never cached: each loader throws inside the cache and falls back
// outside it, so the next request retries Supabase instead of serving a cached
// failure.
// ============================================================================

/** Cache tag for all public catalog data: admin saves call revalidateTag(CATALOG_TAG). */
export const CATALOG_TAG = "catalog";
/** Catalog & menu PDF change only through the admin (which purges the tag); the timer is just a safety net. */
export const CATALOG_REVALIDATE_SECONDS = 3600;
/** Offers also start/end by date (IST, applied by RLS at query time), so they refresh more often. */
export const OFFERS_REVALIDATE_SECONDS = 300;

// Inside unstable_cache Next forces nested fetches to bypass its fetch cache, so
// Supabase requests are cached once (as the unstable_cache entry), not twice. The
// tagged options only stop the client's default `cache: "no-store"` from marking
// the page dynamic during static generation. Don't replace them with no-store.
const fetchOptions = (revalidate: number) => ({ next: { tags: [CATALOG_TAG], revalidate } });

function requireConfig(scope: string) {
  const config = supabasePublicConfig();
  if (!config) throw new Error(`${scope}: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set`);
  return config;
}

/** Rejects after `ms`: one overall deadline, since the client may retry network errors, each with its own timeout. */
async function withDeadline<T>(scope: string, work: Promise<T>, ms = SUPABASE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${scope}: Supabase did not answer within ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([work, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

const describe = (error: unknown) => (error instanceof Error ? error.message : error);

/**
 * unstable_cache keys each entry by the callback's source text + keyParts. The
 * minifier renames variables differently in each page's bundle, so a plain
 * callback gets a different key per page: the same data cached (and fetched
 * from Supabase) several times. A bound function's source text is always
 * "function () { [native code] }", so the key depends only on `key`: one
 * shared entry per data set. Keys must be unique: bump the version when the
 * cached shape changes.
 */
function sharedCache<T>(load: () => Promise<T>, key: string, revalidate: number) {
  return unstable_cache(load.bind(null), [key], { tags: [CATALOG_TAG], revalidate });
}

// ---------------------------------------------------------------- catalog

const cachedCatalog = sharedCache(
  async () => {
    const config = requireConfig("catalog");
    return withDeadline("catalog", fetchCatalog(createPublicClient(config, undefined, fetchOptions(CATALOG_REVALIDATE_SECONDS))));
  },
  "catalog-v1",
  CATALOG_REVALIDATE_SECONDS
);

/**
 * The catalog for server components and /api/enquiry. Served from the data
 * cache; on a miss it reads Supabase, and if that fails (not configured,
 * unreachable, no answer within 5 s, incomplete data) it logs and serves
 * lib/config.ts so the site never renders empty.
 */
export const getCatalog = cache(async (): Promise<Catalog> => {
  try {
    return await cachedCatalog();
  } catch (error) {
    console.error("[catalog] falling back to lib/config.ts:", describe(error));
    return catalogFromConfig();
  }
});

// ---------------------------------------------------------------- offers & menu PDF
// Same cache tag as the catalog, so any admin save refreshes them too.

export interface LiveOffer {
  id: string;
  title: string;
  description: string;
  discountLabel: string | null;
  offerPrice: number | null;
  endDate: string | null;
}

const cachedOffers = sharedCache(
  async (): Promise<LiveOffer[]> => {
    const config = requireConfig("offers");
    const { data, error } = await withDeadline(
      "offers",
      Promise.resolve(
        createPublicClient(config, undefined, fetchOptions(OFFERS_REVALIDATE_SECONDS))
          .from("offers")
          .select("id, title, description, discount_label, offer_price, end_date")
          .order("created_at", { ascending: false })
          .limit(3)
      )
    );
    if (error) throw new Error(error.message);
    return (data ?? []).map((o) => ({
      id: o.id, title: o.title, description: o.description, discountLabel: o.discount_label,
      offerPrice: o.offer_price, endDate: o.end_date,
    }));
  },
  "offers-v1",
  OFFERS_REVALIDATE_SECONDS
);

/** Offers live today (RLS applies the IST date window). Empty on any failure (offers are optional). */
export const getLiveOffers = cache(async (): Promise<LiveOffer[]> => {
  if (!supabasePublicConfig()) return [];
  try {
    return await cachedOffers();
  } catch (error) {
    console.error("[offers] not shown:", describe(error));
    return [];
  }
});

export interface CurrentMenuPdf {
  /** Supabase Storage address of the file. Server-side only: visitors get it through /menu.pdf. */
  url: string;
  /** The title the owner gave it in /admin (used as the download file name). */
  title: string;
}

const cachedMenuPdf = sharedCache(
  async (): Promise<CurrentMenuPdf | null> => {
    const config = requireConfig("menu-pdf");
    const client = createPublicClient(config, undefined, fetchOptions(CATALOG_REVALIDATE_SECONDS));
    const { data, error } = await withDeadline(
      "menu-pdf",
      Promise.resolve(client.from("menus").select("file_path, title").eq("is_current", true).maybeSingle())
    );
    if (error) throw new Error(error.message);
    return data ? { url: client.storage.from("menus").getPublicUrl(data.file_path).data.publicUrl, title: data.title } : null;
  },
  "menu-pdf-v2",
  CATALOG_REVALIDATE_SECONDS
);

/** The menu PDF published in /admin, or null (callers fall back to the static file). */
export const getCurrentMenuPdf = cache(async (): Promise<CurrentMenuPdf | null> => {
  if (!supabasePublicConfig()) return null;
  try {
    return await cachedMenuPdf();
  } catch (error) {
    console.error("[menu-pdf] using the static file:", describe(error));
    return null;
  }
});
