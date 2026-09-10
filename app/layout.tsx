import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickActions from "@/components/QuickActions";
import { business } from "@/lib/config";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tropicalbytes.in"),
  title: {
    default: "TropicalBytes - Fresh Meal Subscriptions & Delivery in Udupi",
    template: `%s - ${business.name}`,
  },
  description: business.description,
  alternates: {
    canonical: "https://tropicalbytes.in",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "TropicalBytes - Fresh Meal Subscriptions & Delivery in Udupi",
    description: business.description,
    url: "https://tropicalbytes.in",
    siteName: business.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand/hero-reference.png",
        width: 1200,
        height: 800,
        alt: "TropicalBytes - Fresh Meal Subscriptions in Udupi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TropicalBytes - Fresh Meal Subscriptions & Delivery in Udupi",
    description: business.description,
    images: ["/brand/hero-reference.png"],
  },
  robots: { index: true, follow: true },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: business.name,
  description: business.description,
  url: "https://tropicalbytes.in",
  telephone: business.phone,
  email: business.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Court Road",
    addressLocality: "Udupi",
    addressRegion: "Karnataka",
    postalCode: "576101",
    addressCountry: "IN",
  },
  areaServed: business.serviceAreas.map((area) => ({
    "@type": "City",
    name: area,
  })),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  ],
  sameAs: [business.social.instagram],
  image: "https://tropicalbytes.in/brand/hero-reference.png",
  logo: "https://tropicalbytes.in/brand/tropicalbytes-logo.png",
  priceRange: "₹₹",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <QuickActions />
      </body>
    </html>
  );
}
