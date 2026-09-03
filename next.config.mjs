/** @type {import('next').NextConfig} */

// Content-Security-Policy — Phase 1 (deliberately not maximally strict yet).
// Allows: Next.js's own hydration scripts/styles, Google Fonts, the Google
// Maps embed on the Contact page, picsum.photos / images.unsplash.com
// placeholder photography, and the Google Apps Script Web App the forms
// submit to. wa.me / tel: links are plain <a> hrefs (browser-navigated),
// not fetched resources, so they don't need a CSP entry.
//
// 'unsafe-inline' and 'unsafe-eval' on script-src are still present because
// Next.js's App Router injects inline hydration scripts that a strict CSP
// without a per-request nonce would block. Tightening this to a nonce-based
// policy is the recommended next step (see google-apps-script/README.md's
// security notes) but requires wiring a nonce through middleware — left as
// a deliberate Phase 2 item rather than shipping a CSP that breaks the site.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://picsum.photos https://images.unsplash.com https://images.pexels.com;
  frame-src https://www.google.com;
  connect-src 'self' https://script.google.com https://script.googleusercontent.com;
  form-action 'self' https://script.google.com;
  base-uri 'self';
  frame-ancestors 'self';
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Restricted to the external hosts the site actually uses for
    // placeholder photography. Swap to local /public files and this
    // can be trimmed further — see README's Images section.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
