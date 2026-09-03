"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, business } from "@/lib/config";
import { LinkButton } from "./Button";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-cream/90 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "border-sand/70 shadow-[0_4px_20px_-8px_rgba(31,58,46,0.15)]" : "border-sand/0"
      }`}
    >
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/tropicalbytes-logo.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
            priority
          />
          <Image
            src="/brand/tropicalbytes-wordmark.png"
            alt={business.name}
            width={1126}
            height={286}
            className="h-6 w-auto sm:h-7"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={pathname === item.href}
              className={`nav-underline text-sm font-medium tracking-wide transition-colors ${
                pathname === item.href ? "text-forest" : "text-ink/70 hover:text-forest"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <LinkButton href="/plans" className="!px-5 !py-2.5 text-xs">
            Explore Meal Plans
          </LinkButton>
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-full border border-forest/20 transition-colors hover:bg-palegreen lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="#087A35"
              strokeWidth="2"
              strokeLinecap="round"
              className={`origin-center transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
              style={{ display: open ? "inline" : "none" }}
            />
            {!open && <path d="M4 7h16M4 12h16M4 17h16" stroke="#087A35" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      <div
        className="grid overflow-hidden border-t border-sand/60 bg-cream transition-[grid-template-rows] duration-300 ease-out lg:hidden"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", borderTopWidth: open ? 1 : 0 }}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-5 pb-5 pt-3">
            {nav.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                className={`rounded-lg px-3 py-3 text-base font-medium transition-all duration-200 ${
                  open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                } ${pathname === item.href ? "bg-palegreen text-forest" : "text-ink/75"}`}
              >
                {item.label}
              </Link>
            ))}
            <LinkButton href="/plans" className="mt-2 justify-center">
              Explore Meal Plans
            </LinkButton>
          </nav>
        </div>
      </div>
    </header>
  );
}
