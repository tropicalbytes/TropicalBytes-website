import { z } from "zod";

// Shared by admin server actions and client editors. Limits mirror the CHECK
// constraints in supabase/migrations/0001_init.sql so most mistakes are caught
// with a clear message before they reach the database (which re-checks anyway).

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

/**
 * True since plan step 6 (2026-10-05): public pages render getCatalog(), so
 * admin saves show on the website. While false, the admin showed a banner
 * explaining that changes were stored but not yet live.
 */
export const PUBLIC_SITE_READS_DATABASE = true;

/** Price changes bigger than this (either direction) get an extra warning before saving. */
export const BIG_PRICE_CHANGE = 0.25;

const rupees = (max: number) =>
  z.coerce.number({ invalid_type_error: "Enter a price in rupees" })
    .int("Use whole rupees (no paise)")
    .min(1, "Price must be at least ₹1")
    .max(max, `Price can't be more than ₹${max.toLocaleString("en-IN")}`);
const name = (max: number) => z.string().trim().min(1, "Name is required").max(max, `Keep it under ${max} characters`);
const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep it under ${max} characters`).transform((v) => (v === "" ? null : v)).nullable();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").nullable();

export const tierSchema = z.object({
  id: z.string().min(1),
  name: name(80),
  tagline: z.string().trim().max(120, "Keep it under 120 characters"),
  durationDays: z.coerce.number().int().min(1, "At least 1 day").max(366, "At most 366 days"),
  isPopular: z.boolean(),
  isActive: z.boolean(),
});
export const planOptionSchema = z.object({
  id: z.string().min(1),
  totalPrice: rupees(200000),
  isActive: z.boolean(),
});
export const planTierUpdateSchema = z.object({ tier: tierSchema, options: z.array(planOptionSchema).max(8) });

export const menuItemSchema = z.object({
  id: z.string().min(1).optional(),
  category: z.enum(["veg", "non_veg", "dessert"]),
  name: name(120),
  description: optionalText(300),
  price: rupees(100000),
  vegetarian: z.boolean(),
  isActive: z.boolean(),
});

export const bulkItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    category: z.enum(["veg", "non_veg"]),
    name: name(120),
    description: optionalText(300),
    unit: z.enum(["kg", "piece"]),
    seasonal: z.boolean(),
    price: rupees(100000).nullable(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.seasonal && v.price === null) ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a price, or mark the item as Seasonal" });
  })
  .transform((v) => ({ ...v, price: v.seasonal ? null : v.price }));

export const offerSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Title is required").max(100, "Keep it under 100 characters"),
    description: z.string().trim().max(300, "Keep it under 300 characters"),
    discountLabel: optionalText(40),
    offerPrice: rupees(200000).nullable(),
    startDate: isoDate,
    endDate: isoDate,
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.startDate && v.endDate && v.endDate < v.startDate)
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date" });
  });

export const SETTINGS = {
  party_minimum_order_label: "Party orders — minimum order note",
  party_advance_notice_label: "Party orders — advance notice note",
} as const;
export const settingSchema = z.object({
  key: z.enum(Object.keys(SETTINGS) as [keyof typeof SETTINGS, ...(keyof typeof SETTINGS)[]]),
  value: z.string().trim().min(1, "Can't be empty").max(500, "Keep it under 500 characters"),
});

export const MAX_MENU_PDF_BYTES = 5 * 1024 * 1024;

/** First zod issue as a sentence, prefixed with the field when useful. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form";
}

/** Database errors → messages the owner can act on (raw details go to the server log only). */
export function friendlyDbError(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case "23514": return "One of the values is outside what's allowed (check prices, lengths and dates).";
    case "23505": return "That would create a duplicate.";
    case "23503": return "That item is still referenced by something else.";
    case "42501": return "Your account isn't allowed to do that. Try signing out and in again.";
    default: return "Couldn't save. Please try again.";
  }
}

export interface PriceChange {
  label: string;
  before: number;
  after: number;
  /** Fractional change, e.g. 0.3 for +30%. */
  ratio: number;
  big: boolean;
}

export function priceChange(label: string, before: number | null, after: number | null): PriceChange | null {
  if (before === null || after === null || before === after) return null;
  const ratio = before === 0 ? 1 : (after - before) / before;
  return { label, before, after, ratio, big: Math.abs(ratio) > BIG_PRICE_CHANGE };
}

const istDateTime = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const istDate = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });
export const formatIST = (iso: string) => istDateTime.format(new Date(iso));
export const formatDateIST = (isoDate: string) => istDate.format(new Date(`${isoDate}T00:00:00+05:30`));
/** Today's date in India as YYYY-MM-DD (offer windows are evaluated in IST by RLS too). */
export const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
