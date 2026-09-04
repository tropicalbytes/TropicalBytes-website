// ============================================================================
// CENTRAL BUSINESS CONFIGURATION
// Update this file to change brand details, contact info, menu, and pricing
// across the entire site without touching page code.
//
// MENU + PRICING DATA SOURCE OF TRUTH: the client-approved
// "Tropicalbytes Meal plan.pdf" (approved redesign brief). Subscription
// tiers, individual meal items, and party/bulk items + prices below are
// transcribed exactly as given in that PDF, including obvious typos
// corrected per the client's explicit instruction (e.g. "Panner" ->
// "Paneer", "Salald" -> "Salad") and any pricing that doesn't reduce to a
// clean formula (the client confirmed: do not mathematically "correct"
// approved prices).
// ============================================================================

export const business = {
  name: "TropicalBytes",
  tagline: "Fresh Meal Delivered Everyday",
  description:
    "TropicalBytes delivers fresh, chef-prepared meals on a schedule that fits your routine: flexible plans, honest ingredients, no surprises.",
  phone: "+91 8792029951",
  phoneDisplay: "+91 8792029951",
  whatsapp: "918792029951", // digits only, with country code, for wa.me links
  email: "tropicalbytes.in@gmail.com",
  address: "Court Road, Udupi, Karnataka 576101",
  serviceAreas: ["Udupi", "Manipal"],
  hours: "Mon – Sat, 9:00 AM – 7:00 PM",
  social: {
    instagram: "https://www.instagram.com/tropicalcaterers12_2026",
  },
};

// Primary navigation — the four commercial areas plus Home, Menu, and
// Contact. How It Works is no longer a standalone page/nav item — it
// lives only as a homepage section (see id="how-it-works" on Home).
// About remains live (kept per instruction) but sits in the footer.
export const nav = [
  { label: "Home", href: "/" },
  { label: "Subscription Plans", href: "/plans" },
  { label: "Individual Meal", href: "/menu/request" },
  { label: "Party & Bulk", href: "/party-request" },
  { label: "Subscription Menu", href: "/menu" },
  { label: "Contact", href: "/contact" },
];

// Secondary links — kept live per client instruction, shown in the footer.
export const secondaryNav = [{ label: "About", href: "/about" }];

// Decorative placeholder imagery for the homepage hero and About page banner.
export const placeholderImages = {
  homeHero: "https://images.pexels.com/photos/18601877/pexels-photo-18601877.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1150&fit=crop",
  aboutBanner: "https://images.pexels.com/photos/5677717/pexels-photo-5677717.jpeg?auto=compress&cs=tinysrgb&w=1600&h=700&fit=crop",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export type FoodType = "Veg" | "Non-Veg";
export type MealTime = "Lunch" | "Dinner" | "Lunch & Dinner";

// ----------------------------------------------------------------------------
// SUBSCRIPTION MEAL PLANS — four fixed tiers, each with 4 priced options
// (Veg/Non-Veg × 1 Meal/2 Meals). Prices are flat, client-approved figures
// from the PDF, not derived from any per-meal formula — several tiers are
// not internally "clean" math (e.g. Monthly 2-Meal-Veg is cheaper than
// 1-Meal-Veg) and are preserved exactly as approved.
// ----------------------------------------------------------------------------

export interface SubscriptionTier {
  id: string;
  name: string;
  durationLabel: string;
  tagline: string;
}

export const subscriptionTiers: SubscriptionTier[] = [
  { id: "trial", name: "3 Day Trial", durationLabel: "3 Days", tagline: "Perfect for trying our meals" },
  { id: "weekly", name: "Weekly Plan", durationLabel: "6 Days", tagline: "Most popular choice" },
  { id: "monthly", name: "Monthly Plan", durationLabel: "24 Days", tagline: "Best value" },
  { id: "salad", name: "Salad Plan", durationLabel: "6 Days", tagline: "Fresh & healthy" },
];

export interface SubscriptionPlanOption {
  id: string;
  tierId: string;
  foodType: FoodType;
  mealCount: 1 | 2;
  totalPrice: number;
  perMealPrice: number;
  deliveryLabel: string;
}

export const subscriptionPlanOptions: SubscriptionPlanOption[] = [
  // 3 Day Trial
  { id: "trial-veg-1", tierId: "trial", foodType: "Veg", mealCount: 1, totalPrice: 750, perMealPrice: 250, deliveryLabel: "1 time delivery. 3 days" },
  { id: "trial-veg-2", tierId: "trial", foodType: "Veg", mealCount: 2, totalPrice: 1440, perMealPrice: 240, deliveryLabel: "2 time delivery. 3 days" },
  { id: "trial-nonveg-1", tierId: "trial", foodType: "Non-Veg", mealCount: 1, totalPrice: 825, perMealPrice: 275, deliveryLabel: "1 time delivery. 3 days" },
  { id: "trial-nonveg-2", tierId: "trial", foodType: "Non-Veg", mealCount: 2, totalPrice: 1500, perMealPrice: 250, deliveryLabel: "2 time delivery. 3 days" },
  // Weekly Plan
  { id: "weekly-veg-1", tierId: "weekly", foodType: "Veg", mealCount: 1, totalPrice: 1350, perMealPrice: 225, deliveryLabel: "1 time delivery. 6 days" },
  { id: "weekly-veg-2", tierId: "weekly", foodType: "Veg", mealCount: 2, totalPrice: 2520, perMealPrice: 210, deliveryLabel: "2 time delivery. 6 days" },
  { id: "weekly-nonveg-1", tierId: "weekly", foodType: "Non-Veg", mealCount: 1, totalPrice: 1440, perMealPrice: 240, deliveryLabel: "1 time delivery. 6 days" },
  { id: "weekly-nonveg-2", tierId: "weekly", foodType: "Non-Veg", mealCount: 2, totalPrice: 2700, perMealPrice: 225, deliveryLabel: "2 time delivery. 6 days" },
  // Monthly Plan
  { id: "monthly-veg-1", tierId: "monthly", foodType: "Veg", mealCount: 1, totalPrice: 4800, perMealPrice: 200, deliveryLabel: "1 time delivery. 24 days" },
  { id: "monthly-veg-2", tierId: "monthly", foodType: "Veg", mealCount: 2, totalPrice: 4560, perMealPrice: 190, deliveryLabel: "2 time delivery. 24 days" },
  { id: "monthly-nonveg-1", tierId: "monthly", foodType: "Non-Veg", mealCount: 1, totalPrice: 5040, perMealPrice: 210, deliveryLabel: "1 time delivery. 24 days" },
  { id: "monthly-nonveg-2", tierId: "monthly", foodType: "Non-Veg", mealCount: 2, totalPrice: 9600, perMealPrice: 200, deliveryLabel: "2 time delivery. 24 days" },
  // Salad Plan
  { id: "salad-veg-1", tierId: "salad", foodType: "Veg", mealCount: 1, totalPrice: 1350, perMealPrice: 225, deliveryLabel: "1 time delivery. 6 days" },
  { id: "salad-veg-2", tierId: "salad", foodType: "Veg", mealCount: 2, totalPrice: 2520, perMealPrice: 210, deliveryLabel: "2 time delivery. 6 days" },
  { id: "salad-nonveg-1", tierId: "salad", foodType: "Non-Veg", mealCount: 1, totalPrice: 1440, perMealPrice: 240, deliveryLabel: "1 time delivery. 6 days" },
  { id: "salad-nonveg-2", tierId: "salad", foodType: "Non-Veg", mealCount: 2, totalPrice: 2700, perMealPrice: 225, deliveryLabel: "2 time delivery. 6 days" },
];

export function findPlanOption(tierId: string, foodType: FoodType, mealCount: 1 | 2): SubscriptionPlanOption | undefined {
  return subscriptionPlanOptions.find((p) => p.tierId === tierId && p.foodType === foodType && p.mealCount === mealCount);
}

export function planOptionsForTier(tierId: string): SubscriptionPlanOption[] {
  return subscriptionPlanOptions.filter((p) => p.tierId === tierId);
}

// ----------------------------------------------------------------------------
// INDIVIDUAL MEAL MENU — Veg Meals / Non-Veg Meals / Desserts, exact names
// and prices from the approved PDF. Obvious source typos corrected per the
// client's explicit instruction ("Grilled Panner Salad" -> "Grilled Paneer
// Salad", "BBQ Chicken Salald" -> "BBQ Chicken Salad").
// ----------------------------------------------------------------------------

export interface MenuItem {
  name: string;
  price: number;
  /** True for vegetarian, false for non-vegetarian — per the approved PDF's own veg/non-veg markers on each item (including desserts). */
  vegetarian: boolean;
}

export const individualMenu = {
  veg: [
    { name: "Alfredo Penne Pasta Veg", price: 300, vegetarian: true },
    { name: "Cilantro Penne Pasta Veg", price: 300, vegetarian: true },
    { name: "Basil Penne Pasta Veg", price: 300, vegetarian: true },
    { name: "Chilli Paneer with Rice Combo", price: 300, vegetarian: true },
    { name: "Chilli Paneer with Noodles Combo", price: 300, vegetarian: true },
    { name: "Chilli Mushroom with Rice Combo", price: 280, vegetarian: true },
    { name: "Chilli Mushroom with Noodles Combo", price: 280, vegetarian: true },
    { name: "Grilled Paneer Salad", price: 275, vegetarian: true },
    { name: "Caesar Salad Veg", price: 275, vegetarian: true },
    { name: "Asian Salad Veg", price: 275, vegetarian: true },
    { name: "Tropical Salad Veg", price: 275, vegetarian: true },
    { name: "BBQ Salad Veg", price: 275, vegetarian: true },
    { name: "Paneer Tikka with Ghee Rice", price: 300, vegetarian: true },
    { name: "Thai Green Curry with Rice Veg", price: 300, vegetarian: true },
    { name: "Paneer Butter Masala with Roti", price: 300, vegetarian: true },
    { name: "Veg Biriyani", price: 250, vegetarian: true },
    { name: "Stroganoff Paneer with Rice", price: 300, vegetarian: true },
    { name: "Veg Kurma with Roti", price: 275, vegetarian: true },
  ] as MenuItem[],
  nonVeg: [
    { name: "Alfredo Penne Pasta Chicken", price: 325, vegetarian: false },
    { name: "Cilantro Penne Pasta Chicken", price: 325, vegetarian: false },
    { name: "Basil Penne Pasta Chicken", price: 325, vegetarian: false },
    { name: "Chilli Chicken with Rice Combo", price: 325, vegetarian: false },
    { name: "Chilli Chicken with Noodles Combo", price: 325, vegetarian: false },
    { name: "Asian Salad Chicken", price: 300, vegetarian: false },
    { name: "Tropical Chicken Salad", price: 280, vegetarian: false },
    { name: "Grilled Chicken Salad", price: 300, vegetarian: false },
    { name: "Caesar Salad Chicken", price: 300, vegetarian: false },
    { name: "BBQ Chicken Salad", price: 300, vegetarian: false },
    { name: "Tandoori Chicken Salad", price: 325, vegetarian: false },
    { name: "Chicken Kebab with Ghee Rice", price: 325, vegetarian: false },
    { name: "Butter Chicken with Roti", price: 325, vegetarian: false },
    { name: "Stroganoff Chicken with Rice", price: 325, vegetarian: false },
    { name: "Thai Green Curry Chicken with Rice", price: 325, vegetarian: false },
    { name: "Chicken Kurma with Roti", price: 325, vegetarian: false },
    { name: "Chicken 65 with Rice", price: 325, vegetarian: false },
    { name: "Chicken Biriyani", price: 300, vegetarian: false },
  ] as MenuItem[],
  desserts: [
    { name: "San Sebastian Cheese Cake", price: 350, vegetarian: false },
    { name: "Tiramisu", price: 300, vegetarian: false },
    { name: "Brownie with Chocolate Sauce & Nuts", price: 250, vegetarian: false },
    { name: "Tropical Gudbad", price: 300, vegetarian: true },
    { name: "Arabian Gudbad", price: 300, vegetarian: true },
    { name: "Death By Chocolate", price: 300, vegetarian: true },
  ] as MenuItem[],
};

// ----------------------------------------------------------------------------
// PARTY / BULK ORDERS — Veg / Non-Veg priced per kg (exact PDF figures),
// plus Desserts priced per piece (reusing the individual dessert menu —
// the source PDF pages didn't include separate bulk/kg dessert pricing, so
// these are offered at their individual per-piece price; confirm with the
// client whether a bulk dessert price list exists before publishing).
// ----------------------------------------------------------------------------

export interface PartyItem {
  name: string;
  price: number | "Seasonal";
  unit: "kg" | "piece";
}

export const partyBulkOrders = {
  minimumOrderLabel: "Minimum order quantity: 1kg",
  advanceNoticeLabel: "Order needs to be placed 24-48 hours in advance depending on the order size.",
  veg: [
    { name: "Paneer Chilly", price: 1000, unit: "kg" },
    { name: "Paneer Ghee Roast", price: 1250, unit: "kg" },
    { name: "Paneer Tikka Masala", price: 1000, unit: "kg" },
    { name: "Paneer Curry Patta", price: 1250, unit: "kg" },
    { name: "Palak Paneer", price: 1250, unit: "kg" },
    { name: "Gobi Chilly", price: 800, unit: "kg" },
    { name: "Chana Masala", price: 800, unit: "kg" },
    { name: "Mixed Vegetable Curry", price: 800, unit: "kg" },
    { name: "Navarathna Kurma", price: 1000, unit: "kg" },
    { name: "Veg Kurma", price: 800, unit: "kg" },
    { name: "Veg Fried Rice", price: 800, unit: "kg" },
    { name: "Veg Pulav", price: 800, unit: "kg" },
    { name: "Veg Biriyani", price: 1000, unit: "kg" },
    { name: "Mushroom Chilly", price: 800, unit: "kg" },
    { name: "Hot Garlic Mushroom", price: 900, unit: "kg" },
    { name: "Schezwan Mushroom", price: 900, unit: "kg" },
    { name: "Kadle Sukka", price: 700, unit: "kg" },
    { name: "Ghee Rice", price: 700, unit: "kg" },
  ] as PartyItem[],
  nonVeg: [
    { name: "Chicken Chilly", price: 1250, unit: "kg" },
    { name: "Chicken Sukka", price: 1250, unit: "kg" },
    { name: "Pepper Chicken", price: 1250, unit: "kg" },
    { name: "Chicken Ghee Roast", price: 1500, unit: "kg" },
    { name: "Chicken Green Masala Curry", price: 1250, unit: "kg" },
    { name: "Kundapura Chicken Curry", price: 1250, unit: "kg" },
    { name: "Hyderabadi Chicken", price: 1250, unit: "kg" },
    { name: "Pudina Chicken", price: 1250, unit: "kg" },
    { name: "Chicken Tikka Masala", price: 1250, unit: "kg" },
    { name: "Chicken Kebab", price: 1250, unit: "kg" },
    { name: "Chicken 65", price: 1250, unit: "kg" },
    { name: "Chicken Fried Rice", price: 1000, unit: "kg" },
    { name: "Chicken Biriyani", price: 1250, unit: "kg" },
    { name: "Mutton Green Masala Curry", price: 2000, unit: "kg" },
    { name: "Mutton Pepper Fry", price: 2000, unit: "kg" },
    { name: "Mutton Sukka", price: 2000, unit: "kg" },
    { name: "Mutton Rogan Gosh", price: 2000, unit: "kg" },
    { name: "Mutton Biriyani", price: 2500, unit: "kg" },
    { name: "Prawns Biriyani", price: 2500, unit: "kg" },
    { name: "Prawns Curry", price: 2000, unit: "kg" },
    { name: "Fish Curry", price: "Seasonal", unit: "kg" },
  ] as PartyItem[],
  get desserts(): PartyItem[] {
    return individualMenu.desserts.map((d) => ({ name: d.name, price: d.price, unit: "piece" as const }));
  },
};

// ----------------------------------------------------------------------------
// DERIVED CATALOG HELPERS — used by the searchable multi-select components
// on the Subscribe wizard, Individual Meal page, and Party/Bulk form.
// ----------------------------------------------------------------------------

export interface MenuOption {
  id: string;
  label: string;
  meta?: string;
  price?: number;
}

export interface MenuOptionGroup {
  group: string;
  options: MenuOption[];
}

/** Grouped, searchable dish options for a given food type ("Veg Meals" / "Non-Veg Meals"). */
export function buildMealOptionGroups(foodType: FoodType): MenuOptionGroup[] {
  const items = foodType === "Veg" ? individualMenu.veg : individualMenu.nonVeg;
  return [
    {
      group: foodType === "Veg" ? "Veg Meals" : "Non-Veg Meals",
      options: items.map((item) => ({
        id: slugify(`${foodType}-${item.name}`),
        label: item.name,
        meta: formatINR(item.price),
        price: item.price,
      })),
    },
  ];
}

/** Grouped, searchable Desserts options — food-type independent. */
export function buildAddOnOptionGroups(): MenuOptionGroup[] {
  return [
    {
      group: "Desserts",
      options: individualMenu.desserts.map((item) => ({
        id: slugify(`dessert-${item.name}`),
        label: item.name,
        meta: formatINR(item.price),
        price: item.price,
      })),
    },
  ];
}

/** Look up individual meal or dessert price by item ID. Source of truth is individualMenu. */
export function getIndividualItemPrice(id: string): number {
  for (const item of individualMenu.veg) {
    if (slugify(`Veg-${item.name}`) === id) return item.price;
  }
  for (const item of individualMenu.nonVeg) {
    if (slugify(`Non-Veg-${item.name}`) === id) return item.price;
  }
  for (const item of individualMenu.desserts) {
    if (slugify(`dessert-${item.name}`) === id) return item.price;
  }
  return 0;
}

/** Look up individual meal or dessert label by item ID. */
export function getIndividualItemLabel(id: string): string {
  for (const item of individualMenu.veg) {
    if (slugify(`Veg-${item.name}`) === id) return item.name;
  }
  for (const item of individualMenu.nonVeg) {
    if (slugify(`Non-Veg-${item.name}`) === id) return item.name;
  }
  for (const item of individualMenu.desserts) {
    if (slugify(`dessert-${item.name}`) === id) return item.name;
  }
  return id;
}

/** Grouped, searchable options for the Party/Bulk order form. */
export function buildPartyOptionGroups(): MenuOptionGroup[] {
  return [
    {
      group: "Veg Party Orders",
      options: partyBulkOrders.veg.map((item) => ({
        id: slugify(`party-veg-${item.name}`),
        label: item.name,
        meta: item.price === "Seasonal" ? "Seasonal" : `${formatINR(item.price)}/kg`,
      })),
    },
    {
      group: "Non-Veg Party Orders",
      options: partyBulkOrders.nonVeg.map((item) => ({
        id: slugify(`party-nonveg-${item.name}`),
        label: item.name,
        meta: item.price === "Seasonal" ? "Seasonal" : `${formatINR(item.price)}/kg`,
      })),
    },
    {
      group: "Desserts",
      options: partyBulkOrders.desserts.map((item) => ({
        id: slugify(`party-dessert-${item.name}`),
        label: item.name,
        meta: item.price === "Seasonal" ? "Seasonal" : `${formatINR(item.price)}/piece`,
      })),
    },
  ];
}

/** Look up party or bulk item price by item ID. Numerical calculation treats Seasonal as 0. */
export function getPartyItemPrice(id: string): number {
  for (const item of partyBulkOrders.veg) {
    if (slugify(`party-veg-${item.name}`) === id) {
      return typeof item.price === "number" ? item.price : 0;
    }
  }
  for (const item of partyBulkOrders.nonVeg) {
    if (slugify(`party-nonveg-${item.name}`) === id) {
      return typeof item.price === "number" ? item.price : 0;
    }
  }
  for (const item of partyBulkOrders.desserts) {
    if (slugify(`party-dessert-${item.name}`) === id) {
      return typeof item.price === "number" ? item.price : 0;
    }
  }
  return 0;
}

/** Look up party or bulk item details (label, price, unit) by item ID. */
export function getPartyItemDetails(id: string): { label: string; price: number | "Seasonal"; unit: "kg" | "piece" } | undefined {
  for (const item of partyBulkOrders.veg) {
    if (slugify(`party-veg-${item.name}`) === id) {
      return { label: item.name, price: item.price, unit: item.unit };
    }
  }
  for (const item of partyBulkOrders.nonVeg) {
    if (slugify(`party-nonveg-${item.name}`) === id) {
      return { label: item.name, price: item.price, unit: item.unit };
    }
  }
  for (const item of partyBulkOrders.desserts) {
    if (slugify(`party-dessert-${item.name}`) === id) {
      return { label: item.name, price: item.price, unit: item.unit };
    }
  }
  return undefined;
}

/** Look up party or bulk item label by item ID. */
export function getPartyItemLabel(id: string): string {
  return getPartyItemDetails(id)?.label || id;
}

// ----------------------------------------------------------------------------
// SITE CONTENT
// ----------------------------------------------------------------------------

export const faqs = [
  {
    question: "What meal plans are available?",
    answer:
      "We offer a 3 Day Trial, a Weekly Plan (6 days), a Monthly Plan (24 days), and a Salad Plan (6 days), each available as Veg or Non-Veg, with 1 or 2 meals a day.",
  },
  {
    question: "Do you offer lunch and dinner?",
    answer: "Yes. Every plan is delivered as lunch or dinner, and 2-meal options cover both.",
  },
  {
    question: "Are vegetarian and non-vegetarian meals available?",
    answer: "Yes, every plan lets you choose vegetarian or non-vegetarian meals, and you can switch anytime by letting our team know.",
  },
  {
    question: "Can I request an individual meal?",
    answer:
      "Yes, if you're not ready for a subscription, you can send a one-off meal request from our Individual Meal page and we'll confirm availability with you directly.",
  },
  {
    question: "How does the subscription process work?",
    answer:
      "Choose a plan, tell us your preferences and delivery details, and submit your request. Our team reviews it and contacts you to confirm before your first delivery.",
  },
  {
    question: "Is online payment required?",
    answer: "No. Submitting a request does not charge you anything. Payment details are arranged directly with our team once your subscription is confirmed.",
  },
  {
    question: "How will my subscription be confirmed?",
    answer: "We'll call or WhatsApp you within one business day of your request to confirm meal details, delivery slots, and pricing.",
  },
  {
    question: "Do you take party or bulk orders?",
    answer: "Yes, see our Party & Bulk Orders menu, priced per kg with a 1 kg minimum, and placed 24–48 hours in advance depending on order size.",
  },
  {
    question: "Which locations do you currently serve?",
    answer: `We currently deliver across Udupi and Manipal city limits. Let us know your area and we'll confirm coverage.`,
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Choose Your Plan",
    description: "Pick a plan tier, Veg or Non-Veg, and 1 or 2 meals a day that suits your routine.",
  },
  {
    step: "02",
    title: "Tell Us What You Need",
    description: "Choose your favourite dishes, quantity, add-ons, and delivery details.",
  },
  {
    step: "03",
    title: "Submit Your Request",
    description: "Send your subscription or meal request through the website. No payment needed yet.",
  },
  {
    step: "04",
    title: "We Contact You",
    description: "Our team reviews your request and contacts you to confirm the details.",
  },
];

export const GAS_WEB_APP_URL = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL || "";
