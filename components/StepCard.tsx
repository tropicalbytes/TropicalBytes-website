export default function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-xl2 border border-sand bg-white p-7 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_45px_-18px_rgba(31,58,46,0.3)]">
      <span className="font-display text-4xl font-semibold text-sand transition-colors duration-300 group-hover:text-copper/30">
        {step}
      </span>
      <p className="mt-3 font-display text-xl font-semibold text-forest">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{description}</p>
    </div>
  );
}
