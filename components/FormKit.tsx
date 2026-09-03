"use client";

import { useRef } from "react";
import { LucideIcon } from "lucide-react";
import { DatePicker } from "./DatePicker";

/**
 * Shared form UI building blocks — extracted from the Individual Meal
 * page's form (the established design reference) so every form on the
 * site (Individual Meal, Subscription wizard, Party & Bulk, Contact)
 * renders identical cards, section headers, labeled fields, icon-adorned
 * inputs, and selection pills. Purely presentational — no state or
 * validation logic lives here.
 */

/** Small icon-circle + bold title + short yellow underline — used at the top of each form card/section. */
export function CardHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-palegreen text-forest">
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <p className="font-display text-lg font-bold text-ink">{title}</p>
      </div>
      <span className="mt-3 block h-1 w-10 rounded-full bg-yellow" aria-hidden="true" />
    </div>
  );
}

/** A text input with a small contextual icon on the left. */
export function IconInput({
  icon: Icon,
  value,
  onChange,
  className = "",
  type,
  onKeyDown,
  ...rest
}: {
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  const isDateEmpty = type === "date" && !value;
  const isDeletingRef = useRef(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      isDeletingRef.current = true;
    } else {
      isDeletingRef.current = false;
    }
    if (onKeyDown) onKeyDown(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (type === "date" && value && newVal && !isDeletingRef.current) {
      const prevParts = value.split("-");
      const newParts = newVal.split("-");
      if (prevParts.length === 3 && newParts.length === 3) {
        const prevYear = prevParts[0];
        const newYear = newParts[0];
        const prevYearNum = parseInt(prevYear, 10);
        // If previous year was already a full 4-digit completed year (>= 1000 and not starting with 0),
        // and user types a 5th digit causing the browser to restart the year segment (newYear starting with "000"),
        // ignore the 5th digit so the 4-digit year is retained.
        const isPrevFullYear = prevYear.length === 4 && prevYearNum >= 1000 && !prevYear.startsWith("0");
        const isNewRestartedYear = newYear.startsWith("000") && newYear !== "0000";
        if (isPrevFullYear && isNewRestartedYear && prevParts[1] === newParts[1] && prevParts[2] === newParts[2]) {
          return;
        }
      }
    }
    onChange(newVal);
  };

  if (type === "date") {
    return (
      <DatePicker
        value={value}
        onChange={onChange}
        min={rest.min as string}
        max={rest.max as string}
        className={className}
        disabled={rest.disabled}
        placeholder={rest.placeholder}
      />
    );
  }

  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary" />
      <input
        type={type}
        className={`input pl-10 ${isDateEmpty ? "text-gray-400" : ""} ${className}`.trim()}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    </div>
  );
}

/** A textarea with a small contextual icon in the top-left corner. */
export function IconTextarea({
  icon: Icon,
  className = "",
  ...rest
}: {
  icon: LucideIcon;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-ink-secondary" />
      <textarea className={`input pl-10 ${className}`} {...rest} />
    </div>
  );
}

/** Label + input/children + optional error message, in the standard form-field layout. */
export function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-forest">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>}
    </div>
  );
}

/** A pill-shaped selectable option (meal time, food type, etc.), with a checkmark when selected. */
export function SelectPill({
  label,
  selected,
  onSelect,
  className = "",
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
        selected ? "border-forest bg-forest text-cream shadow-soft" : "border-sand bg-white text-forest"
      } ${className}`}
    >
      {selected && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

/** The standard white form card: rounded corners, hairline border, soft shadow, comfortable padding. */
export const FORM_CARD_CLASS = "rounded-xl2 border border-sand bg-white p-6 shadow-soft sm:p-7";
