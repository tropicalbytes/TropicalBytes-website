import { formatINR } from "../config";

// Turns raw audit_log rows into plain sentences for the Activity page and dashboard.

export interface AuditRow {
  id: number;
  at: string;
  actor_email: string | null;
  table_name: string;
  row_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE" | string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

export interface ActivityEntry {
  id: number;
  at: string;
  who: string;
  what: string;
  subject: string;
  changes: string[];
}

export const TABLE_LABELS: Record<string, string> = {
  plan_tiers: "Plan",
  plan_options: "Plan price",
  menu_items: "Menu item",
  bulk_items: "Party item",
  offers: "Offer",
  menus: "Menu PDF",
  site_settings: "Setting",
};

const FIELD_LABELS: Record<string, string> = {
  total_price: "price", price: "price", offer_price: "offer price", is_active: "shown on website", is_popular: "most popular",
  is_vegetarian: "vegetarian", is_seasonal: "seasonal", is_current: "current menu", duration_days: "days",
  discount_label: "badge", start_date: "starts", end_date: "ends", sort_order: "position", published_at: "published",
};
const HIDDEN = new Set(["updated_at", "created_at", "uploaded_at", "id", "uploaded_by"]);
const MONEY = new Set(["total_price", "price", "offer_price"]);

function show(field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (MONEY.has(field) && typeof v === "number") return formatINR(v);
  return String(v);
}

export function describe(row: AuditRow): ActivityEntry {
  const data = row.new_data ?? row.old_data ?? {};
  const subject = String(data.name ?? data.title ?? data.key ?? row.row_id ?? "");
  const label = TABLE_LABELS[row.table_name] ?? row.table_name;
  const what = row.action === "INSERT" ? `Added ${label.toLowerCase()}` : row.action === "DELETE" ? `Deleted ${label.toLowerCase()}` : `Changed ${label.toLowerCase()}`;

  const changes: string[] = [];
  if (row.action === "UPDATE" && row.old_data && row.new_data) {
    for (const key of Object.keys(row.new_data)) {
      if (HIDDEN.has(key)) continue;
      const before = row.old_data[key], after = row.new_data[key];
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      changes.push(`${FIELD_LABELS[key] ?? key.replace(/_/g, " ")}: ${show(key, before)} → ${show(key, after)}`);
    }
  }
  return { id: row.id, at: row.at, who: row.actor_email ?? "Initial setup", what, subject, changes };
}
