"use client";

import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { formatINR } from "@/lib/config";
import type { ActionResult, PriceChange } from "@/lib/admin/shared";

// Small, dense building blocks for the admin panel: same tokens as the
// public site (forest/sand/cream/ink), tuned for data entry on a phone.

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-sand bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

type Tone = "primary" | "secondary" | "danger" | "ghost";
const tones: Record<Tone, string> = {
  primary: "bg-forest text-white hover:bg-forest-dark",
  secondary: "border border-sand bg-white text-ink hover:border-forest hover:text-forest",
  danger: "border border-danger/30 bg-white text-danger hover:bg-danger-light",
  ghost: "text-forest hover:bg-palegreen",
};
export function Btn({ tone = "primary", busy = false, children, className = "", disabled, ...rest }:
  { tone?: Tone; busy?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
      {...rest}
    >
      {busy && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Label({ text, hint, error, children, className = "" }:
  { text: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">{text}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-secondary">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

export function TextInput({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input py-2.5 ${className}`} {...rest} />;
}

/** Whole-rupee input with a ₹ prefix. Empty string = no value. */
export function RupeeInput({ value, onChange, className = "", ...rest }:
  { value: string; onChange: (v: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">₹</span>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        className="input py-2.5 pl-7 tabular-nums"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        {...rest}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm text-ink disabled:opacity-50"
    >
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-forest" : "bg-sand"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.125rem]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "yellow" | "red"; children: ReactNode }) {
  const t = {
    neutral: "bg-cream text-ink-secondary border-sand",
    green: "bg-palegreen text-forest border-forest/20",
    yellow: "bg-yellow-light text-ink border-yellow-dark/30",
    red: "bg-danger-light text-danger-dark border-danger/20",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function Status({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p role="status" className={`flex items-start gap-1.5 text-sm font-medium ${result.ok ? "text-forest" : "text-danger"}`}>
      {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
      {result.message}
    </p>
  );
}

/** Modal confirmation. Price changes are listed before → after, with a warning for big jumps. */
export function ConfirmDialog({ open, title, body, changes = [], confirmLabel = "Confirm", tone = "primary", busy, onConfirm, onCancel }: {
  open: boolean; title: string; body?: ReactNode; changes?: PriceChange[]; confirmLabel?: string;
  tone?: "primary" | "danger"; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const big = changes.filter((c) => c.big);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}
      className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-sand p-0 shadow-2xl backdrop:bg-ink/40"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button type="button" aria-label="Close" onClick={onCancel} disabled={busy} className="rounded-lg p-1 text-ink-secondary hover:bg-cream"><X size={18} /></button>
        </div>
        {body && <div className="mt-2 text-sm text-ink-secondary">{body}</div>}
        {changes.length > 0 && (
          <ul className="mt-4 divide-y divide-sand rounded-xl border border-sand">
            {changes.map((c) => (
              <li key={c.label} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="text-ink">{c.label}</span>
                <span className="tabular-nums">
                  <span className="text-ink-secondary line-through">{formatINR(c.before)}</span>
                  <span className="mx-1.5 text-ink-secondary">→</span>
                  <span className="font-semibold text-ink">{formatINR(c.after)}</span>
                  <span className={`ml-2 text-xs ${c.big ? "font-semibold text-danger" : "text-ink-secondary"}`}>
                    {c.ratio > 0 ? "+" : ""}{Math.round(c.ratio * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {big.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-yellow-light px-3 py-2 text-sm text-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-dark" />
            {big.length === 1 ? "This price changes" : `${big.length} prices change`} by more than 25%. Please double-check before saving.
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Btn tone="secondary" onClick={onCancel} disabled={busy}>Cancel</Btn>
          <Btn tone={tone} onClick={onConfirm} busy={busy}>{confirmLabel}</Btn>
        </div>
      </div>
    </dialog>
  );
}
