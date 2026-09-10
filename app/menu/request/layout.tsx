import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Individual Meal Order - TropicalBytes" },
  description:
    "Order fresh, chef-prepared individual meals on demand with no subscription required. Delicious veg, non-veg, and dessert options in Udupi & Manipal.",
  alternates: {
    canonical: "https://tropicalbytes.in/menu/request",
  },
};

export default function IndividualMealLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
