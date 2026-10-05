import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import SubscribeForm from "./SubscribeForm";

// Refreshes when the owner saves in /admin (cache tag "catalog"), and at least every 5 minutes.
export const revalidate = 300;

export default async function SubscribePage() {
  const { tiers, planOptions } = await getCatalog();
  return (
    <section className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-copper">Subscription Request</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl">Set up your meal plan</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/70 text-justify">
        A quick, guided form: this is a request, not a payment. Our team will contact you to confirm
        everything.
      </p>
      <div className="mt-10">
        <Suspense fallback={null}>
          <SubscribeForm tiers={tiers} planOptions={planOptions} />
        </Suspense>
      </div>
    </section>
  );
}
