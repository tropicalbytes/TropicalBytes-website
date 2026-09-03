import Reveal from "@/components/Reveal";

export default function LegalPageHeader({
  eyebrow,
  title,
  effectiveDate,
  intro,
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  intro: string;
}) {
  return (
    <section className="bg-forest px-5 py-16 text-cream md:px-8">
      <div className="mx-auto max-w-content">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-copper-light">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-cream/60">Effective date: {effectiveDate}</p>
          <p className="mt-5 max-w-2xl text-cream/80">{intro}</p>
        </Reveal>
      </div>
    </section>
  );
}
