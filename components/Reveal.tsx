"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

/**
 * Lightweight scroll-reveal wrapper. Adds data-reveal / data-reveal="true"
 * attributes that app/globals.css animates with transform + opacity only —
 * no animation library, and prefers-reduced-motion is respected globally.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Comp = Tag as "div";

  return (
    <Comp
      ref={ref}
      data-reveal
      data-revealed={visible ? "true" : "false"}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={className}
    >
      {children}
    </Comp>
  );
}
