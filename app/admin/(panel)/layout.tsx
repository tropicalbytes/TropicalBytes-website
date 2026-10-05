import { Info } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { PUBLIC_SITE_READS_DATABASE } from "@/lib/admin/shared";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
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
      {children}
    </AdminShell>
  );
}
