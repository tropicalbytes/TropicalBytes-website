/**
 * TropicalBytes — Google Apps Script Web App backend.
 *
 * SECURITY MODEL
 * The frontend is NOT trusted. Anyone can send a request directly to this
 * Web App URL, bypassing the website entirely. Every field is therefore
 * re-validated here against allowlists, and every business-sensitive value
 * (enquiry ID, timestamp, price) is generated/recalculated on this
 * side rather than trusted from the request body.
 *
 * PIPELINE
 *   doPost()
 *     -> parse request safely
 *     -> basic size/rate limits (CacheService + LockService)
 *     -> validate request type (allowlist)
 *     -> validate + normalize fields for that type
 *     -> validate business rules (plan option exists, ids are known, etc.)
 *     -> generate server-controlled values (enquiryId, timestamp, price)
 *     -> sanitize every string for safe spreadsheet storage
 *     -> append row -> send email (independently try/caught)
 *     -> return a generic {status, message} — never a raw error
 *
 * SETUP
 * 1. Create a new Google Sheet. Tabs are created automatically the first
 *    time each request type is submitted (with header rows).
 * 2. Extensions > Apps Script. Paste this file in as Code.gs, and add
 *    generated-allowlist.gs (from this folder) as a SECOND file in the same
 *    Apps Script project — Apps Script merges all files into one global
 *    scope, so GENERATED_ALLOWLIST is available here automatically.
 * 3. Update BUSINESS_EMAIL below.
 * 4. Deploy > New deployment > type: Web app. Execute as: Me. Access: Anyone.
 * 5. Copy the deployment URL into NEXT_PUBLIC_GAS_WEB_APP_URL in the site's
 *    .env.local / Vercel environment variables.
 *
 * After changing menu/pricing in lib/config.ts, run `npm run generate:gas`
 * and re-paste generated-allowlist.gs into the Apps Script project.
 */

const BUSINESS_EMAIL = "tropicalbytes.in@gmail.com"; // <-- set the real inbox to notify

const GENERIC_ERROR_MESSAGE = "Unable to process your request. Please try again later.";

// ----------------------------------------------------------------------------
// REQUEST TYPES (mirrors lib/constants.ts REQUEST_TYPES on the frontend)
// ----------------------------------------------------------------------------

const REQUEST_TYPES = {
  SUBSCRIPTION: "Subscription Request",
  INDIVIDUAL_MEAL: "Individual Meal Request",
  PARTY_BULK: "Party/Bulk Order Request",
  CONTACT: "Contact Enquiry",
};

const SHEET_NAMES = {};
SHEET_NAMES[REQUEST_TYPES.SUBSCRIPTION] = "Subscription Requests";
SHEET_NAMES[REQUEST_TYPES.INDIVIDUAL_MEAL] = "Individual Meal Requests";
SHEET_NAMES[REQUEST_TYPES.PARTY_BULK] = "Party Bulk Orders";
SHEET_NAMES[REQUEST_TYPES.CONTACT] = "Contact Enquiries";

const HEADERS = {
  "Subscription Requests": [
    "Enquiry ID", "Submission Date", "Request Type", "Customer Name", "Phone Number", "Email",
    "Selected Plan", "Duration", "Meal Preference", "Food Preference",
    "Preferred Start Date", "Estimated Total (Server)", "Client Estimated Total",
    "Full Address", "Area", "City", "Pincode", "Additional Notes",
  ],
  "Individual Meal Requests": [
    "Enquiry ID", "Submission Date", "Request Type", "Customer Name", "Phone Number", "Email",
    "Meal Time", "Food Preference", "Selected Meals",
    "Delivery Location", "Add-ons", "Additional Notes",
  ],
  "Party Bulk Orders": [
    "Enquiry ID", "Submission Date", "Request Type", "Customer Name", "Phone Number", "Email",
    "Selected Items", "Event Date", "Delivery Location", "Additional Notes",
  ],
  "Contact Enquiries": [
    "Enquiry ID", "Submission Date", "Request Type", "Customer Name", "Phone Number", "Email",
    "Message",
  ],
};

// Business rules (mirror lib/constants.ts on the frontend — keep in sync)
const MAX_FUTURE_DATE_DAYS = 120;
const MAX_LENGTHS = { name: 100, address: 300, notes: 500, message: 1000, location: 300 };
const MAX_QUANTITY = 20; // per-person meal quantity / item count sanity ceiling
const MAX_SELECTED_ITEMS = 40; // guard against absurdly large arrays
const MAX_REQUEST_BYTES = 20000; // ~20 KB is generous for these forms
const MAX_REQUESTS_PER_MINUTE = 30; // coarse, global — see README limitations note

// ============================================================================
// ENTRY POINT
// ============================================================================

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
    }

    if (e.postData.contents.length > MAX_REQUEST_BYTES) {
      logRejected("oversized_request", { length: e.postData.contents.length });
      return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
    }

    let raw;
    try {
      raw = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      logRejected("invalid_json", {});
      return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
    }

    if (!raw || typeof raw !== "object") {
      return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
    }

    // Honeypot: a legitimate browser never fills this field in.
    if (raw.honeypot) {
      logRejected("honeypot_triggered", { requestType: raw.requestType });
      // Return success-shaped response so bots gain no signal from the rejection.
      return jsonResponse({ status: "ok" });
    }

    const rateLimitOk = checkRateLimit();
    if (!rateLimitOk) {
      logRejected("rate_limited", { requestType: raw.requestType });
      return jsonResponse({ status: "error", message: "Too many requests right now. Please try again in a minute." });
    }

    const requestType = raw.requestType;
    if (!isString(requestType) || !SHEET_NAMES[requestType]) {
      logRejected("unknown_request_type", { requestType: requestType });
      return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
    }

    const validation = validateAndNormalize(requestType, raw);
    if (!validation.ok) {
      logRejected("validation_failed", { requestType: requestType, errors: validation.errors });
      return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
    }

    const data = validation.data; // fully normalized, server-controlled record

    if (isDuplicateSubmission(requestType, data)) {
      logRejected("duplicate_submission", { requestType: requestType });
      return jsonResponse({ status: "ok", duplicate: true });
    }

    data.enquiryId = generateEnquiryId(requestType);

    const sheetName = SHEET_NAMES[requestType];
    const sheet = getOrCreateSheet(sheetName);
    appendRow(sheet, sheetName, data);

    try {
      sendNotificationEmail(requestType, data);
    } catch (emailErr) {
      // The row was already saved — an email hiccup should not fail the
      // whole request or hide a successfully recorded enquiry.
      console.error("Email notification failed: " + String(emailErr));
    }

    return jsonResponse({ status: "ok", enquiryId: data.enquiryId });
  } catch (err) {
    console.error("Unhandled error in doPost: " + String(err));
    return jsonResponse({ status: "error", message: GENERIC_ERROR_MESSAGE });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("TropicalBytes enquiry endpoint is live.");
}

// ============================================================================
// VALIDATION
// ============================================================================

function isString(v) { return typeof v === "string"; }
function isNonEmptyString(v) { return isString(v) && v.trim().length > 0; }
function isArray(v) { return Object.prototype.toString.call(v) === "[object Array]"; }

function isValidEmail(v) {
  return isNonEmptyString(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.trim().length <= 254;
}

function isValidPhone(v) {
  if (!isString(v)) return false;
  const digits = v.replace(/[\s-]/g, "");
  return /^(\+?91)?0?[6-9]\d{9}$/.test(digits);
}

function isValidPincode(v) {
  return isString(v) && /^\d{6}$/.test(v.trim());
}

function withinLength(v, max) {
  return isString(v) && v.trim().length <= max;
}

/** DD-MM-YYYY, real calendar date, not in the past, not further out than MAX_FUTURE_DATE_DAYS. */
function isValidBusinessDate(v) {
  if (!isString(v) || !/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(v)) return false;
  var parts = v.split("-");
  var day = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);

  // Validate exact calendar day (rejects impossible dates like 31-02-2026 or 31-04-2026)
  var chosen = new Date(year, month - 1, day);
  if (
    chosen.getFullYear() !== year ||
    chosen.getMonth() !== month - 1 ||
    chosen.getDate() !== day
  ) {
    return false;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var limit = new Date(today);
  limit.setDate(limit.getDate() + MAX_FUTURE_DATE_DAYS);
  return chosen.getTime() >= today.getTime() && chosen.getTime() <= limit.getTime();
}

function isValidQuantity(v) {
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1 && n <= MAX_QUANTITY;
}

function isOneOf(v, allowedList) {
  return allowedList.indexOf(v) !== -1;
}

function isValidItemQuantitiesObject(obj) {
  if (obj === undefined || obj === null) return true;
  if (typeof obj !== "object" || isArray(obj)) return false;
  const keys = Object.keys(obj);
  if (keys.length > MAX_SELECTED_ITEMS * 2) return false;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const isKnown = Object.prototype.hasOwnProperty.call(GENERATED_ALLOWLIST.MEAL_IDS, k) ||
                    Object.prototype.hasOwnProperty.call(GENERATED_ALLOWLIST.ADDON_IDS, k) ||
                    Object.prototype.hasOwnProperty.call(GENERATED_ALLOWLIST.PARTY_ITEM_IDS, k);
    if (!isKnown) return false;
    const q = obj[k];
    if (!isValidQuantity(q)) return false;
  }
  return true;
}

/** Validates an array of ids against an allowlist map (id -> label), with a size cap and optional quantity mapping. Returns {ok, labels} or {ok:false}. */
function validateIdArray(v, allowlistMap, maxItems, quantitiesMap) {
  if (v === undefined || v === null) return { ok: true, labels: [] };
  if (!isArray(v)) return { ok: false };
  if (v.length > maxItems) return { ok: false };
  const labels = [];
  for (let i = 0; i < v.length; i++) {
    const id = v[i];
    if (!isString(id) || !Object.prototype.hasOwnProperty.call(allowlistMap, id)) {
      return { ok: false };
    }
    let label = allowlistMap[id];
    if (quantitiesMap && typeof quantitiesMap === "object" && Object.prototype.hasOwnProperty.call(quantitiesMap, id)) {
      const q = Number(quantitiesMap[id]);
      if (Number.isFinite(q) && Number.isInteger(q) && q >= 1 && q <= MAX_QUANTITY) {
        label += " \u00D7 " + q;
      }
    }
    labels.push(label);
  }
  return { ok: true, labels: labels };
}

/**
 * Validates and normalizes a raw payload for a given request type.
 * Returns { ok: true, data } with a fully server-controlled record, or
 * { ok: false, errors } listing which fields failed (for internal logging
 * only — never surfaced to the caller).
 */
function validateAndNormalize(requestType, raw) {
  const errors = [];
  const check = function (cond, name) { if (!cond) errors.push(name); };

  const fullName = isString(raw.fullName) ? raw.fullName.trim() : "";
  const phone = isString(raw.phone) ? raw.phone.trim() : "";
  const email = isString(raw.email) ? raw.email.trim() : "";

  check(isNonEmptyString(fullName) && withinLength(fullName, MAX_LENGTHS.name), "fullName");
  check(isValidPhone(phone), "phone");
  check(isValidEmail(email), "email");

  const base = {
    requestType: requestType,
    submittedAt: new Date(), // server clock — never trust the browser's
    fullName: fullName,
    phone: phone,
    email: email,
  };

  if (requestType === REQUEST_TYPES.SUBSCRIPTION) {
    const planOptionId = raw.planOptionId;
    const mealPreference = raw.mealPreference;
    const foodPreference = raw.foodPreference;
    const startDate = raw.startDate;

    // Subscription pricing is a fixed, client-approved table (4 plan tiers
    // x Veg/Non-Veg x 1/2 meals) rather than a per-week formula — the
    // server looks up the plan by id and trusts ITS OWN price, never one
    // computed client-side.
    check(isNonEmptyString(planOptionId) && Object.prototype.hasOwnProperty.call(GENERATED_ALLOWLIST.SUBSCRIPTION_PLANS, planOptionId), "planOptionId");
    check(isOneOf(mealPreference, GENERATED_ALLOWLIST.MEAL_PREFERENCES), "mealPreference");
    check(isOneOf(foodPreference, GENERATED_ALLOWLIST.FOOD_PREFERENCES), "foodPreference");
    check(isValidBusinessDate(startDate), "startDate");
    check(withinLength(raw.address, MAX_LENGTHS.address), "address");
    check(isNonEmptyString(raw.area), "area");
    check(isNonEmptyString(raw.city), "city");
    check(isValidPincode(raw.pincode), "pincode");
    check(raw.notes === undefined || withinLength(String(raw.notes || ""), MAX_LENGTHS.notes), "notes");

    if (errors.length > 0) return { ok: false, errors: errors };

    const plan = GENERATED_ALLOWLIST.SUBSCRIPTION_PLANS[planOptionId];
    check(!!plan && plan.foodType === foodPreference, "planOptionId");
    if (errors.length > 0) return { ok: false, errors: errors };

    return {
      ok: true,
      data: Object.assign({}, base, {
        selectedPlan: plan.label,
        duration: plan.deliveryLabel,
        mealPreference: mealPreference,
        foodPreference: foodPreference,
        startDate: startDate,
        estimatedTotal: "\u20B9" + plan.totalPrice.toLocaleString("en-IN"), // authoritative, server-side plan price
        clientEstimatedTotal: sanitizeForDisplay(raw.clientEstimatedTotal),
        address: raw.address.trim(),
        area: raw.area.trim(),
        city: raw.city.trim(),
        pincode: raw.pincode.trim(),
        notes: raw.notes ? String(raw.notes).trim() : "",
      }),
    };
  }

  if (requestType === REQUEST_TYPES.INDIVIDUAL_MEAL) {
    const mealTime = raw.mealTime;
    const foodPreference = raw.foodPreference;

    check(isOneOf(mealTime, GENERATED_ALLOWLIST.MEAL_PREFERENCES), "mealTime");
    const allowedFoodPrefs = ["Veg", "Non-Veg", "Veg & Non-Veg", "Desserts"];
    check(isOneOf(foodPreference, allowedFoodPrefs), "foodPreference");
    check(isNonEmptyString(raw.deliveryLocation) && withinLength(raw.deliveryLocation, MAX_LENGTHS.location), "deliveryLocation");
    check(raw.notes === undefined || withinLength(String(raw.notes || ""), MAX_LENGTHS.notes), "notes");
    check(isValidItemQuantitiesObject(raw.itemQuantities), "itemQuantities");

    const itemQuantities = (raw.itemQuantities && typeof raw.itemQuantities === "object") ? raw.itemQuantities : null;
    const meals = validateIdArray(raw.selectedMealIds, GENERATED_ALLOWLIST.MEAL_IDS, MAX_SELECTED_ITEMS, itemQuantities);
    check(meals.ok, "selectedMealIds");
    const addOns = validateIdArray(raw.selectedAddOnIds, GENERATED_ALLOWLIST.ADDON_IDS, MAX_SELECTED_ITEMS, itemQuantities);
    check(addOns.ok, "selectedAddOnIds");

    if (errors.length > 0) return { ok: false, errors: errors };

    // Authoritative classification based on actual selected items
    let hasVeg = false;
    let hasNonVeg = false;
    if (isArray(raw.selectedMealIds)) {
      for (let i = 0; i < raw.selectedMealIds.length; i++) {
        const id = String(raw.selectedMealIds[i] || "").toLowerCase();
        if (id.indexOf("veg-") === 0) hasVeg = true;
        if (id.indexOf("non-veg-") === 0) hasNonVeg = true;
      }
    }
    const hasDesserts = isArray(raw.selectedAddOnIds) && raw.selectedAddOnIds.length > 0;

    let computedFoodPreference;
    let finalSelectedMeals;
    let finalAddOns;

    if (hasVeg && hasNonVeg) {
      // Case A: Veg + Non-Veg
      computedFoodPreference = "Veg & Non-Veg";
      finalSelectedMeals = meals.labels.join(", ");
      finalAddOns = addOns.labels.join(", ");
    } else if (hasVeg) {
      // Case B: Veg only
      computedFoodPreference = "Veg";
      finalSelectedMeals = meals.labels.join(", ");
      finalAddOns = addOns.labels.join(", ");
    } else if (hasNonVeg) {
      // Case C: Non-Veg only
      computedFoodPreference = "Non-Veg";
      finalSelectedMeals = meals.labels.join(", ");
      finalAddOns = addOns.labels.join(", ");
    } else if (hasDesserts) {
      // Case D: Desserts only -> Desserts placed under Selected Meals, Add-ons is blank
      computedFoodPreference = "Desserts";
      finalSelectedMeals = addOns.labels.join(", ");
      finalAddOns = "";
    } else {
      computedFoodPreference = isNonEmptyString(foodPreference) ? foodPreference : "Veg";
      finalSelectedMeals = meals.labels.join(", ");
      finalAddOns = addOns.labels.join(", ");
    }

    return {
      ok: true,
      data: Object.assign({}, base, {
        mealTime: mealTime,
        foodPreference: computedFoodPreference,
        selectedMeals: finalSelectedMeals,
        deliveryLocation: raw.deliveryLocation.trim(),
        addOns: finalAddOns,
        clientEstimatedTotal: sanitizeForDisplay(raw.clientEstimatedTotal),
        notes: raw.notes ? String(raw.notes).trim() : "",
      }),
    };
  }

  if (requestType === REQUEST_TYPES.PARTY_BULK) {
    const eventDate = raw.eventDate;

    check(isValidBusinessDate(eventDate), "eventDate");
    check(isNonEmptyString(raw.deliveryLocation) && withinLength(raw.deliveryLocation, MAX_LENGTHS.location), "deliveryLocation");
    check(raw.notes === undefined || withinLength(String(raw.notes || ""), MAX_LENGTHS.notes), "notes");
    check(isValidItemQuantitiesObject(raw.itemQuantities), "itemQuantities");

    const itemQuantities = (raw.itemQuantities && typeof raw.itemQuantities === "object") ? raw.itemQuantities : null;
    const items = validateIdArray(raw.selectedItemIds, GENERATED_ALLOWLIST.PARTY_ITEM_IDS, MAX_SELECTED_ITEMS, itemQuantities);
    check(items.ok, "selectedItemIds");
    check(!items.ok || items.labels.length > 0, "selectedItemIds");

    if (errors.length > 0) return { ok: false, errors: errors };

    return {
      ok: true,
      data: Object.assign({}, base, {
        selectedItems: items.labels.join(", "),
        eventDate: eventDate,
        deliveryLocation: raw.deliveryLocation.trim(),
        clientEstimatedTotal: sanitizeForDisplay(raw.clientEstimatedTotal),
        notes: raw.notes ? String(raw.notes).trim() : "",
      }),
    };
  }

  if (requestType === REQUEST_TYPES.CONTACT) {
    check(isNonEmptyString(raw.message) && withinLength(raw.message, MAX_LENGTHS.message), "message");

    if (errors.length > 0) return { ok: false, errors: errors };

    return {
      ok: true,
      data: Object.assign({}, base, {
        message: raw.message.trim(),
      }),
    };
  }

  return { ok: false, errors: ["unhandled_request_type"] };
}

/** Non-authoritative — kept only for the business's own reference in the sheet, clearly labeled as client-supplied. */
function sanitizeForDisplay(v) {
  if (v === undefined || v === null) return "";
  return String(v).slice(0, 40);
}

// ============================================================================
// SERVER-CONTROLLED VALUE GENERATION
// ============================================================================

function generateEnquiryId(requestType) {
  const idConfig = {};

  idConfig[REQUEST_TYPES.CONTACT] = {
    prefix: "CNT",
    formCode: "1A"
  };

  idConfig[REQUEST_TYPES.SUBSCRIPTION] = {
    prefix: "SUB",
    formCode: "2B"
  };

  idConfig[REQUEST_TYPES.INDIVIDUAL_MEAL] = {
    prefix: "MEAL",
    formCode: "3C"
  };

  idConfig[REQUEST_TYPES.PARTY_BULK] = {
    prefix: "PARTY",
    formCode: "4D"
  };

  const config = idConfig[requestType];

  if (!config) {
    throw new Error("Unknown request type for enquiry ID generation");
  }

  const timeZone = Session.getScriptTimeZone() || "Asia/Kolkata";

  const datePart = Utilities.formatDate(
    new Date(),
    timeZone,
    "yyMMdd"
  );

  const counterKey =
    "SEQ_" +
    config.prefix +
    "_" +
    config.formCode +
    "_" +
    datePart;

  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(5000);
    lockAcquired = true;

    const properties = PropertiesService.getScriptProperties();

    const currentCount = Number(
      properties.getProperty(counterKey) || "0"
    );

    const nextCount = currentCount + 1;

    properties.setProperty(
      counterKey,
      String(nextCount)
    );

    const sequence = String(nextCount).padStart(2, "0");

    return (
      config.prefix +
      "-" +
      datePart +
      "-" +
      config.formCode +
      sequence
    );

  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

// ============================================================================
// SPREADSHEET SAFETY (formula-injection protection)
// ============================================================================

/**
 * Ensures a value that will be written into a Google Sheet cell cannot be
 * interpreted as a formula. If the string begins with =, +, -, @, a tab, or
 * a carriage return (all recognized formula/CSV-injection triggers), a
 * leading apostrophe is prepended so Sheets stores it as literal text.
 * Ordinary punctuation (apostrophes, commas, #, etc.) is left untouched.
 */
function safeCell(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

// ============================================================================
// SHEET I/O
// ============================================================================

function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  ensureHeader(sheet, sheetName);
  return sheet;
}

function ensureHeader(sheet, sheetName) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS[sheetName]);
    sheet.setFrozenRows(1);
  }
}

function appendRow(sheet, sheetName, data) {
  const submittedAt = data.submittedAt; // already a server Date object

  let row;
  if (sheetName === "Subscription Requests") {
    row = [
      safeCell(data.enquiryId), submittedAt, safeCell(data.requestType), safeCell(data.fullName), safeCell(data.phone), safeCell(data.email),
      safeCell(data.selectedPlan), safeCell(data.duration), safeCell(data.mealPreference), safeCell(data.foodPreference),
      safeCell(data.startDate), safeCell(data.estimatedTotal), safeCell(data.clientEstimatedTotal),
      safeCell(data.address), safeCell(data.area), safeCell(data.city), safeCell(data.pincode), safeCell(data.notes),
    ];
  } else if (sheetName === "Individual Meal Requests") {
    row = [
      safeCell(data.enquiryId), submittedAt, safeCell(data.requestType), safeCell(data.fullName), safeCell(data.phone), safeCell(data.email),
      safeCell(data.mealTime), safeCell(data.foodPreference), safeCell(data.selectedMeals),
      safeCell(data.deliveryLocation), safeCell(data.addOns), safeCell(data.notes),
    ];
  } else if (sheetName === "Party Bulk Orders") {
    row = [
      safeCell(data.enquiryId), submittedAt, safeCell(data.requestType), safeCell(data.fullName), safeCell(data.phone), safeCell(data.email),
      safeCell(data.selectedItems), safeCell(data.eventDate), safeCell(data.deliveryLocation),
      safeCell(data.notes),
    ];
  } else {
    row = [
      safeCell(data.enquiryId), submittedAt, safeCell(data.requestType), safeCell(data.fullName), safeCell(data.phone), safeCell(data.email),
      safeCell(data.message),
    ];
  }

  sheet.appendRow(row);
}

// ============================================================================
// EMAIL
// ============================================================================

function sendNotificationEmail(requestType, data) {
  const subject = "New " + requestType + " - TropicalBytes (" + data.enquiryId + ")";
  const keys = Object.keys(data).filter(function (k) { return k !== "honeypot"; });
  const rows = keys
    .map(function (key) {
      return "<tr><td style=\"padding:4px 10px;font-weight:600;\">" + escapeHtml(key) + "</td><td style=\"padding:4px 10px;\">" + escapeHtml(String(data[key] === undefined ? "" : data[key])) + "</td></tr>";
    })
    .join("");

  const html =
    "<div style=\"font-family:sans-serif;\"><h2 style=\"color:#1F3A2E;\">" + escapeHtml(requestType) + "</h2><table style=\"border-collapse:collapse;\">" + rows + "</table></div>";

  MailApp.sendEmail({ to: BUSINESS_EMAIL, subject: subject, htmlBody: html });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ============================================================================
// ANTI-ABUSE (coarse, global — see README for the architecture's limits)
// ============================================================================

/**
 * A blunt, global request-rate ceiling. Apps Script Web Apps do not expose
 * the caller's IP address, so this cannot be scoped per-user — it protects
 * the whole endpoint against a burst of automated traffic, not any single
 * abusive client. See google-apps-script/README.md for the full limitation.
 */
function checkRateLimit() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(2000);
  } catch (e) {
    // Couldn't get the lock quickly — fail open rather than blocking a
    // legitimate burst of simultaneous (different) customers.
    return true;
  }
  try {
    const cache = CacheService.getScriptCache();
    const bucket = "rl_" + Math.floor(Date.now() / 60000); // one bucket per minute
    const current = Number(cache.get(bucket) || "0");
    if (current >= MAX_REQUESTS_PER_MINUTE) return false;
    cache.put(bucket, String(current + 1), 90); // expire a little after the minute ends
    return true;
  } finally {
    lock.releaseLock();
  }
}

/** Suppresses an identical (requestType + phone + email) submission arriving again within 2 minutes. */
function isDuplicateSubmission(requestType, data) {
  const cache = CacheService.getScriptCache();
  const key = "dup_" + Utilities.base64Encode(Utilities.newBlob(requestType + "|" + data.phone + "|" + data.email).getBytes()).slice(0, 60);
  if (cache.get(key)) return true;
  cache.put(key, "1", 120);
  return false;
}

function logRejected(reason, details) {
  // Apps Script's execution log (Extensions > Apps Script > Executions) is
  // the place to review these — nothing here reaches the caller.
  console.log("Rejected request [" + reason + "]: " + JSON.stringify(details));
}
