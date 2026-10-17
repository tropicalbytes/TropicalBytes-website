import { Info } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SessionTimer from "@/components/admin/SessionTimer";
import { requireAdmin } from "@/lib/admin/auth";
import { cookies } from "next/headers";
import { MAX_SESSION_MS, SIGNED_IN_COOKIE, signedInAt } from "@/lib/admin/session";
import { PUBLIC_SITE_READS_DATABASE } from "@/lib/admin/shared";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const { data: auth } = await admin.supabase.auth.getSession(); // verified by requireAdmin() above
  const started = signedInAt(auth.session?.access_token) ?? (Number(cookies().get(SIGNED_IN_COOKIE)?.value) || Date.now());
  const remainingMs = Math.max(60_000, started + MAX_SESSION_MS - Date.now());
  const banner = PUBLIC_SITE_READS_DATABASE ? null : (
    <p className="mb-6 flex items-start gap-2 rounded-2xl border border-yellow-dark/30 bg-yellow-light px-4 py-3 text-sm text-ink">
      <Info size={18} className="mt-0.5 shrink-0 text-gold-dark" />
      <span>
        <strong>Setup in progress:</strong> changes you save here are stored and recorded in Activity, but the public
        website isn&apos;t reading from the admin panel yet. They&apos;ll appear on the site once it&apos;s switched over.
      </span>
    </p>
  );
  return (
    <AdminShell email={admin.email} banner={banner}>
      <SessionTimer remainingMs={remainingMs} />
      {children}
    </AdminShell>
  );
}
