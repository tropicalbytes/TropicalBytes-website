import { NextResponse } from "next/server";
import { getCurrentMenuPdfUrl } from "@/lib/catalog";

// Stable address for the menu PDF (/menu.pdf). Sends visitors to the menu the
// owner published in /admin → Menu PDF, or to the original static file when
// none is published (or Supabase is unavailable), so shared links never break.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = (await getCurrentMenuPdfUrl()) ?? new URL("/tropicalbytes-menu.pdf", request.url).toString();
  return NextResponse.redirect(url, { status: 307, headers: { "Cache-Control": "public, max-age=60" } });
}
