/**
 * Custom brand illustration: a delivery rider on a scooter, in the
 * TropicalBytes green palette. Used in place of a generic bicycle icon
 * wherever the homepage represents "delivery" (How It Works step, CTA
 * section). Kept flat and minimal on purpose — no gradients/shadows, per
 * the brand's premium-minimal illustration guidance.
 */
export default function DeliveryScooter({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      {/* rear wheel */}
      <circle cx="14" cy="49" r="7" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="14" cy="49" r="1.6" fill="currentColor" />
      {/* front wheel */}
      <circle cx="46" cy="49" r="7" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="46" cy="49" r="1.6" fill="currentColor" />
      {/* scooter body */}
      <path
        d="M14 49h6l3-11h9c2.2 0 4 1.8 4 4v3.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M23 38h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* footboard + front */}
      <path d="M36 49h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 49V37.5c0-1 .8-2 2-2h2.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* handlebar */}
      <path d="M44 33.5h5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* delivery box on the back */}
      <rect x="4" y="30" width="11" height="10" rx="1.6" fill="currentColor" />
      <path d="M4 34.5h11" stroke="var(--scooter-box-line, #FAFBF7)" strokeWidth="1.4" />
      {/* rider torso + head */}
      <circle cx="33" cy="20.5" r="3.4" fill="currentColor" />
      <path
        d="M33 24.5c-3.6 0-6.4 2.5-7 6l-1 6.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M33 27.5c2.6.5 4.6 2 5.6 4.3l1.4 3.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* helmet visor accent */}
      <path d="M30.3 19.5a3.4 3.4 0 0 1 5.6-1.6" stroke="var(--scooter-box-line, #FAFBF7)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
