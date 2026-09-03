import Image from "next/image";
import { LinkButton } from "@/components/Button";
import PlanCard from "@/components/PlanCard";
import Reveal from "@/components/Reveal";
import StickyMobileCta from "@/components/StickyMobileCta";
import DeliveryScooter from "@/components/icons/DeliveryScooter";
import { business, subscriptionTiers } from "@/lib/config";
import {
  Leaf,
  ChefHat,
  Truck,
  ShoppingBag,
  ShieldCheck,
  Salad,
  MapPin,
  Users,
  ClipboardList,
  CalendarDays,
  CookingPot,
  Phone,
} from "lucide-react";

const benefits = [
  { icon: Leaf, title: "Fresh Ingredients", body: "Sourced daily for maximum freshness" },
  { icon: ChefHat, title: "Chef Prepared", body: "Expert chefs with balanced nutrition" },
  { icon: Truck, title: "On-Time Delivery", body: "Reliable delivery right on schedule" },
  { icon: ShoppingBag, title: "No Minimum Order", body: "Order as per your convenience" },
];

const processSteps = [
  { icon: ClipboardList, title: "Choose Your Plan", body: "Select a plan that suits your needs." },
  { icon: CalendarDays, title: "Customize Schedule", body: "Pick your meals, food type, and start date." },
  { icon: CookingPot, title: "We Cook & Pack", body: "Our chefs prepare fresh meals with care." },
  { icon: null, title: "Delivered to You", body: "Hot, fresh meals delivered to your doorstep." },
];

const whyChoose = [
  { icon: ShieldCheck, title: "Hygienic & Safe", body: "Prepared in clean kitchens with strict hygiene standards." },
  { icon: Salad, title: "Balanced Nutrition", body: "Well-balanced meals for a healthy, active lifestyle." },
  { icon: MapPin, title: "Local & Reliable", body: `Proudly serving ${business.serviceAreas.slice(0, 2).join(" & ")} with care.` },
  { icon: Users, title: "Customer First", body: "Your satisfaction is our top priority." },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-cream">
        <div className="relative mx-auto grid max-w-content items-center gap-14 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-palegreen px-3.5 py-1.5 text-xs font-semibold text-forest">
                <Leaf size={14} /> Home-style meal subscriptions
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
                Fresh Meals <br />
                Delivered <br />
                <span className="text-forest">Everyday</span>
              </h1>
              <div className="mt-3 h-1 w-12 rounded-full bg-yellow" aria-hidden="true" />
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-ink-secondary text-justify">
                Chef prepared, hygienic and delicious meals delivered at your doorstep in{" "}
                <span className="font-semibold text-forest">Udupi &amp; Manipal</span>.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <LinkButton href="/plans" withArrow>
                  Explore Plans
                </LinkButton>
                <LinkButton href="/menu" variant="secondary">
                  Menu
                </LinkButton>
              </div>
            </Reveal>

            <Reveal delay={280}>
              <div className="mt-7 flex items-center gap-2 text-sm font-medium text-ink-secondary">
                <MapPin size={16} className="shrink-0 text-forest" />
                Delivering in <span className="font-semibold text-forest">Udupi and Manipal City Limits</span>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — High-resolution hero composition matching the approved design reference */}
          <Reveal delay={180} className="flex justify-center lg:justify-end">
            <div className="relative aspect-[3/2] w-full max-w-xl overflow-hidden rounded-3xl shadow-soft sm:rounded-[2rem] lg:max-w-2xl xl:max-w-[42rem]">
              <Image
                src="/brand/hero-reference.png"
                alt="Fresh chef-prepared biryani meal from TropicalBytes with side dishes and garnishes"
                fill
                sizes="(min-width: 1280px) 672px, (min-width: 1024px) 620px, (min-width: 768px) 520px, 95vw"
                className="object-cover"
                priority
              />
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 rounded-2xl border border-sand/60 bg-white/95 px-3.5 py-2 shadow-soft backdrop-blur-sm sm:bottom-5 sm:left-5 sm:px-4 sm:py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-white">
                  <ShieldCheck size={16} strokeWidth={2} />
                </span>
                <span className="text-xs font-bold leading-tight text-ink">
                  Hygienic
                  <br />&amp; Safe
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* TRUST / BENEFITS BAR */}
        <div className="mx-auto max-w-content px-5 pb-16 md:px-8">
          <Reveal delay={120}>
            <div className="grid gap-6 rounded-xl2 bg-yellow-light px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:px-10">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-forest shadow-sm">
                    <b.icon size={20} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-ink">{b.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-ink-secondary">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* MEAL PLANS */}
      <section className="mx-auto max-w-content px-5 py-20 md:px-8">
        <Reveal className="text-center">
          <span className="inline-block rounded-full bg-palegreen px-3.5 py-1.5 text-xs font-semibold text-forest">Our Plans</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-4xl">Meals for Every Lifestyle</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">Choose the perfect plan that fits your needs and schedule.</p>
        </Reveal>

        <div className="mt-10 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {subscriptionTiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 90} className="h-full">
              <PlanCard tier={tier} popular={tier.id === "weekly"} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-10 text-center">
          <LinkButton href="/plans" withArrow>
            View All Plans
          </LinkButton>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 bg-palegreen py-20">
        <div className="mx-auto max-w-content px-5 md:px-8">
          <Reveal className="text-center">
            <span className="inline-block rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-forest">How It Works</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-4xl">Simple Steps. Delicious Meals.</h2>
          </Reveal>

          <div className="relative mt-14">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-forest/25 lg:block" />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((s, i) => (
                <Reveal key={s.title} delay={i * 100} className="relative flex flex-col items-center text-center">
                  <span
                    className={`relative z-10 grid h-14 w-14 place-items-center rounded-full text-white shadow-soft ${i % 2 === 0 ? "bg-yellow !text-ink" : "bg-forest"
                      }`}
                  >
                    {s.icon ? <s.icon size={24} strokeWidth={1.8} /> : <DeliveryScooter className="h-7 w-7" />}
                  </span>
                  <p className="mt-4 font-display text-base font-bold text-ink">
                    {i + 1}. {s.title}
                  </p>
                  <p className="mt-1.5 max-w-[16rem] text-sm text-ink-secondary">{s.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="mx-auto max-w-content px-5 py-20 md:px-8">
        <Reveal className="text-center">
          <span className="inline-block rounded-full bg-palegreen px-3.5 py-1.5 text-xs font-semibold text-forest">Why Choose Us</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-4xl">Food You Can Trust</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
            We are committed to delivering fresh, healthy and delicious meals every day.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((item, i) => (
            <Reveal key={item.title} delay={i * 80} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-yellow-light text-forest">
                <item.icon size={24} strokeWidth={1.8} />
              </span>
              <p className="mt-4 font-display text-base font-bold text-ink">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-yellow">
        <div className="mx-auto grid max-w-content items-center gap-2 px-5 py-16 md:grid-cols-2 md:gap-8 md:px-8 md:py-20">
          <Reveal className="relative z-10">
            <h2 className="font-display text-[32px] font-extrabold text-ink sm:text-[38px]">
              Ready to Eat Better <br />
              <span className="text-forest">Everyday?</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/80">
              Join {business.name} today and experience the convenience of healthy, home-style meals delivered
              across {business.serviceAreas.slice(0, 2).join(" & ")}.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <LinkButton href="/plans" withArrow className="!bg-forest hover:!bg-forest-dark">
                Get Started Now
              </LinkButton>
              <LinkButton href={`tel:${business.phone.replace(/\s/g, "")}`} variant="secondary" className="!border-ink !text-ink hover:!bg-ink hover:!text-yellow">
                <Phone size={15} /> Call Now
              </LinkButton>
            </div>
          </Reveal>

          {/* TropicalBytes delivery rider — Udupi to Manipal route, feathered
              to blend directly into the section's yellow, no card/frame. */}
          <Reveal delay={120} className="relative -mx-5 h-56 sm:h-72 md:mx-0 md:h-[26rem]">
            <Image
              src="/brand/delivery-route-feathered.png"
              alt="TropicalBytes delivery rider on a green scooter, delivering from Udupi to Manipal"
              fill
              sizes="(min-width: 768px) 600px, 100vw"
              className="object-contain object-right md:object-center"
            />
          </Reveal>
        </div>
      </section>

      <StickyMobileCta label="Explore Meal Plans" href="/plans" />
    </>
  );
}
