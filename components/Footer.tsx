import Link from "next/link";
import Image from "next/image";
import { business, nav } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-forest-dark text-cream/90">
      <div className="mx-auto grid max-w-content gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white p-1">
              <Image src="/brand/tropicalbytes-logo.png" alt="" aria-hidden="true" width={36} height={36} className="h-full w-full" />
            </span>
            <Image
              src="/brand/tropicalbytes-wordmark-white.png"
              alt={business.name}
              width={1126}
              height={286}
              className="h-7 w-auto sm:h-8"
            />
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70 text-justify">
            {business.description}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={business.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full bg-cream/10 text-cream/80 transition-colors hover:bg-yellow hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-copper-light">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-cream/75 hover:text-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-copper-light">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/75">
            <li>{business.phoneDisplay}</li>
            <li>{business.email}</li>
            <li>{business.address}</li>
            <li>{business.hours}</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-copper-light">Service Areas</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/75">
            {business.serviceAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-3 text-center text-xs text-cream/50 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-cream/80">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-cream/80">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
