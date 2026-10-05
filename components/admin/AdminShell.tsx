"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarClock, ExternalLink, FileText, History, LayoutDashboard, LogOut, Menu, PartyPopper, Settings, Tag, UserRound, UtensilsCrossed, X } from "lucide-react";
import { signOut } from "@/app/admin/auth-actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/plans", label: "Plans & Pricing", icon: CalendarClock },
  { href: "/admin/menu-items", label: "Menu Items", icon: UtensilsCrossed },
  { href: "/admin/party", label: "Party & Bulk", icon: PartyPopper },
  { href: "/admin/offers", label: "Offers", icon: Tag },
  { href: "/admin/menu-pdf", label: "Menu PDF", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/activity", label: "Activity", icon: History },
  { href: "/admin/account", label: "Account", icon: UserRound },
];

export default function AdminShell({ email, banner, children }: { email: string; banner?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(href) ? "bg-forest text-white" : "text-ink hover:bg-palegreen hover:text-forest"
          }`}
        >
          <Icon size={18} strokeWidth={1.9} />
          {label}
        </Link>
      ))}
    </nav>
  );
  const footer = (
    <div className="space-y-2 border-t border-sand pt-4">
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 text-sm text-ink-secondary hover:text-forest">
        <ExternalLink size={15} /> View website
      </a>
      <Link href="/admin/account" className="block truncate px-3 text-xs text-ink-secondary hover:text-forest" title={`${email}: account settings`}>{email}</Link>
      <form action={signOut}>
        <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light">
          <LogOut size={16} /> Sign out
        </button>
      </form>
    </div>
  );
  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <Image src="/brand/tropicalbytes-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
      <span className="font-display text-base font-bold text-ink">TropicalBytes <span className="text-forest">Admin</span></span>
    </Link>
  );

  return (
    <div className="lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-sand bg-white p-4 lg:flex">
        <div className="space-y-6">{brand}{nav}</div>
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sand bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {brand}
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-xl p-2 text-ink hover:bg-cream">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[61px] z-30 overflow-y-auto bg-white p-4 lg:hidden">
          <div className="space-y-6">{nav}{footer}</div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-5xl">
          {banner}
          {children}
        </div>
      </main>
    </div>
  );
}
