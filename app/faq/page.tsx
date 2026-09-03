import type { Metadata } from "next";
import FaqAccordion from "@/components/FaqAccordion";
import Reveal from "@/components/Reveal";
import { faqs, business } from "@/lib/config";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Answers to common questions about ${business.name} meal plans, pricing, and delivery.`,
};

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-content px-5 py-16 md:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-widest text-copper">FAQ</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-forest">Frequently asked questions</h1>
      </Reveal>
      <Reveal delay={100} className="mt-10 max-w-2xl">
        <FaqAccordion items={faqs} />
      </Reveal>
    </section>
  );
}
