import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "../catalog";

/** Call after any catalog write: refreshes cached public data (once pages read it) and the admin views. */
export function revalidateAfterCatalogWrite(adminPath: string) {
  revalidateTag(CATALOG_TAG);
  revalidatePath(adminPath);
  revalidatePath("/admin");
}

export function logActionError(scope: string, error: unknown) {
  console.error(`[admin:${scope}]`, error instanceof Error ? error.message : error);
}
