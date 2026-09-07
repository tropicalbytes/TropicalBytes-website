import Link from "next/link";
import Image from "next/image";
import { Leaf, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[85vh] overflow-hidden bg-cream">
      {/* Scoped style for handwritten accent font */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
            .tb-handwriting {
              font-family: 'Caveat', cursive, sans-serif;
            }
          `,
        }}
      />

      {/* ================================================================= */}
      {/* 1. HERO 404 SECTION                                              */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-content px-5 pt-8 pb-10 sm:pt-12 sm:pb-14 md:px-8 lg:pt-16 lg:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          {/* Left / Content Column */}
          <div className="lg:col-span-6 xl:col-span-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF5E8] px-3.5 py-1.5 text-xs font-semibold text-forest shadow-xs">
              <Leaf size={14} className="shrink-0 text-forest" />
              <span>Oops! You&apos;re off track</span>
            </div>

            {/* Main Heading */}
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[58px]">
              Page <span className="text-forest">Not Found</span>
            </h1>

            {/* Yellow Accent Line */}
            <div className="mt-3.5 h-1 w-12 rounded-full bg-yellow" aria-hidden="true" />

            {/* Explanatory Text */}
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-secondary sm:text-lg">
              Looks like the page you&apos;re looking for
              <br className="hidden sm:inline" /> has been moved, deleted, or never existed.
            </p>

            {/* Handwritten Message */}
            <p className="tb-handwriting mt-5 text-2xl font-bold tracking-wide text-forest sm:text-3xl">
              Let&apos;s get you back to something delicious!
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {/* Go to Home (Primary) */}
              <Link
                href="/"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-forest px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-forest-dark hover:shadow-lg active:translate-y-0"
              >
                <Home size={18} strokeWidth={2.2} className="shrink-0" />
                <span>Go to Home</span>
              </Link>

              {/* Explore Meal Plans (Secondary) */}
              <Link
                href="/#our-plans"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-forest bg-white/70 px-6 py-3.5 text-sm font-semibold tracking-wide text-forest backdrop-blur-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-forest hover:text-white active:translate-y-0"
              >
                <span>Explore Meal Plans</span>
                <ArrowRight
                  size={16}
                  strokeWidth={2.2}
                  className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* Right / Illustration Column */}
          <div className="flex justify-center lg:col-span-6 lg:justify-end xl:col-span-5">
            <div className="relative w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[560px]">
              <Image
                src="/brand/custom404design.png"
                alt="TropicalBytes 404 - Page Not Found Signpost"
                width={720}
                height={640}
                priority
                className="h-auto w-full object-contain drop-shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. POPULAR PAGES SECTION                                          */}
      {/* ================================================================= */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-content px-5 md:px-8">
          {/* Header */}
          <div className="text-center">
            {/* Two-leaf sprout icon */}
            <div className="flex justify-center" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-forest">
                <path d="M12 21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M12 14C12 9 8 7 5 7C5 11 8 14 12 14Z"
                  fill="#18A84A"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12C12 7.5 16 5.5 19 5.5C19 9.5 16 12 12 12Z"
                  fill="#087A35"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">
              Popular Pages
            </h2>
            <p className="mt-2 text-sm text-ink-secondary sm:text-base">
              Here are some helpful links to get you back on track.
            </p>
          </div>

          {/* Navigation Cards Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Subscription Plans */}
            <Link
              href="/plans"
              className="group flex flex-col items-center rounded-2xl border border-[#D5EAD9]/60 bg-[#EEF7F0] p-7 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-forest/30 hover:shadow-[0_14px_30px_-10px_rgba(8,122,53,0.18)]"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#DCF1E2] text-forest transition-transform duration-300 ease-out group-hover:scale-105">
                {/* Cloche / Serving dish with plate */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-forest">
                  <path
                    d="M12 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                    fill="currentColor"
                  />
                  <path
                    d="M4.5 16.5c.5-5 3.5-8.5 7.5-8.5s7 3.5 7.5 8.5h-15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-ink sm:text-lg">
                Subscription Plans
              </h3>
              <p className="mt-1.5 text-xs text-ink-secondary sm:text-sm">
                Find the perfect plan for your needs.
              </p>

              <div className="mt-6 text-forest transition-transform duration-200 ease-out group-hover:translate-x-1">
                <ArrowRight size={18} strokeWidth={2.2} />
              </div>
            </Link>

            {/* Card 2: Individual Meal */}
            <Link
              href="/menu/request"
              className="group flex flex-col items-center rounded-2xl border border-[#F4EAC8]/60 bg-[#FCF7E5] p-7 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-yellow-dark/30 hover:shadow-[0_14px_30px_-10px_rgba(232,179,59,0.22)]"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F7EDCE] text-forest transition-transform duration-300 ease-out group-hover:scale-105">
                {/* Salad Bowl with leaves sprout */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-forest">
                  <path
                    d="M12 11C12 7.5 9.5 5.5 7 5.5C7 8.5 9.5 11 12 11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11C12 7.5 14.5 5.5 17 5.5C17 8.5 14.5 11 12 11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.5 12.5h15a.5.5 0 0 1 .5.5c0 4.2-3.5 7-8 7s-8-2.8-8-7a.5.5 0 0 1 .5-.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 20h7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-ink sm:text-lg">
                Individual Meal
              </h3>
              <p className="mt-1.5 text-xs text-ink-secondary sm:text-sm">
                Fresh and tasty meals made just for you.
              </p>

              <div className="mt-6 text-forest transition-transform duration-200 ease-out group-hover:translate-x-1">
                <ArrowRight size={18} strokeWidth={2.2} />
              </div>
            </Link>

            {/* Card 3: Party & Bulk */}
            <Link
              href="/party-request"
              className="group flex flex-col items-center rounded-2xl border border-[#D5EAD9]/60 bg-[#EEF7F0] p-7 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-forest/30 hover:shadow-[0_14px_30px_-10px_rgba(8,122,53,0.18)]"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#DCF1E2] text-forest transition-transform duration-300 ease-out group-hover:scale-105">
                {/* 3 People Group Icon */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-forest">
                  <circle cx="7" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M3 16.5c0-2.2 1.8-3.5 4-3.5.8 0 1.5.2 2 .5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="17" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M15 13.5c.5-.3 1.2-.5 2-.5 2.2 0 4 1.3 4 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="9.5" r="2.8" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M6.5 19c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-ink sm:text-lg">
                Party &amp; Bulk
              </h3>
              <p className="mt-1.5 text-xs text-ink-secondary sm:text-sm">
                Perfect for gatherings and events.
              </p>

              <div className="mt-6 text-forest transition-transform duration-200 ease-out group-hover:translate-x-1">
                <ArrowRight size={18} strokeWidth={2.2} />
              </div>
            </Link>

            {/* Card 4: Menu */}
            <Link
              href="/menu"
              className="group flex flex-col items-center rounded-2xl border border-[#F4EAC8]/60 bg-[#FCF7E5] p-7 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-yellow-dark/30 hover:shadow-[0_14px_30px_-10px_rgba(232,179,59,0.22)]"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F7EDCE] text-forest transition-transform duration-300 ease-out group-hover:scale-105">
                {/* Menu / Recipe document with lines */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-forest">
                  <rect
                    x="5.5"
                    y="3"
                    width="13"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 3v4.5l1.8-1.2L12.5 7.5V3"
                    fill="currentColor"
                    opacity="0.85"
                  />
                  <path
                    d="M9 11.5h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 14.8h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 18h3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-ink sm:text-lg">
                Menu
              </h3>
              <p className="mt-1.5 text-xs text-ink-secondary sm:text-sm">
                Explore a variety of healthy options.
              </p>

              <div className="mt-6 text-forest transition-transform duration-200 ease-out group-hover:translate-x-1">
                <ArrowRight size={18} strokeWidth={2.2} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. STILL NEED HELP? SECTION                                       */}
      {/* ================================================================= */}
      <section className="relative mt-6 overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-28">
        {/* Soft undulating landscape wave in the background matching reference */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex flex-col justify-end">
          <svg
            viewBox="0 0 1440 280"
            fill="none"
            preserveAspectRatio="none"
            className="h-full w-full text-[#EEF7EC]"
          >
            <path
              d="M0,70 C300,140 500,20 780,85 C1060,150 1280,60 1440,80 L1440,280 L0,280 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Botanical Leaves - Bottom Left */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 z-0 hidden sm:block md:left-4 lg:left-8"
          aria-hidden="true"
        >
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            className="text-forest"
          >
            {/* Main stem */}
            <path
              d="M10 180 C30 140 55 105 95 90"
              stroke="#087A35"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Bottom-most leaf */}
            <path
              d="M32 142 C18 135 12 118 20 106 C30 104 44 116 42 134 Z"
              fill="#2E9E52"
              opacity="0.9"
            />
            <path d="M26 122 C32 124 38 130 40 134" stroke="#087A35" strokeWidth="1.2" />
            {/* Middle left leaf */}
            <path
              d="M48 126 C40 106 50 90 64 94 C68 106 62 122 48 126 Z"
              fill="#18A84A"
              opacity="0.95"
            />
            {/* Middle right leaf */}
            <path
              d="M62 114 C70 95 88 88 98 96 C96 110 82 120 62 114 Z"
              fill="#087A35"
              opacity="0.95"
            />
            <path d="M72 108 C80 105 88 102 94 98" stroke="#075B2A" strokeWidth="1.2" />
            {/* Upper leaf */}
            <path
              d="M84 96 C98 75 118 70 128 80 C124 96 108 105 84 96 Z"
              fill="#2E9E52"
              opacity="0.9"
            />
            {/* Top crown leaf */}
            <path
              d="M95 90 C122 55 142 32 165 20 C158 45 135 75 95 90 Z"
              fill="#18A84A"
              opacity="0.95"
            />
            <path d="M110 74 C128 54 145 36 160 25" stroke="#087A35" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Botanical Leaves - Bottom Right */}
        <div
          className="pointer-events-none absolute right-0 bottom-0 z-0 hidden sm:block md:right-4 lg:right-8"
          aria-hidden="true"
        >
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            className="text-forest"
          >
            {/* Main stem */}
            <path
              d="M170 180 C150 140 125 105 85 90"
              stroke="#087A35"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Bottom-most leaf */}
            <path
              d="M148 142 C162 135 168 118 160 106 C150 104 136 116 138 134 Z"
              fill="#2E9E52"
              opacity="0.9"
            />
            <path d="M154 122 C148 124 142 130 140 134" stroke="#087A35" strokeWidth="1.2" />
            {/* Middle right leaf */}
            <path
              d="M132 126 C140 106 130 90 116 94 C112 106 118 122 132 126 Z"
              fill="#18A84A"
              opacity="0.95"
            />
            {/* Middle left leaf */}
            <path
              d="M118 114 C110 95 92 88 82 96 C84 110 98 120 118 114 Z"
              fill="#087A35"
              opacity="0.95"
            />
            <path d="M108 108 C100 105 92 102 86 98" stroke="#075B2A" strokeWidth="1.2" />
            {/* Upper leaf */}
            <path
              d="M96 96 C82 75 62 70 52 80 C56 96 72 105 96 96 Z"
              fill="#2E9E52"
              opacity="0.9"
            />
            {/* Top crown leaf */}
            <path
              d="M85 90 C58 55 38 32 15 20 C22 45 45 75 85 90 Z"
              fill="#18A84A"
              opacity="0.95"
            />
            <path d="M70 74 C52 54 35 36 20 25" stroke="#087A35" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Dot Matrix Pattern - Bottom Right (beside leaves) */}
        <div
          className="pointer-events-none absolute right-24 bottom-12 z-0 hidden lg:grid grid-cols-4 gap-2.5 opacity-35"
          aria-hidden="true"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-forest" />
          ))}
        </div>

        {/* Central Content */}
        <div className="relative z-10 mx-auto max-w-content px-5 text-center md:px-8">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
            Still need help?
          </h2>
          <p className="mt-2 text-sm text-ink-secondary sm:text-base">
            Feel free to contact us. We&apos;re here for you!
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-forest bg-white px-8 py-3 text-sm font-semibold tracking-wide text-forest shadow-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-forest hover:text-white active:translate-y-0"
            >
              <span>Contact Us</span>
              <ArrowRight
                size={16}
                strokeWidth={2.2}
                className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
