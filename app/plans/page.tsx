import type { Metadata } from "next";
import PlanCard from "@/components/PlanCard";
import PageHero from "@/components/PageHero";
import { LinkButton } from "@/components/Button";
import Reveal from "@/components/Reveal";
import StickyMobileCta from "@/components/StickyMobileCta";
import { Bell } from "lucide-react";
import { subscriptionTiers, business } from "@/lib/config";

export const metadata: Metadata = {
  title: "Subscription Meal Plans",
  description: `3 Day Trial, Weekly, Monthly, and Salad subscription meal plans from ${business.name}.`,
};

export default function PlansPage() {
  return (
    <>
      <PageHero
        variant="dark"
        eyebrow="Subscription Meal Plans"
        eyebrowIcon={Bell}
        heading="Choose your"
        highlight="perfect meal plan"
        description="Fresh, nutritious meals delivered to your doorstep. Every plan includes your choice of vegetarian or non-vegetarian meals, once or twice a day. Submitting a request doesn't charge you. Our team confirms everything with you first."
        image={{ src: "/brand/meal-box.jpg", alt: "A TropicalBytes meal box with rice, dal, curry, and fresh vegetables" }}
      />

      <section className="mx-auto max-w-content px-5 py-20 md:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-copper">Pick a plan</p>
          <p className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
            Fresh, nutritious meals. Start your journey today
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {subscriptionTiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 80}>
              <PlanCard tier={tier} popular={tier.id === "weekly"} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="relative mt-14 overflow-hidden rounded-xl2 border border-copper/30 bg-gradient-to-br from-forest to-forest-dark p-8 text-center text-cream shadow-soft sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-copper/25 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-copper-light">
                No subscription needed
              </span>
              <p className="mt-4 font-display text-2xl font-semibold sm:text-3xl">Not looking for a subscription?</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cream/80 text-justify">
                Try TropicalBytes one plate at a time: request an individual meal and we&apos;ll confirm delivery
                with you directly, no commitment required.
              </p>
              <div className="mt-6">
                <LinkButton href="/menu/request" withArrow className="!bg-copper hover:!bg-copper-dark">
                  Order an Individual Meal
                </LinkButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <StickyMobileCta label="Start Your Subscription" href="/plans/subscribe" />
    </>
  );
}
