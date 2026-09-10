import type { Metadata } from "next";
import { faqs } from "@/lib/config";

export const metadata: Metadata = {
  title: { absolute: "Contact Us & FAQs - TropicalBytes" },
  description:
    "Get in touch with TropicalBytes for meal subscriptions, delivery inquiries in Udupi & Manipal, or order assistance. Reach our team via phone, WhatsApp, or email.",
  alternates: {
    canonical: "https://tropicalbytes.in/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  // Matches the exact 4 FAQs visibly displayed on the Contact page
  const visibleFaqs = faqs.slice(0, 4);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visibleFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
