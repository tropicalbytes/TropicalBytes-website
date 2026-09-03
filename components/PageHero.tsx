import Image from "next/image";
import { Leaf, LucideIcon } from "lucide-react";
import Reveal from "@/components/Reveal";

export interface PageHeroBadge {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
}

/**
 * Shared inner-page hero: small eyebrow, large heading (optionally with one
 * highlighted word), supporting copy, an optional row of feature badges,
 * and a food image on the right with a light decorative leaf/dot
 * treatment. Two variants share the same structure so every inner page
 * reads as one design system:
 *   - "dark"  — deep forest-green band (Subscription Plans, Contact)
 *   - "light" — off-white/pale-green band (Individual Meal, Party & Bulk)
 */
export default function PageHero({
  variant = "light",
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  heading,
  highlight,
  description,
  image,
  badges,
  seal,
  children,
  compact = false,
  imageFrame = true,
}: {
  variant?: "dark" | "light";
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  /** Heading text before the highlighted word. */
  heading: string;
  /** The final word(s) of the heading, rendered in the accent color. */
  highlight?: string;
  description: string;
  image: { src: string; alt: string };
  badges?: PageHeroBadge[];
  /** Small circular trust seal overlapping the image, e.g. "Fresh · Healthy · Hygienic". */
  seal?: { lines: string[] };
  children?: React.ReactNode;
  /** Tighter vertical rhythm — smaller padding/gaps/badge scale. Defaults to false, preserving the existing hero everywhere else. */
  compact?: boolean;
  /** When false, drops the rounded card + shadow around the image so a
   * pre-composed asset (already matching the hero background) blends in
   * without an obvious rectangular boundary. Defaults to true. */
  imageFrame?: boolean;
}) {
  const dark = variant === "dark";

  return (
    <section className={`relative overflow-hidden ${dark ? "bg-forest-dark" : "bg-gradient-to-b from-palegreen to-cream"}`}>
      {/* decorative dotted grid, top-right */}
      <div
        className={`pointer-events-none absolute right-6 top-8 hidden h-24 w-24 sm:block ${dark ? "opacity-70" : "opacity-40"}`}
        style={{
          backgroundImage: `radial-gradient(${dark ? "#FFD43B" : "#18A84A"} 1.4px, transparent 1.4px)`,
          backgroundSize: "14px 14px",
        }}
        aria-hidden="true"
      />
      <Leaf
        size={26}
        strokeWidth={1.6}
        className={`pointer-events-none absolute left-[38%] top-10 hidden -rotate-12 md:block ${dark ? "text-cream/25" : "text-forest/25"}`}
        aria-hidden="true"
      />

      <div
        className={`relative mx-auto grid max-w-content items-center px-5 md:grid-cols-2 md:px-8 ${
          compact ? "gap-8 py-10 md:gap-10 md:py-12" : "gap-10 py-14 md:gap-12 md:py-20"
        }`}
      >
        <Reveal>
          <span
            className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-semibold uppercase tracking-widest ${
              dark ? "bg-cream/10 text-yellow" : "bg-palegreen text-forest"
            } ${EyebrowIcon ? "" : "pl-3.5"}`}
          >
            {EyebrowIcon && (
              <span className={`grid h-6 w-6 place-items-center rounded-full ${dark ? "bg-cream/15" : "bg-white"}`}>
                <EyebrowIcon size={13} strokeWidth={2} />
              </span>
            )}
            {eyebrow}
          </span>
          <h1 className={`mt-4 font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.75rem] ${dark ? "text-cream" : "text-ink"}`}>
            {heading} {highlight && <span className={dark ? "text-yellow" : "text-forest"}>{highlight}</span>}
          </h1>
          {compact && <span className="mt-3 block h-1 w-14 rounded-full bg-yellow" aria-hidden="true" />}
          <p className={`mt-4 max-w-md text-sm leading-relaxed sm:text-[15px] ${dark ? "text-cream/80" : "text-ink-secondary"} text-justify`}>
            {description}
          </p>

          {children}

          {badges && badges.length > 0 && (
            <div className={compact ? "mt-5 flex flex-wrap gap-x-5 gap-y-4" : "mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:gap-6"}>
              {badges.map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span
                    className={`grid shrink-0 place-items-center rounded-full ${compact ? "h-8 w-8" : "h-9 w-9"} ${
                      dark ? "bg-cream/10 text-yellow" : "bg-palegreen text-forest"
                    }`}
                  >
                    <b.icon size={compact ? 14 : 16} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className={`text-xs font-bold leading-tight ${dark ? "text-cream" : "text-ink"}`}>{b.label}</p>
                    {b.sublabel && <p className={`text-[11px] leading-tight ${dark ? "text-cream/60" : "text-ink-secondary"}`}>{b.sublabel}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={140} className="relative">
          <div
            className={`relative mx-auto aspect-[4/3] w-full max-w-md ${
              imageFrame
                ? `overflow-hidden rounded-xl2 ${dark ? "shadow-[0_20px_45px_-18px_rgba(0,0,0,0.45)]" : "shadow-[0_25px_55px_-20px_rgba(8,122,53,0.35)]"}`
                : ""
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 480px, 90vw"
              className={imageFrame ? "object-cover" : "object-contain"}
              priority
            />
          </div>
          {seal && (
            <div
              className={`absolute -bottom-4 left-3 grid h-20 w-20 place-items-center rounded-full border-2 border-dashed p-2 text-center shadow-soft sm:left-6 ${
                dark ? "border-forest bg-white" : "border-forest bg-white"
              }`}
            >
              <p className="text-[8.5px] font-bold uppercase leading-tight tracking-wide text-forest">
                {seal.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </div>
          )}
          {imageFrame && (
            <Leaf
              size={22}
              strokeWidth={1.6}
              className={`pointer-events-none absolute -right-2 top-4 rotate-[20deg] ${dark ? "text-yellow/70" : "text-forest-light"}`}
              aria-hidden="true"
            />
          )}
        </Reveal>
      </div>
    </section>
  );
}
