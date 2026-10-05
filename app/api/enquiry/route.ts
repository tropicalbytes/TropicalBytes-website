import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { buildEnquiry } from "@/lib/enquiry";

// All website forms post here (lib/submitForm.ts). The server prices the
// enquiry from the catalog, then forwards it to the Google Apps Script web
// app (signed with GAS_SHARED_SECRET when configured, so Apps Script can
// trust the server-computed labels/totals). Apps Script still validates the
// customer's contact details, rate-limits, writes the Sheet and emails.

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;
const GAS_TIMEOUT_MS = 20_000;
const GENERIC = "Something went wrong while submitting your request. Please try again or contact us directly.";
const reply = (status: "ok" | "error", extra: Record<string, unknown> = {}, http = 200) =>
  NextResponse.json({ status, ...extra }, { status: http, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return reply("error", { message: GENERIC }, 413);

  let raw: unknown;
  try { raw = JSON.parse(body); } catch { return reply("error", { message: GENERIC }, 400); }

  // Honeypot: real browsers never fill it. Answer like a success so bots learn nothing.
  if (raw && typeof raw === "object" && (raw as Record<string, unknown>).honeypot) return reply("ok");

  const catalog = await getCatalog();
  const enquiry = buildEnquiry(raw, catalog);
  if (!enquiry.ok) {
    console.warn("[enquiry] rejected:", enquiry.reason);
    return reply("error", { message: enquiry.message }, 422);
  }

  const gasUrl = process.env.GAS_WEB_APP_URL || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  if (!gasUrl) {
    console.error("[enquiry] GAS_WEB_APP_URL is not set");
    return reply("error", { message: GENERIC }, 503);
  }
  const secret = process.env.GAS_SHARED_SECRET;
  const forward = { ...enquiry.payload, ...(secret ? { signature: secret } : {}), priceSource: catalog.source };

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(forward),
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(GAS_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[enquiry] Apps Script HTTP", res.status);
      return reply("error", { message: GENERIC }, 502);
    }
    const data = (await res.json().catch(() => null)) as { status?: string; message?: string; enquiryId?: string } | null;
    if (!data || data.status !== "ok") {
      return reply("error", { message: typeof data?.message === "string" ? data.message : GENERIC }, 502);
    }
    return reply("ok", typeof data.enquiryId === "string" ? { enquiryId: data.enquiryId } : {});
  } catch (error) {
    console.error("[enquiry] forwarding failed:", error instanceof Error ? error.message : error);
    return reply("error", { message: GENERIC }, 504);
  }
}
