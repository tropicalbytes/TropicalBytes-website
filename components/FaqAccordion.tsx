"use client";

import { useState } from "react";

export default function FaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-sand rounded-xl2 border border-sand bg-white shadow-soft">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-sand/30"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <span className="font-display text-base font-semibold text-forest">{item.question}</span>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-forest/20 text-forest transition-transform duration-300 ease-out ${
                  isOpen ? "rotate-45 border-copper text-copper" : ""
                }`}
              >
                +
              </span>
            </button>
            <div className={`accordion-panel ${isOpen ? "is-open" : ""}`}>
              <div>
                <p className="px-6 pb-5 text-sm leading-relaxed text-ink/70 text-justify">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
