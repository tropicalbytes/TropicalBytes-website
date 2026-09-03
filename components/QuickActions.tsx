import { business } from "@/lib/config";

export default function QuickActions() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href={`https://wa.me/${business.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="grid h-13 w-13 h-13 place-items-center rounded-full bg-forest text-cream shadow-soft transition-transform hover:scale-105"
        style={{ width: 52, height: 52 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 12a8 8 0 1 1-3.6-6.66L20 4l-1.2 3.9A7.96 7.96 0 0 1 20 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M9 10c.3 2 2 3.7 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </a>
      <a
        href={`tel:${business.phone.replace(/\s/g, "")}`}
        aria-label="Call us"
        className="grid place-items-center rounded-full bg-copper text-cream shadow-soft transition-transform hover:scale-105"
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
