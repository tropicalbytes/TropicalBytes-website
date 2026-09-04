"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MenuOptionGroup } from "@/lib/config";

interface MultiSelectComboboxProps {
  label: string;
  placeholder?: string;
  groups: MenuOptionGroup[];
  selected: string[];
  onChange: (ids: string[]) => void;
  helperText?: string;
  showQuantities?: boolean;
  quantities?: Record<string, number>;
  onIncrease?: (id: string) => void;
  onDecrease?: (id: string) => void;
}

/**
 * Premium searchable multi-select — replaces native <select multiple> and
 * dropdown menus everywhere the menu is large. Supports search, grouped
 * checkboxes, selected-item chips, remove/clear-all, and keyboard use
 * (Escape to close, Tab through checkboxes, Enter/Space to toggle).
 */
export default function MultiSelectCombobox({
  label,
  placeholder = "Search menu...",
  groups,
  selected,
  onChange,
  helperText,
  showQuantities = false,
  quantities = {},
  onIncrease,
  onDecrease,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const selectedOptions = useMemo(
    () => selected.map((id) => allOptions.find((o) => o.id === id)).filter(Boolean) as typeof allOptions,
    [selected, allOptions]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups.filter((g) => g.options.length > 0);
    return groups
      .map((g) => ({ ...g, options: g.options.filter((o) => o.label.toLowerCase().includes(q)) }))
      .filter((g) => g.options.length > 0);
  }, [groups, query]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const remove = (id: string) => onChange(selected.filter((s) => s !== id));
  const clearAll = () => {
    const groupOptionIds = new Set(allOptions.map((o) => o.id));
    onChange(selected.filter((id) => !groupOptionIds.has(id)));
  };

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1.5 block text-sm font-medium text-forest">{label}</span>

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input flex min-h-[48px] w-full flex-wrap items-center gap-1.5 text-left ${open ? "border-copper ring-2 ring-copper/20" : ""
          }`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-ink/45">{placeholder}</span>
        ) : (
          selectedOptions.map((o) => {
            const qty = showQuantities ? (quantities[o.id] ?? 1) : null;
            return (
              <span
                key={o.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-2.5 py-1 text-xs font-medium text-cream"
              >
                <span>
                  {o.label}
                  {showQuantities && qty !== null && (
                    <span className="ml-1 font-bold text-yellow">× {qty}</span>
                  )}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(o.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      remove(o.id);
                    }
                  }}
                  aria-label={`Remove ${o.label}`}
                  className="grid h-3.5 w-3.5 place-items-center rounded-full text-cream/70 hover:text-cream cursor-pointer"
                >
                  ×
                </span>
              </span>
            );
          })
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`ml-auto shrink-0 text-forest/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {selectedOptions.length > 0 && (
        <button type="button" onClick={clearAll} className="mt-1.5 text-xs font-medium text-copper-dark hover:underline">
          Clear all ({selectedOptions.length})
        </button>
      )}
      {helperText && !open && <p className="mt-1.5 text-xs text-ink/50">{helperText}</p>}

      <div
        className="accordion-panel z-30"
        style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.25s ease-out" }}
      >
        <div className="overflow-hidden">
          <div className="mt-2 rounded-xl2 border border-sand bg-white p-3 shadow-[0_20px_45px_-15px_rgba(31,58,46,0.35)]">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="input !py-2 !pl-10"
              />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-forest/40">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            <div className="mt-2 max-h-64 overflow-y-auto pr-1">
              {filteredGroups.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-ink/50">No matches. Try a different search.</p>
              ) : (
                filteredGroups.map((g) => (
                  <div key={g.group} className="py-1.5">
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-copper">{g.group}</p>
                    {g.options.map((o) => {
                      const checked = selected.includes(o.id);
                      const qty = showQuantities ? (quantities[o.id] ?? 1) : 1;
                      return (
                        <label
                          key={o.id}
                          className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-sand/50"
                        >
                          <span className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(o.id)}
                              className="h-4 w-4 shrink-0 rounded border-sand text-forest accent-forest"
                            />
                            <span className="text-ink/85 leading-snug">{o.label}</span>
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {o.meta && <span className="text-xs font-medium text-copper">{o.meta}</span>}
                            {showQuantities && checked && (
                              <div
                                className="inline-flex items-center rounded-lg border border-sand bg-sand/40 p-0.5"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <button
                                  type="button"
                                  aria-label={`Decrease ${o.label} quantity`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDecrease?.(o.id);
                                  }}
                                  className="grid h-6 w-6 place-items-center rounded-md bg-white text-xs font-bold text-forest shadow-xs hover:bg-forest hover:text-cream transition-colors active:scale-95"
                                >
                                  −
                                </button>
                                <span className="min-w-[20px] text-center text-xs font-bold text-forest select-none">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase ${o.label} quantity`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onIncrease?.(o.id);
                                  }}
                                  className="grid h-6 w-6 place-items-center rounded-md bg-white text-xs font-bold text-forest shadow-xs hover:bg-forest hover:text-cream transition-colors active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
