import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Party & Bulk Food Orders - TropicalBytes" },
  description:
    "Order generous party and bulk catering trays for events, celebrations, and gatherings in Udupi & Manipal. Freshly cooked veg and non-veg dishes by the kg.",
  alternates: {
    canonical: "https://tropicalbytes.in/party-request",
  },
};

export default function PartyRequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
