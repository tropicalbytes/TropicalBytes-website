import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton } from "@/components/Button";
import Reveal from "@/components/Reveal";
import { business, placeholderImages } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Learn what ${business.name} is, how our meal subscriptions work, and why we focus on convenience, quality, and consistency.`,
};

const pillars = [
  { title: "Convenience", body: "One decision a week instead of one decision a day. Set your plan and let it run." },
  { title: "Quality", body: "Ingredients and recipes chosen the way you'd choose them for your own kitchen." },
  { title: "Consistency", body: "The same care in every delivery, whether it's your first week or your fiftieth." },
  { title: "Flexibility", body: "Change your meal preference, pause a week, or switch plans. Just tell us." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest px-5 py-20 text-cream md:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 animate-float-slow rounded-full bg-copper/20 blur-3xl" />
        <div className="relative mx-auto max-w-content">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-copper-light">About Us</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              We handle the everyday question of &ldquo;what&apos;s for lunch,&rdquo; so you don&apos;t have to.
            </h1>
            <p className="mt-5 max-w-xl text-cream/80 text-justify">
              {business.name} is a meal subscription service built for people who want home-style food on a
              schedule that fits their life, not the other way around.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 pt-14 md:px-8">
        <Reveal>
          <div className="relative h-56 w-full overflow-hidden rounded-xl2 shadow-soft sm:h-72 md:h-80">
            <Image
              src={placeholderImages.aboutBanner}
              alt="Fresh ingredients and home-style cooking behind every TropicalBytes plate"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/50 via-forest/0 to-forest/0" />
            <p className="absolute bottom-5 left-6 font-display text-lg font-medium text-cream sm:text-xl">
              Fresh ingredients. Cooked with care.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-content px-5 py-20 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="h-full rounded-xl2 border border-sand bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(31,58,46,0.3)]">
                <p className="font-display text-xl font-semibold text-forest">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-palegreen px-5 py-16 md:px-8">
        <Reveal className="mx-auto grid max-w-content gap-8 md:grid-cols-2 md:items-center">
          <p className="font-display text-2xl leading-snug text-forest sm:text-3xl">
            &ldquo;We built {business.name} the way we&apos;d want to be fed: familiar food, on time, without
            having to think about it.&rdquo;
          </p>
          <div>
            <p className="text-sm leading-relaxed text-ink/70 text-justify">
              Every plan starts as a conversation. You tell us your preferences and schedule, we confirm the
              details, and your meals become one less thing to plan for.
            </p>
            <div className="mt-6">
              <LinkButton href="/plans" withArrow>
                Explore Meal Plans
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
