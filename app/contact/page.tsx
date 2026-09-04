"use client";

import { useState } from "react";
import { business, faqs } from "@/lib/config";
import { submitToGoogleSheets, newClientRequestId } from "@/lib/submitForm";
import { isRequired, isValidEmail, isValidPhone, maxLength, validate } from "@/lib/validation";
import { REQUEST_TYPES, MAX_LENGTHS } from "@/lib/constants";
import { Button } from "@/components/Button";
import ErrorMessage from "@/components/ErrorMessage";
import FaqAccordion from "@/components/FaqAccordion";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { CardHeader, IconInput, IconTextarea, Field, FORM_CARD_CLASS } from "@/components/FormKit";
import { Phone, MessageCircle, MessageSquare, Mail, MapPin, Clock, Users, Send, User } from "lucide-react";

const CONTACT_ROWS = [
  { icon: Phone, label: "Phone", value: () => business.phoneDisplay, href: () => `tel:${business.phone.replace(/\s/g, "")}` },
  { icon: MessageCircle, label: "WhatsApp", value: () => business.phoneDisplay, href: () => `https://wa.me/${business.whatsapp}` },
  { icon: Mail, label: "Email", value: () => business.email, href: () => `mailto:${business.email}` },
  { icon: MapPin, label: "Address", value: () => business.address },
  { icon: Users, label: "Service Areas", value: () => business.serviceAreas.join(", ") },
  { icon: Clock, label: "Hours", value: () => business.hours },
];

export default function ContactPage() {
  const [values, setValues] = useState({ fullName: "", phone: "", email: "", message: "", honeypot: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const update = (field: keyof typeof values, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.honeypot) return;
    if (status === "submitting") return;

    const foundErrors = validate(
      values,
      {
        fullName: [isRequired, maxLength(MAX_LENGTHS.name)],
        phone: [isRequired, isValidPhone],
        email: [isRequired, isValidEmail],
        message: [isRequired, maxLength(MAX_LENGTHS.message)],
      },
      {
        fullName: "Please enter your full name.",
        phone: "Enter a valid 10-digit phone number.",
        email: "Enter a valid email address.",
        message: `Please tell us a little about your enquiry (max ${MAX_LENGTHS.message} characters).`,
      }
    );
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setStatus("submitting");
    setErrorMessage("");

    const result = await submitToGoogleSheets({
      requestType: REQUEST_TYPES.CONTACT,
      clientRequestId: newClientRequestId("CNT"),
      clientSubmittedAt: new Date().toISOString(),
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      message: values.message,
    });

    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  };

  return (
    <>
      <PageHero
        variant="dark"
        eyebrow="Contact"
        heading="We'd love to hear"
        highlight="from you"
        description="Have a question, feedback, or need help with your order? We're here for you!"
        image={{ src: "/brand/contact-hero.jpg", alt: "A TropicalBytes thali with rice, dal, paneer curry, and sides" }}
      />

      <section className="mx-auto max-w-content grid gap-12 px-5 py-16 md:grid-cols-2 md:px-8">
        <Reveal>
          <div className="space-y-4 rounded-xl2 border border-sand bg-white p-7 shadow-soft">
            {CONTACT_ROWS.map((row) => (
              <ContactRow key={row.label} icon={row.icon} label={row.label} value={row.value()} href={row.href?.()} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          {status === "success" ? (
            <div className="rounded-xl2 border border-sand bg-white p-8 text-center shadow-soft">
              <p className="font-display text-xl font-semibold text-forest">Thanks for reaching out!</p>
              <p className="mt-2 text-sm text-ink/70">
                We&apos;ve received your message and will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className={`space-y-5 ${FORM_CARD_CLASS}`}>
              <CardHeader icon={Send} title="Send us a Message" />
              <input
                type="text"
                value={values.honeypot}
                onChange={(e) => update("honeypot", e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
              <Field label="Full Name" error={errors.fullName}>
                <IconInput icon={User} value={values.fullName} onChange={(v) => update("fullName", v)} placeholder="Enter your full name" />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <IconInput icon={Phone} value={values.phone} onChange={(v) => update("phone", v)} placeholder="Enter your phone number" inputMode="tel" />
              </Field>
              <Field label="Email" error={errors.email}>
                <IconInput icon={Mail} type="email" value={values.email} onChange={(v) => update("email", v)} placeholder="Enter your email" />
              </Field>
              <Field label="Message" error={errors.message}>
                <IconTextarea icon={MessageSquare} className="min-h-[110px]" value={values.message} onChange={(e) => update("message", e.target.value)} placeholder="Enter your message" />
              </Field>

              {status === "error" && <ErrorMessage message={errorMessage} />}

              <Button type="submit" className="w-full" withArrow disabled={status === "submitting"}>
                {status === "submitting" ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </Reveal>
      </section>

      <section className="bg-palegreen px-5 py-16 md:px-8">
        <Reveal className="mx-auto max-w-content">
          <p className="text-xs font-semibold uppercase tracking-widest text-copper">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-forest">Quick answers</h2>
          <div className="mt-8 max-w-2xl">
            <FaqAccordion items={faqs.slice(0, 4)} />
          </div>
        </Reveal>
      </section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-sand pb-4 last:border-0 last:pb-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-palegreen text-forest">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-copper">{label}</span>
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="text-sm text-ink transition-colors hover:text-forest"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-ink">{value}</span>
        )}
      </div>
    </div>
  );
}
