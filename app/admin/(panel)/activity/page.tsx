import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/admin/ui";
import ActivityList from "@/components/admin/ActivityList";
import { requireAdmin } from "@/lib/admin/auth";
import { describe, TABLE_LABELS, type AuditRow } from "@/lib/admin/activity";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 100;

export default async function ActivityPage({ searchParams }: { searchParams: { table?: string; setup?: string } }) {
  const { supabase } = await requireAdmin();
  const table = searchParams.table && searchParams.table in TABLE_LABELS ? searchParams.table : null;
  const showSetup = searchParams.setup === "1";

  let query = supabase
    .from("audit_log")
    .select("id, at, actor_email, table_name, row_id, action, old_data, new_data")
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);
  if (table) query = query.eq("table_name", table);
  if (!showSetup) query = query.not("actor", "is", null);
  const { data, error } = await query;
  if (error) throw new Error("Couldn't load activity");

  const filterLink = (t: string | null, label: string) => {
    const params = new URLSearchParams();
    if (t) params.set("table", t);
    if (showSetup) params.set("setup", "1");
    const qs = params.toString();
    const href = `/admin/activity${qs ? `?${qs}` : ""}`;
    const active = t === table;
    return (
      <Link key={label} href={href} className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${active ? "border-forest bg-forest text-white" : "border-sand bg-white text-ink hover:border-forest"}`}>
        {label}
      </Link>
    );
  };
  const setupHref = `/admin/activity?${new URLSearchParams({ ...(table ? { table } : {}), ...(showSetup ? {} : { setup: "1" }) })}`;

  return (
    <>
      <PageHeader title="Activity" description={`Every change made in the admin panel, newest first (last ${PAGE_SIZE}). Times are India time.`} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filterLink(null, "All")}
        {Object.entries(TABLE_LABELS).map(([t, label]) => filterLink(t, label))}
      </div>
      <Card>
        <ActivityList entries={(data as AuditRow[]).map(describe)} />
      </Card>
      <p className="mt-3 text-xs text-ink-secondary">
        <Link href={setupHref} className="underline">{showSetup ? "Hide" : "Show"} the initial data import</Link>
      </p>
    </>
  );
}
