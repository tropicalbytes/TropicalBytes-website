/**
 * End-to-end check of enquiry pricing WITHOUT any network:
 *   website  lib/enquiry.ts buildEnquiry()  →  Apps Script google-apps-script/Code.gs doPost()
 * Code.gs runs for real in a sandbox (Google services stubbed), on both the
 * legacy unsigned path (today's live script + allowlist) and the new signed path.
 *
 *   npm run check:enquiry
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalogFromConfig, type Catalog } from "../lib/catalog/core";
import { buildEnquiry } from "../lib/enquiry";
import { REQUEST_TYPES } from "../lib/constants";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SECRET = "test-secret-0123456789abcdef0123456789abcdef";

let failed = 0;
const ok = (cond: boolean, label: string) => { if (!cond) failed++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };

// ---------------------------------------------------------------- Apps Script sandbox
type Row = unknown[];
function loadAppsScript(props: Record<string, string>) {
  const rows: Record<string, Row[]> = {};
  const mails: { subject: string }[] = [];
  const cache = new Map<string, string>();
  let seq = 0;
  const stubs = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? (k.startsWith("SEQ_") ? String(seq) : null), setProperty: (k: string, v: string) => { if (k.startsWith("SEQ_")) seq = Number(v); } }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Session: { getScriptTimeZone: () => "Asia/Kolkata" },
    Utilities: {
      formatDate: () => "261005",
      base64Encode: (b: number[]) => Buffer.from(b).toString("base64"),
      newBlob: (s: string) => ({ getBytes: () => [...Buffer.from(s)] }),
    },
    ContentService: { createTextOutput: (t: string) => ({ setMimeType: () => JSON.parse(t) }), MimeType: { JSON: "json" } },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({
      getSheetByName: (n: string) => ({ getLastRow: () => 1, appendRow: (r: Row) => (rows[n] ??= []).push(r), setFrozenRows: () => {} }),
      insertSheet: () => { throw new Error("unexpected"); },
    }) },
    MailApp: { sendEmail: (m: { subject: string }) => mails.push(m) },
  };
  const src = readFileSync(path.join(ROOT, "google-apps-script/generated-allowlist.gs"), "utf-8") + "\n" + readFileSync(path.join(ROOT, "google-apps-script/Code.gs"), "utf-8");
  const names = Object.keys(stubs);
  const api = new Function(...names, `${src}\nreturn { doPost };`)(...names.map((n) => stubs[n as keyof typeof stubs])) as { doPost: (e: unknown) => { status: string; enquiryId?: string } };
  const post = (body: unknown) => api.doPost({ postData: { contents: JSON.stringify(body) } });
  return { post, rows, mails, resetDup: () => cache.clear() };
}

const tomorrow = (() => { const d = new Date(Date.now() + 86400000); return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`; })();
const person = { fullName: "Asha Rao", phone: "9876543210", email: "asha.rao@gmail.com", notes: "" };
const catalog = catalogFromConfig();

function build(raw: Record<string, unknown>, c: Catalog = catalog) {
  const r = buildEnquiry(raw, c);
  if (!r.ok) throw new Error(`buildEnquiry rejected: ${r.reason}`);
  return r.payload;
}
/** Sheet row written by Apps Script for this payload, signed or not. */
function sheetRow(payload: Record<string, unknown>, sign: boolean, props: Record<string, string> = { ENQUIRY_SHARED_SECRET: SECRET }) {
  const gas = loadAppsScript(props);
  const res = gas.post(sign ? { ...payload, signature: SECRET } : payload);
  const all = Object.values(gas.rows).flat();
  return { res, row: all[0] as Row | undefined, mails: gas.mails.length };
}

// ---------------------------------------------------------------- subscription
const sub = build({ requestType: REQUEST_TYPES.SUBSCRIPTION, ...person, planOptionId: "monthly-veg-2", mealPreference: "Lunch & Dinner", foodPreference: "Veg", startDate: tomorrow, address: "12 Court Road", area: "Court Road", city: "Udupi", pincode: "576101" });
ok(sub.server.selectedPlan === "Monthly Plan - 2 Meal (Veg)" && sub.server.estimatedTotal === "₹9,120", `subscription priced from catalog: ${sub.server.selectedPlan} ${sub.server.estimatedTotal}`);
{
  const legacy = sheetRow(sub, false), signed = sheetRow(sub, true);
  ok(legacy.res.status === "ok" && signed.res.status === "ok", "subscription accepted by Apps Script (legacy + signed)");
  ok(JSON.stringify(legacy.row?.slice(6, 12)) === JSON.stringify(signed.row?.slice(6, 12)), `subscription: signed row matches legacy row (${JSON.stringify(signed.row?.slice(6, 12))})`);
}
const subWrongFood = buildEnquiry({ requestType: REQUEST_TYPES.SUBSCRIPTION, ...person, planOptionId: "monthly-veg-2", foodPreference: "Non-Veg" }, catalog);
ok(!subWrongFood.ok, "subscription: plan/food mismatch rejected");

// ---------------------------------------------------------------- individual meal
const meal = build({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, foodPreference: "Veg", deliveryLocation: "MIT hostel, Manipal",
  selectedMealIds: ["veg-veg-biriyani", "non-veg-chicken-biriyani"], selectedAddOnIds: ["dessert-tiramisu"],
  itemQuantities: { "veg-veg-biriyani": 2, "non-veg-chicken-biriyani": 1, "dessert-tiramisu": 3 } });
ok(meal.server.estimatedTotal === "₹1,700", `individual total 2×250 + 1×300 + 3×300 = ${meal.server.estimatedTotal}`);
ok(meal.server.foodPreference === "Veg & Non-Veg", "individual: food preference derived from items");
{
  const legacy = sheetRow(meal, false), signed = sheetRow(meal, true);
  ok(legacy.res.status === "ok" && signed.res.status === "ok", "individual accepted by Apps Script (legacy + signed)");
  ok(JSON.stringify(legacy.row?.slice(6, 11)) === JSON.stringify(signed.row?.slice(6, 11)), `individual: signed row matches legacy row (${JSON.stringify(signed.row?.slice(6, 11))})`);
}
const dessertsOnly = build({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, foodPreference: "Veg", deliveryLocation: "Udupi", selectedMealIds: [], selectedAddOnIds: ["dessert-tiramisu"] });
ok(dessertsOnly.server.foodPreference === "Desserts" && dessertsOnly.server.addOns === "" && dessertsOnly.server.selectedMeals === "Tiramisu × 1", "individual: desserts-only formatted like the legacy script");
ok(!buildEnquiry({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, deliveryLocation: "x", selectedMealIds: ["veg-veg-biriyani"], itemQuantities: { "veg-veg-biriyani": 21 } }, catalog).ok, "individual: quantity over 20 rejected");
ok(!buildEnquiry({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, deliveryLocation: "x", selectedMealIds: ["no-such-dish"] }, catalog).ok, "individual: unknown item rejected");
ok(!buildEnquiry({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, deliveryLocation: "x", selectedAddOnIds: ["veg-veg-biriyani"] }, catalog).ok, "individual: a meal smuggled in as an add-on rejected");
ok(!buildEnquiry({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, deliveryLocation: "x", selectedMealIds: [] }, catalog).ok, "individual: empty order rejected");

// ---------------------------------------------------------------- party / bulk
const party = build({ requestType: REQUEST_TYPES.PARTY_BULK, ...person, eventDate: tomorrow, deliveryLocation: "Hall, Manipal",
  selectedItemIds: ["party-veg-paneer-chilly", "party-nonveg-fish-curry", "dessert-tiramisu"],
  itemQuantities: { "party-veg-paneer-chilly": 2, "party-nonveg-fish-curry": 3, "dessert-tiramisu": 10 } });
ok(party.server.estimatedTotal === "₹5,000 + 1 seasonal item (price on request)", `party total computed server-side: ${party.server.estimatedTotal}`);
ok(String(party.server.selectedItems).includes("Paneer Chilly × 2 kg") && String(party.server.selectedItems).includes("Tiramisu × 10 pieces"), "party: labels include quantity and unit");
ok(JSON.stringify(party.selectedItemIds) === JSON.stringify(["party-veg-paneer-chilly", "party-nonveg-fish-curry", "party-dessert-tiramisu"]), "party: dessert ids mapped back to the legacy allowlist names");
{
  const legacy = sheetRow(party, false), signed = sheetRow(party, true);
  ok(legacy.res.status === "ok", "party accepted by the CURRENT live script (legacy path, mapped ids)");
  ok(signed.res.status === "ok" && signed.row?.[7] === party.server.estimatedTotal, `party (signed): Sheet total is the server's, not the browser's (${signed.row?.[7]})`);
}
const tampered = sheetRow({ ...party, estimatedTotal: "₹1" }, true);
ok(tampered.row?.[7] === party.server.estimatedTotal, "party (signed): a tampered browser total is ignored");

// ---------------------------------------------------------------- admin-added item (random id)
const withNewDish: Catalog = { ...catalog, menu: { ...catalog.menu, veg: [...catalog.menu.veg, { id: "3f6c1d2e-0000-4000-8000-000000000001", name: "Millet Bowl", price: 260, vegetarian: true, description: null }] } };
const newDish = build({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, foodPreference: "Veg", deliveryLocation: "Udupi", selectedMealIds: ["3f6c1d2e-0000-4000-8000-000000000001"] }, withNewDish);
ok(sheetRow(newDish, false).res.status === "error", "admin-added dish: legacy script can't know it (expected — why signing is needed)");
const signedNew = sheetRow(newDish, true);
ok(signedNew.res.status === "ok" && signedNew.row?.[7] === "Millet Bowl × 1" && signedNew.row?.[10] === "₹260", "admin-added dish: accepted and priced on the signed path");
const hidden: Catalog = { ...catalog, menu: { ...catalog.menu, veg: catalog.menu.veg.filter((i) => i.id !== "veg-veg-biriyani") } };
ok(!buildEnquiry({ requestType: REQUEST_TYPES.INDIVIDUAL_MEAL, ...person, deliveryLocation: "x", selectedMealIds: ["veg-veg-biriyani"] }, hidden).ok, "item hidden in admin: rejected with a refresh message");

// ---------------------------------------------------------------- signature handling
ok(sheetRow(newDish, true, {}).res.status === "error", "no ENQUIRY_SHARED_SECRET in Script Properties → signed path disabled");
{
  const gas = loadAppsScript({ ENQUIRY_SHARED_SECRET: SECRET });
  ok(gas.post({ ...newDish, signature: SECRET.slice(0, -1) + "x" }).status === "error", "wrong signature → treated as unsigned (rejected for unknown dish)");
}
ok(sheetRow(sub, false, { ENQUIRY_SHARED_SECRET: SECRET, REQUIRE_SIGNED: "true" }).res.status === "error", "REQUIRE_SIGNED=true → unsigned requests rejected");
ok(sheetRow(sub, true, { ENQUIRY_SHARED_SECRET: SECRET, REQUIRE_SIGNED: "true" }).res.status === "ok", "REQUIRE_SIGNED=true → signed requests still accepted");
{
  const bad = sheetRow({ ...sub, phone: "123" }, true);
  ok(bad.res.status === "error", "signed path still validates customer details (bad phone rejected)");
}

// ---------------------------------------------------------------- contact
const contact = build({ requestType: REQUEST_TYPES.CONTACT, ...person, message: "Do you deliver to Malpe?" });
ok(sheetRow(contact, true).res.status === "ok" && sheetRow(contact, false).res.status === "ok", "contact enquiry passes through (signed + legacy)");
ok(!buildEnquiry({ requestType: "Bogus" }, catalog).ok, "unknown request type rejected");

console.log(failed ? `\n${failed} check(s) failed` : "\nall enquiry checks passed");
process.exit(failed ? 1 : 0);
