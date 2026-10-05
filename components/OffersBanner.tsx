import { Tag } from "lucide-react";
import { formatINR } from "@/lib/config";
import { getLiveOffers } from "@/lib/catalog";

const endsOn = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

/**
 * Live offers managed in /admin → Offers. Renders nothing when no offer is
 * live (or Supabase is unavailable), so pages look exactly as before.
 */
export default async function OffersBanner({ className = "" }: { className?: string }) {
  const offers = await getLiveOffers();
  if (offers.length === 0) return null;

  return (
    <section aria-label="Current offers" className={`mx-auto max-w-content px-5 md:px-8 ${className}`}>
      <div className={`grid gap-4 ${offers.length > 1 ? "md:grid-cols-2" : ""} ${offers.length > 2 ? "lg:grid-cols-3" : ""}`}>
        {offers.map((offer) => (
          <div key={offer.id} className="relative flex items-start gap-4 overflow-hidden rounded-xl2 border border-yellow-dark/40 bg-yellow-light p-5 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-yellow text-ink">
              <Tag size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {offer.discountLabel && (
                  <span className="rounded-full bg-forest px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{offer.discountLabel}</span>
                )}
                <p className="font-display text-base font-bold text-ink">{offer.title}</p>
              </div>
              {offer.description && <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{offer.description}</p>}
              <p className="mt-1.5 text-xs font-medium text-ink-secondary">
                {offer.offerPrice !== null && <span className="mr-2 font-display text-base font-extrabold text-forest">{formatINR(offer.offerPrice)}</span>}
                {offer.endDate && <>Offer ends {endsOn.format(new Date(`${offer.endDate}T00:00:00+05:30`))}</>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
