/**
 * Subtle decorative "delivery route" graphic — two location pins joined
 * by a dashed curve, not a literal map. Used behind the scooter
 * illustration in the homepage's yellow CTA section to visually suggest
 * "TropicalBytes -> your doorstep" without adding map labels/detail.
 */
export default function DeliveryRoute({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 220 140" fill="none" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 110c30-10 40-55 70-60s55 20 100 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="1 9"
        strokeLinecap="round"
      />
      {/* origin pin */}
      <g transform="translate(10, 96)">
        <path d="M10 0C4.5 0 0 4.4 0 9.8 0 16.5 10 26 10 26s10-9.5 10-16.2C20 4.4 15.5 0 10 0Z" fill="currentColor" />
        <circle cx="10" cy="9.5" r="3.4" fill="var(--route-pin-dot, #FFF4C7)" />
      </g>
      {/* destination pin */}
      <g transform="translate(178, 46)">
        <path d="M10 0C4.5 0 0 4.4 0 9.8 0 16.5 10 26 10 26s10-9.5 10-16.2C20 4.4 15.5 0 10 0Z" fill="currentColor" />
        <circle cx="10" cy="9.5" r="3.4" fill="var(--route-pin-dot, #FFF4C7)" />
      </g>
    </svg>
  );
}
