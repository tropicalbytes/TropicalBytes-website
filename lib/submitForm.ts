import { GAS_WEB_APP_URL } from "./config";

export type SubmitResult = { ok: true; enquiryId?: string } | { ok: false; message: string };

const GENERIC_ERROR =
  "Something went wrong while submitting your request. Please try again or contact us directly.";

/**
 * Submits form data to the Google Apps Script Web App, which independently
 * validates everything, writes the enquiry to the relevant Google Sheet, and
 * emails the business a copy.
 *
 * TRUST BOUNDARY: this call crosses into an untrusted-by-default backend
 * boundary — anything in `payload` is advisory only. The Apps Script backend
 * re-validates every field, ignores/overwrites client-supplied `status`,
 * generates its own authoritative `enquiryId` and timestamp, and recomputes
 * price from its own allowlisted configuration rather than trusting
 * `clientEstimatedTotal`. Never add a field here and assume the backend
 * will treat it as authoritative without also updating Code.gs.
 *
 * Uses a plain (non-preflighted) POST with a text/plain body so it works
 * against Apps Script Web Apps without extra CORS configuration.
 */
export async function submitToGoogleSheets(
  payload: Record<string, unknown>
): Promise<SubmitResult> {
  if (!GAS_WEB_APP_URL) {
    // No backend configured yet — fail gracefully with a clear message
    // rather than a confusing network error, so local/demo builds still work.
    console.warn(
      "NEXT_PUBLIC_GAS_WEB_APP_URL is not set. See google-apps-script/README.md."
    );
    return { ok: false, message: GENERIC_ERROR };
  }

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { ok: false, message: GENERIC_ERROR };
    }

    const data = await response.json().catch(() => ({ status: "ok" }));
    if (data.status && data.status !== "ok") {
      // The backend returns a safe, generic message on failure (never a raw
      // stack trace or internal error) — pass it through when present.
      return { ok: false, message: typeof data.message === "string" ? data.message : GENERIC_ERROR };
    }

    return { ok: true, enquiryId: typeof data.enquiryId === "string" ? data.enquiryId : undefined };
  } catch (error) {
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
