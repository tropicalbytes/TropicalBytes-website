// One-off/dev helper: exports the live menu data from lib/config.ts as JSON
// so the (temporary) menu PDF can be generated from the same source of
// truth as the website, instead of duplicating menu content by hand.
import { individualMenu, business } from "../lib/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../menu-data.json");
writeFileSync(outPath, JSON.stringify({ business: { name: business.name, tagline: business.tagline }, menu: individualMenu }, null, 2));
console.log(`Wrote ${outPath}`);
