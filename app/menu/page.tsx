import type { Metadata } from "next";
import Image from "next/image";
import { Download, Leaf } from "lucide-react";
import Reveal from "@/components/Reveal";
import VegIndicator, { FoodIndicatorType } from "@/components/VegIndicator";
import { LinkButton } from "@/components/Button";
import { business, individualMenu, formatINR, MenuItem } from "@/lib/config";

export const metadata: Metadata = {
  title: "Menu",
  description: `Browse the full ${business.name} menu: Veg Meals, Non-Veg Meals, and Desserts.`,
};

// Desserts are their own category (brown indicator) regardless of a given
// dessert's own veg/non-veg dietary status — this keeps "Dessert" visually
// distinct from "Non-Veg" elsewhere on the site. On this page specifically,
// the client wants the last 3 desserts shown in green instead — a
// page-specific display override, kept local to this file rather than
// touching the shared menu data (which stays "dessert" = brown everywhere
// else, e.g. the Individual Meal page).
const MENU_PAGE_DESSERT_OVERRIDE: Record<string, FoodIndicatorType> = {
  "Tropical Gudbad": "veg",
  "Arabian Gudbad": "veg",
  "Death By Chocolate": "veg",
};

const categories: { title: string; items: MenuItem[]; type: FoodIndicatorType | "auto"; overrides?: Record<string, FoodIndicatorType> }[] = [
  { title: "Veg Meals", items: individualMenu.veg, type: "veg" },
  { title: "Non-Veg Meals", items: individualMenu.nonVeg, type: "non-veg" },
  { title: "Desserts", items: individualMenu.desserts, type: "dessert", overrides: MENU_PAGE_DESSERT_OVERRIDE },
];

function MenuSection({
  title,
  items,
  type,
  overrides,
}: {
  title: string;
  items: MenuItem[];
  type: FoodIndicatorType | "auto";
  overrides?: Record<string, FoodIndicatorType>;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-forest">{title}</h2>
      <div className="mt-4 divide-y divide-sand">
        {items.map((item) => {
          const resolvedType = overrides?.[item.name] ?? (type === "auto" ? (item.vegetarian ? "veg" : "non-veg") : type);
          return (
            <div key={item.name} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold text-ink">{item.name}</p>
                <div className="mt-1">
                  <VegIndicator type={resolvedType} />
                </div>
              </div>
              <p className="shrink-0 font-display text-[15px] font-bold text-forest">{formatINR(item.price)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <>
      {/* HERO — the food-and-wave composition is a single pre-composed
          background artwork (public/brand/menu-hero-bg.jpg); all text and
          the Download button stay real HTML overlaid on top, per spec. */}
      <section className="relative overflow-hidden">
        <div className="relative h-[560px] w-full sm:h-[520px] md:h-[600px] lg:h-[660px]">
          <Image
            src="/brand/menu-hero-bg.jpg"
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover object-bottom"
            priority
          />

          <div className="relative z-10 mx-auto flex h-full max-w-content flex-col items-center justify-center px-5 pb-20 text-center sm:pb-16 md:px-8">
            <Reveal>
              <Image src="/brand/tropicalbytes-logo.png" alt="" aria-hidden="true" width={56} height={56} className="mx-auto h-12 w-12 sm:h-14 sm:w-14" />
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-forest sm:mt-4">
                <Leaf size={14} /> Our Menu
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:mt-4 sm:text-4xl">Our Subscription Menu</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary text-justify">
                Fresh, home-style meals prepared for your everyday routine. Explore our selection of freshly
                prepared meals, sides, and desserts.
              </p>
              <div className="mt-5 sm:mt-6">
                <a
                  href="/tropicalbytes-menu.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-full border-2 border-forest bg-white px-6 py-3 text-sm font-semibold text-forest transition-all duration-200 hover:-translate-y-0.5 hover:bg-palegreen"
                  aria-label="Download the TropicalBytes menu as a PDF"
                >
                  <Download size={16} aria-hidden="true" />
                  Download Menu
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative -mt-1 mx-auto max-w-content px-5 pb-16 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl space-y-12">
        {categories.map((cat, i) => (
          <Reveal key={cat.title} delay={i * 80}>
            <MenuSection title={cat.title} items={cat.items} type={cat.type} overrides={cat.overrides} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={260} className="mx-auto mt-16 max-w-2xl rounded-xl2 border border-sand bg-palegreen p-7 text-center">
        <p className="font-display text-lg font-bold text-ink">Ready to order?</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-secondary">
          Order any of these as a one-off meal, or set up a recurring subscription plan.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-4">
          <LinkButton href="/menu/request" withArrow>
            Order Individual Meal
          </LinkButton>
          <LinkButton href="/plans" variant="secondary">
            View Subscription Plans
          </LinkButton>
        </div>
      </Reveal>
      </section>
    </>
  );
}
