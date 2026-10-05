import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import ItemsManager, { type AdminItem } from "@/components/admin/ItemsManager";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteBulkItem, moveBulkItem, saveBulkItem } from "./actions";

export const metadata: Metadata = { title: "Party & Bulk" };

export default async function PartyPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("bulk_items")
    .select("id, category, name, description, unit, price, is_seasonal, is_active")
    .order("sort_order").order("id");
  if (error) throw new Error("Couldn't load party items");

  const items: AdminItem[] = (data ?? []).map((b) => ({
    id: b.id, category: b.category, name: b.name, description: b.description, price: b.price,
    unit: b.unit, seasonal: b.is_seasonal, isActive: b.is_active,
  }));

  return (
    <>
      <PageHeader
        title="Party & Bulk"
        description={<>Items for party and bulk orders, usually priced per kg. Mark an item <em>Seasonal</em> when the price depends on the market (it shows without a fixed price). Desserts for party orders are managed under <Link href="/admin/menu-items" className="font-medium text-forest underline">Menu Items → Desserts</Link>. The minimum-order and advance-notice notes are in <Link href="/admin/settings" className="font-medium text-forest underline">Settings</Link>.</>}
      />
      <ItemsManager
        kind="bulk"
        items={items}
        save={saveBulkItem}
        remove={deleteBulkItem}
        move={moveBulkItem}
        tabs={[{ key: "veg", label: "Veg" }, { key: "non_veg", label: "Non-Veg" }]}
      />
    </>
  );
}
