import Link from "next/link";
import { Rocket, Star, Trophy, Gem, ArrowRight, ShoppingCart } from "lucide-react";
import { SubscriptionTier, planOptionsForTier, formatINR } from "@/lib/config";

const TIER_ICON: Record<string, typeof Rocket> = {
  trial: Rocket,
  weekly: Star,
  monthly: Trophy,
  salad: Gem,
};

/**
 * A subscription tier card — shows the tier name/tagline plus its cheapest
 * per-meal price so the customer can compare before continuing to the
 * guided wizard. Full price breakdown lives on /plans/subscribe.
 */
export default function PlanCard({ tier, popular = false }: { tier: SubscriptionTier; popular?: boolean }) {
  const options = planOptionsForTier(tier.id);
  const cheapest = options.reduce((min, o) => (o.perMealPrice < min.perMealPrice ? o : min), options[0]);
  const Icon = TIER_ICON[tier.id] || Star;

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-xl2 border bg-white p-6 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_45px_-18px_rgba(8,122,53,0.28)] ${
        popular ? "border-forest" : "border-sand"
      }`}
    >
      {popular && (
        <span className="absolute right-0 top-0 rounded-bl-xl bg-yellow px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink">
          Most Popular
        </span>
      )}

      <span className="grid h-12 w-12 place-items-center rounded-full bg-palegreen text-forest">
        <Icon size={22} strokeWidth={1.8} />
      </span>

      <p className="mt-4 font-display text-lg font-bold text-ink">{tier.name}</p>
      <p className="mt-1 text-sm text-ink-secondary">{tier.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-xs font-medium text-ink-secondary">From</span>
        <span className="font-display text-2xl font-extrabold text-forest">{formatINR(cheapest.perMealPrice)}</span>
        <span className="text-xs font-medium text-ink-secondary">/ meal</span>
      </div>
      <p className="text-xs text-ink-secondary">{tier.durationLabel}</p>

      <div className="mt-auto pt-6">
        <Link
          href={`/plans/subscribe?tier=${tier.id}`}
          className={`group/btn inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ease-out hover:-translate-y-0.5 ${
            popular ? "bg-forest text-white hover:bg-forest-dark" : "border-2 border-forest text-forest hover:bg-palegreen"
          }`}
        >
          <ShoppingCart size={15} className="shrink-0" aria-hidden="true" />
          View Plan
          <ArrowRight size={15} className="ml-auto shrink-0 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}