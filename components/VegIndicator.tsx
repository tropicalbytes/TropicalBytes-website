export type FoodIndicatorType = "veg" | "non-veg" | "dessert";

const STYLES: Record<FoodIndicatorType, { border: string; dot: string; text: string; label: string; aria: string }> = {
  veg: { border: "border-forest", dot: "bg-forest", text: "text-forest", label: "Veg", aria: "Vegetarian" },
  "non-veg": { border: "border-danger", dot: "bg-danger", text: "text-danger", label: "Non-Veg", aria: "Non-Vegetarian" },
  dessert: { border: "border-brown", dot: "bg-brown", text: "text-brown", label: "Dessert", aria: "Dessert" },
};

/**
 * The standard Indian veg/non-veg mark (a colored square with a dot),
 * paired with a visible text label — not color alone — so the
 * distinction reads for colorblind users too, per accessibility
 * requirements. Desserts get their own brown category mark, kept
 * distinct from Non-Veg red so the two read as different things at a
 * glance, rather than "Dessert" implying "contains meat".
 */
export default function VegIndicator({ type }: { type: FoodIndicatorType }) {
  const s = STYLES[type];
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={s.aria}>
      <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border ${s.border}`} aria-hidden="true">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.text}`}>{s.label}</span>
    </span>
  );
}
