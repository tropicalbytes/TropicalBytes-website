import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import ItemsManager, { type AdminItem } from "@/components/admin/ItemsManager";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteMenuItem, moveMenuItem, saveMenuItem } from "./actions";

export const metadata: Metadata = { title: "Menu Items" };

export default async function MenuItemsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, category, name, description, price, is_vegetarian, is_active")
    .order("sort_order").order("id");
  if (error) throw new Error("Couldn't load menu items");

  const items: AdminItem[] = (data ?? []).map((m) => ({
    id: m.id, category: m.category, name: m.name, description: m.description, price: m.price,
    vegetarian: m.is_vegetarian, isActive: m.is_active,
  }));

  return (
    <>
      <PageHeader
        title="Menu Items"
        description="Dishes and desserts customers can order individually (the Menu and Individual Meal pages). Use the arrows to change the order they appear in."
      />
      <ItemsManager
        kind="menu"
        items={items}
        save={saveMenuItem}
        remove={deleteMenuItem}
        move={moveMenuItem}
        tabs={[
          { key: "veg", label: "Veg" },
          { key: "non_veg", label: "Non-Veg" },
          { key: "dessert", label: "Desserts", note: "Desserts are shared: the same items and prices are offered with individual meals and on Party & Bulk orders (priced per piece).",
            deleteNote: "This dessert will also disappear from Party & Bulk orders." },
        ]}
      />
    </>
  );
}
