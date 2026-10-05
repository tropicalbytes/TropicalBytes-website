import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, PartyPopper, Tag, UtensilsCrossed } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import ActivityList from "@/components/admin/ActivityList";
import { requireAdmin } from "@/lib/admin/auth";
import { describe, type AuditRow } from "@/lib/admin/activity";
import { formatIST, todayIST } from "@/lib/admin/shared";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, email } = await requireAdmin();
  const today = todayIST();
  const count = (table: string, active?: boolean) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (active !== undefined) q = q.eq("is_active", active);
    return q.then((r) => r.count ?? 0);
  };
  const [options, optionsHidden, items, itemsHidden, bulk, bulkHidden, liveOffers, currentMenu, recent] = await Promise.all([
    count("plan_options"), count("plan_options", false), count("menu_items"), count("menu_items", false),
    count("bulk_items"), count("bulk_items", false),
    supabase.from("offers").select("*", { count: "exact", head: true }).eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${today}`).or(`end_date.is.null,end_date.gte.${today}`).then((r) => r.count ?? 0),
    supabase.from("menus").select("title, published_at").eq("is_current", true).maybeSingle().then((r) => r.data),
    supabase.from("audit_log").select("id, at, actor_email, table_name, row_id, action, old_data, new_data")
      .not("actor", "is", null).order("id", { ascending: false }).limit(8).then((r) => (r.data ?? []) as AuditRow[]),
  ]);

  const tiles = [
    { href: "/admin/plans", icon: CalendarClock, label: "Plan prices", value: options, note: optionsHidden ? `${optionsHidden} hidden` : "all shown" },
    { href: "/admin/menu-items", icon: UtensilsCrossed, label: "Menu items", value: items, note: itemsHidden ? `${itemsHidden} hidden` : "all shown" },
    { href: "/admin/party", icon: PartyPopper, label: "Party items", value: bulk, note: bulkHidden ? `${bulkHidden} hidden` : "all shown" },
    { href: "/admin/offers", icon: Tag, label: "Live offers", value: liveOffers, note: "today, India time" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description={`Signed in as ${email}.`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ href, icon: Icon, label, value, note }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-sand bg-white p-4 shadow-sm transition-colors hover:border-forest">
            <Icon size={18} className="text-forest" />
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">{value}</p>
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="text-xs text-ink-secondary">{note}</p>
          </Link>
        ))}
      </div>

      <Link href="/admin/menu-pdf" className="mt-3 flex items-center gap-3 rounded-2xl border border-sand bg-white p-4 shadow-sm transition-colors hover:border-forest">
        <FileText size={20} className="text-forest" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Current menu PDF</p>
          <p className="truncate text-xs text-ink-secondary">
            {currentMenu ? <>{currentMenu.title}{currentMenu.published_at && <> · published {formatIST(currentMenu.published_at)}</>}</> : "None published yet — upload one"}
          </p>
        </div>
        <ArrowRight size={16} className="text-ink-secondary" />
      </Link>

      <Card className="mt-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">Recent changes</h2>
          <Link href="/admin/activity" className="text-sm font-medium text-forest hover:underline">See all</Link>
        </div>
        <ActivityList entries={recent.map(describe)} />
      </Card>
    </>
  );
}
