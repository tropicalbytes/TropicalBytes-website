import Link from "next/link";
import { Home } from "lucide-react";
import { business } from "@/lib/config";

export default function QuickActions() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <Link
        href="/"
        aria-label="Home"
        className="grid place-items-center rounded-full bg-forest-dark text-cream shadow-soft transition-transform hover:scale-105"
        style={{ width: 52, height: 52 }}
      >
        <Home size={22} strokeWidth={1.8} />
      </Link>
      <a
        href={`https://wa.me/${business.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="grid place-items-center rounded-full bg-forest text-cream shadow-soft transition-transform hover:scale-105"
        style={{ width: 52, height: 52 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.32 4.54 17.88 6.1C19.44 7.66 20.3 9.72 20.3 11.92C20.3 16.46 16.6 20.15 12.05 20.15ZM16.57 14.39C16.32 14.26 15.1 13.66 14.87 13.58C14.64 13.5 14.48 13.46 14.31 13.71C14.15 13.96 13.66 14.53 13.51 14.7C13.37 14.86 13.22 14.88 12.97 14.76C12.72 14.63 11.92 14.37 10.97 13.52C10.23 12.86 9.73 12.05 9.58 11.8C9.44 11.55 9.57 11.41 9.69 11.29C9.8 11.18 9.94 11 10.06 10.86C10.19 10.71 10.23 10.61 10.31 10.45C10.39 10.28 10.35 10.14 10.29 10.01C10.23 9.89 9.73 8.67 9.53 8.17C9.33 7.68 9.13 7.75 8.97 7.74C8.83 7.73 8.66 7.73 8.5 7.73C8.33 7.73 8.07 7.79 7.84 8.04C7.62 8.28 7 8.86 7 10.04C7 11.21 7.86 12.35 7.98 12.51C8.1 12.67 9.67 15.1 12.08 16.14C12.66 16.39 13.1 16.53 13.45 16.64C14.03 16.83 14.56 16.8 14.98 16.74C15.45 16.67 16.42 16.15 16.63 15.58C16.83 15 16.83 14.51 16.77 14.39C16.71 14.31 16.57 14.26 16.57 14.39Z" />
        </svg>
      </a>
      <a
        href={`tel:${business.phone.replace(/\s/g, "")}`}
        aria-label="Call us"
        className="grid place-items-center rounded-full bg-forest-light text-cream shadow-soft transition-transform hover:scale-105"
        style={{ width: 52, height: 52 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5c0 8 7 15 15 15l3-3-5-3-2 2c-2-1-4-3-5-5l2-2-3-5-3 1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
}
