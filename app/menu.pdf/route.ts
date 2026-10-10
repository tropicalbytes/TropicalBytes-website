import { NextResponse } from "next/server";
import { getCurrentMenuPdf } from "@/lib/catalog";

// Stable address for the menu PDF (/menu.pdf). Serves the menu the owner
// published in /admin → Menu PDF from this domain (visitors never see the
// storage address), named after its title, e.g. "Tropical-Bytes-Menu.pdf".
// When none is published, or storage can't be reached, it sends visitors to the
// original static file, so shared links never break.
//
// Rendered per request on purpose: Next 14 does not apply tag purges to cached
// route handlers, so a cached version would keep the old PDF after a publish.
// The lookup itself comes from the shared data cache (lib/catalog), and the
// file from Supabase's CDN.
export const dynamic = "force-dynamic";

/** "Week of 6 Oct" → "Week of 6 Oct.pdf"; characters unsafe in file names are dropped. */
function fileNameFor(title: string) {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "").replace(/\s+/g, " ").trim().replace(/\.pdf$/i, "") || "TropicalBytes Menu";
  return `${base}.pdf`;
}

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "TropicalBytes Menu.pdf";
  const encoded = encodeURIComponent(fileName).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request) {
  const menu = await getCurrentMenuPdf();
  if (menu) {
    try {
      const file = await fetch(menu.url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (file.ok && file.body) {
        const headers = new Headers({
          "Content-Type": "application/pdf",
          "Content-Disposition": contentDisposition(fileNameFor(menu.title)),
          "Cache-Control": "public, max-age=60",
        });
        const length = file.headers.get("content-length");
        if (length) headers.set("Content-Length", length);
        return new Response(file.body, { headers });
      }
      console.error(`[menu-pdf] storage answered ${file.status}; using the static file`);
    } catch (error) {
      console.error("[menu-pdf] storage unreachable; using the static file:", error instanceof Error ? error.message : error);
    }
  }
  return NextResponse.redirect(new URL("/tropicalbytes-menu.pdf", request.url), { status: 307, headers: { "Cache-Control": "public, max-age=60" } });
}
