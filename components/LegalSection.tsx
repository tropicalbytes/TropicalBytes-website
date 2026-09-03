import { ReactNode } from "react";

export default function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={`section-${number}`} className="scroll-mt-24 border-b border-sand py-8 first:pt-0 last:border-0">
      <h2 className="font-display text-xl font-semibold text-forest sm:text-2xl">
        <span className="mr-2 text-copper">{number}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/75 sm:text-[15px] text-justify">{children}</div>
    </section>
  );
}
