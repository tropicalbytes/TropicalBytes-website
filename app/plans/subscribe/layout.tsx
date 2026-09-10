import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Subscribe to a Meal Plan - TropicalBytes" },
  description:
    "Set up your TropicalBytes daily meal subscription. Choose your plan tier, veg or non-veg preferences, and delivery schedule in Udupi & Manipal.",
  alternates: {
    canonical: "https://tropicalbytes.in/plans/subscribe",
  },
};

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
