import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { todayIST } from "@/lib/admin/shared";
import OffersManager, { type OfferData } from "./OffersManager";

export const metadata: Metadata = { title: "Offers" };

export default async function OffersPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("offers")
    .select("id, title, description, discount_label, offer_price, start_date, end_date, is_active")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Couldn't load offers");

  const offers: OfferData[] = (data ?? []).map((o) => ({
    id: o.id, title: o.title, description: o.description, discountLabel: o.discount_label, offerPrice: o.offer_price,
    startDate: o.start_date, endDate: o.end_date, isActive: o.is_active,
  }));

  return (
    <>
      <PageHeader
        title="Offers"
        description="Promotional offers. An offer is live on the website while it's switched on and today (India time) is between its start and end dates — leave a date empty for no limit. Offers are for display; they don't change enquiry prices."
      />
      <OffersManager offers={offers} today={todayIST()} />
    </>
  );
}
