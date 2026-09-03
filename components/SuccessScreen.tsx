import { LinkButton } from "./Button";

const timeline = [
  { step: "01", title: "We review your request", body: "Our team reads through your requirements right away." },
  { step: "02", title: "Our team contacts you", body: "Expect a call or WhatsApp message within one business day." },
  { step: "03", title: "We confirm your meal details", body: "Once confirmed, your schedule takes care of itself." },
];

export default function SuccessScreen() {
  return (
    <div className="mx-auto max-w-xl animate-scale-in rounded-xl2 border border-sand bg-white p-8 text-center shadow-soft sm:p-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-cream">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-check"
          />
        </svg>
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold text-forest">We&apos;ve received your request!</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Thank you for your interest in TropicalBytes. Your request has been successfully submitted. Our team
        will review your details and contact you shortly to confirm the next steps.
      </p>

      <div className="mt-8 space-y-5 rounded-xl bg-palegreen p-6 text-left">
        <p className="text-xs font-semibold uppercase tracking-widest text-copper">What happens next?</p>
        <ol className="relative space-y-6 border-l border-forest/15 pl-6">
          {timeline.map((item) => (
            <li key={item.step} className="relative">
              <span className="absolute -left-[34px] top-0 grid h-6 w-6 place-items-center rounded-full bg-forest font-display text-[11px] font-semibold text-cream">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-forest">{item.title}</p>
              <p className="mt-0.5 text-sm text-ink/65">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <LinkButton href="/plans">Explore More Plans</LinkButton>
        <LinkButton href="/" variant="secondary">
          Back to Home
        </LinkButton>
      </div>
    </div>
  );
}
