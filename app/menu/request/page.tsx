import { CalendarClock, ShieldCheck, Sparkles, Truck } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getCatalog } from "@/lib/catalog";
import RequestForm from "./RequestForm";

// Refreshes when the owner saves in /admin (cache tag "catalog"), and at least every 5 minutes.
export const revalidate = 300;

export default async function IndividualMealRequestPage() {
  const { menu } = await getCatalog();
  return (
    <>
      <PageHero
        variant="light"
        eyebrow="Individual Meal"
        heading="Single"
        highlight="Meal"
        description="Fresh meals delivered when you need them. Choose a lunch or dinner without committing to a long-term plan."
        image={{ src: "/brand/meal-box-light.jpg", alt: "A TropicalBytes single meal box with rice, dal, curry, and fresh vegetables" }}
        compact
        imageFrame={false}
        badges={[
          { icon: Sparkles, label: "Freshly Prepared", sublabel: "Everyday" },
          { icon: ShieldCheck, label: "Hygienic & Safe", sublabel: "Quality assured" },
          { icon: Truck, label: "On-Time Delivery", sublabel: "Right to your door" },
          { icon: CalendarClock, label: "No Commitment", sublabel: "Order anytime" },
        ]}
      />
      <section className="mx-auto max-w-content px-5 pb-16 pt-10 md:px-8">
        <RequestForm menu={menu} />
      </section>
    </>
  );
}
