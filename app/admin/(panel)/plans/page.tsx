import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import PlanEditor, { type PlanTierData } from "./PlanEditor";

export const metadata: Metadata = { title: "Plans & Pricing" };

export default async function PlansPage() {
  const { supabase } = await requireAdmin();
  const [{ data: tiers, error: e1 }, { data: options, error: e2 }] = await Promise.all([
    supabase.from("plan_tiers").select("id, name, tagline, duration_days, is_popular, is_active").order("sort_order"),
    supabase.from("plan_options").select("id, tier_id, food_type, meal_count, total_price, is_active").order("sort_order"),
  ]);
  if (e1 || e2) throw new Error("Couldn't load plans");

  const data: PlanTierData[] = (tiers ?? []).map((t) => ({
    id: t.id, name: t.name, tagline: t.tagline, durationDays: t.duration_days, isPopular: t.is_popular, isActive: t.is_active,
    options: (options ?? []).filter((o) => o.tier_id === t.id).map((o) => ({
      id: o.id, foodType: o.food_type, mealCount: o.meal_count, totalPrice: o.total_price, isActive: o.is_active,
    })),
  }));

  return (
    <>
      <PageHeader
        title="Plans & Pricing"
        description="Subscription plans shown on the Plans page. Prices are the total for the whole plan; the per-meal price is worked out automatically. Hidden plans and options disappear from the website but are never deleted."
      />
      <div className="space-y-5">
        {data.map((tier) => <PlanEditor key={tier.id} tier={tier} />)}
      </div>
    </>
  );
}
