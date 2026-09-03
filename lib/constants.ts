// ============================================================================
// SHARED CONSTANTS — single source of truth for values that must stay in
// sync across the frontend forms, the submission payloads, and the Google
// Apps Script backend's allowlists (see google-apps-script/generated-allowlist.gs,
// produced from this project's config via `npm run generate:gas`).
// ============================================================================

export const REQUEST_TYPES = {
  SUBSCRIPTION: "Subscription Request",
  INDIVIDUAL_MEAL: "Individual Meal Request",
  PARTY_BULK: "Party/Bulk Order Request",
  CONTACT: "Contact Enquiry",
} as const;

export type RequestType = (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];

export const MEAL_PREFERENCE_OPTIONS = ["Lunch", "Dinner", "Lunch & Dinner"] as const;
export const FOOD_PREFERENCE_OPTIONS = ["Veg", "Non-Veg"] as const;
export const QUANTITY_OPTIONS = ["1", "2", "3", "4", "5"] as const;

// Business rule: how far in the future a start/event date may reasonably be
// requested. Mirrored server-side in Code.gs — keep both in sync if changed.
export const MAX_FUTURE_DATE_DAYS = 120;

// Sensible max lengths for free-text fields, applied client-side for UX and
// mirrored (independently) server-side since the frontend is not trusted.
export const MAX_LENGTHS = {
  name: 100,
  address: 300,
  notes: 500,
  message: 1000,
} as const;
