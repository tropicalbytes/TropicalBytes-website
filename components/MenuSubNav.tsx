"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "meal-plans", label: "Meal Plans" },
  { id: "salads", label: "Salads" },
  { id: "add-ons", label: "Add-ons" },
  { id: "party-bulk", label: "Party / Bulk Orders" },
];

export default function MenuSubNav() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[57px] z-40 border-b border-sand bg-cream/95 backdrop-blur">
      <nav className="mx-auto flex max-w-content gap-1 overflow-x-auto px-5 py-3 md:px-8">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              active === s.id ? "bg-forest text-cream" : "text-forest/70 hover:bg-sand/60"
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
