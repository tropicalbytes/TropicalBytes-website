import Link from "next/link";
import { ArrowRight, CalendarClock, Gift, Leaf, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/config";
import { getLiveOffers, type LiveOffer } from "@/lib/catalog";

const endsOn = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

/**
 * Live offers managed in /admin → Offers. Renders nothing when no offer is
 * live (or Supabase is unavailable), so pages look exactly as before.
 */
export default async function OffersBanner({ className = "" }: { className?: string }) {
  const offers = await getLiveOffers();
  if (offers.length === 0) return null;
  const single = offers.length === 1;

  return (
    <section aria-label="Current offers" className={`mx-auto max-w-content px-5 md:px-8 ${className}`}>
      <div className={`grid gap-5 ${offers.length > 1 ? "md:grid-cols-2" : ""} ${offers.length > 2 ? "lg:grid-cols-3" : ""}`}>
        {offers.map((offer) => <OfferCard key={offer.id} offer={offer} wide={single} />)}
      </div>
    </section>
  );
}

function OfferCard({ offer, wide }: { offer: LiveOffer; wide: boolean }) {
  return (
    <article className="group relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-forest-dark via-forest to-forest-light p-6 text-white shadow-[0_24px_60px_-24px_rgba(7,91,42,0.65)] ring-1 ring-white/10 sm:p-8">
      {/* Decoration: soft glows, a dot texture and a large leaf, all behind the content */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-yellow/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-forest-light/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
      <Leaf aria-hidden="true" strokeWidth={1.2} className="pointer-events-none absolute -bottom-10 -right-8 -z-10 h-48 w-48 rotate-[-20deg] text-white/10 transition-transform duration-700 group-hover:rotate-[-10deg]" />

      <div className={`flex flex-col gap-6 ${wide ? "md:flex-row md:items-center md:gap-8" : ""}`}>
        <div className={`flex items-center gap-4 ${wide ? "md:flex-col md:items-center md:gap-3" : ""}`}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-yellow text-forest-dark shadow-lg shadow-black/20 ring-4 ring-yellow/30 sm:h-20 sm:w-20">
            <Gift className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.8} aria-hidden="true" />
          </span>
          {offer.discountLabel && (
            <span className="-rotate-3 rounded-xl bg-white px-3.5 py-1.5 text-center font-display text-lg font-extrabold uppercase leading-tight tracking-wide text-forest-dark shadow-md sm:text-xl">
              {offer.discountLabel}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-yellow-light backdrop-blur-sm">
            <Sparkles size={14} aria-hidden="true" /> Limited time offer
          </p>
          <h2 className={`mt-3 font-display font-extrabold leading-tight text-white ${wide ? "text-2xl sm:text-3xl md:text-4xl" : "text-2xl sm:text-[1.7rem]"}`}>
            {offer.title}
          </h2>
          {offer.description && (
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">{offer.description}</p>
          )}
          {(offer.offerPrice !== null || offer.endDate) && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {offer.offerPrice !== null && (
                <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-white px-4 py-2 text-forest-dark shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Only</span>
                  <span className="font-display text-2xl font-extrabold">{formatINR(offer.offerPrice)}</span>
                </span>
              )}
              {offer.endDate && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white">
                  <CalendarClock size={16} className="text-yellow" aria-hidden="true" />
                  Offer ends {endsOn.format(new Date(`${offer.endDate}T00:00:00+05:30`))}
                </span>
              )}
            </div>
          )}
        </div>

        <Link
          href="/plans/subscribe"
          className={`inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-yellow px-6 py-3.5 font-display text-base font-bold text-forest-dark shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow ${wide ? "md:self-center" : ""}`}
        >
          Order now
          <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
