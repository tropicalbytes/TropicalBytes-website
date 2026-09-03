import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Adds a small arrow that nudges right on hover — for primary CTAs. */
  withArrow?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-forest text-cream hover:bg-forest-dark shadow-soft hover:shadow-lg",
  secondary:
    "bg-transparent border border-forest text-forest hover:bg-forest hover:text-cream",
  ghost: "bg-transparent text-forest hover:underline underline-offset-4",
};

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100";

function Arrow() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 transition-transform duration-200 ease-out group-hover/btn:translate-x-1"
    >
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
  withArrow = false,
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={`${base} ${variantClasses[variant]} ${className}`}>
      {children}
      {withArrow && <Arrow />}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  withArrow = false,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variantClasses[variant]} ${className}`} {...rest}>
      {children}
      {withArrow && <Arrow />}
    </button>
  );
}
