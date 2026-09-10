import type { Metadata } from "next";
import FaqAccordion from "@/components/FaqAccordion";
import Reveal from "@/components/Reveal";
import { faqs, business } from "@/lib/config";

export const metadata: Metadata = {
  title: { absolute: "Frequently Asked Questions - TropicalBytes" },
  description: `Answers to common questions about ${business.name} meal plans, pricing, and delivery in Udupi & Manipal.`,
  alternates: {
    canonical: "https://tropicalbytes.in/faq",
  },
};

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-content px-5 py-16 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
