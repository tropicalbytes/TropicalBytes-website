export type SubmitResult = { ok: true; enquiryId?: string } | { ok: false; message: string };

const GENERIC_ERROR =
  "Something went wrong while submitting your request. Please try again or contact us directly.";

/**
 * Submits form data to the site's own /api/enquiry route, which prices the
 * enquiry from the live catalog (Supabase, falling back to lib/config.ts) and
 * forwards it to the Google Apps Script Web App that writes the Sheet and
 * emails the business.
 *
 * TRUST BOUNDARY: anything in `payload` is advisory only. Labels and totals
 * are recomputed server-side from ids + quantities (lib/enquiry.ts); Apps
 * Script re-validates the customer's details and generates the authoritative
 * enquiry id and timestamp.
 */
export async function submitToGoogleSheets(
  payload: Record<string, unknown>
): Promise<SubmitResult> {
  try {
    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.status !== "ok") {
      // The route returns safe, customer-facing messages (never raw errors).
      return { ok: false, message: typeof data?.message === "string" ? data.message : GENERIC_ERROR };
    }

    return { ok: true, enquiryId: typeof data.enquiryId === "string" ? data.enquiryId : undefined };
  } catch {
    return {
      ok: false,
      message: "Something went wrong while submitting your request. Please check your connection and try again, or contact us directly.",
    };
  }
}

/**
 * A client-side correlation id sent along with the request purely so the
 * customer's own browser/console can cross-reference a submission if
 * needed. This is NEVER the authoritative Enquiry ID — the backend
 * generates and owns that (see `generateEnquiryId` in Code.gs).
 */
export function newClientRequestId(prefix: string) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
