"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "./Button";

/**
 * Fixed bottom CTA shown only on mobile, only once the user has scrolled
 * past the hero — keeps the primary conversion action within thumb reach
 * without competing with the hero's own CTAs.
 */
export default function StickyMobileCta({ label, href }: { label: string; href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream/95 p-3 backdrop-blur transition-transform duration-300 ease-out md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <LinkButton href={href} withArrow className="w-full">
        {label}
      </LinkButton>
    </div>
  );
}
