import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRIES } from "../js/country-data.js";
import { COUNTRY_ISO_CROSSWALK } from "../js/country-iso-crosswalk.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registerPath = "resources/country-viewer/country-iana-cctld-register-2026-11-09.json";
const outputPath = "js/country-iana-cctlds.js";
const register = JSON.parse(await readFile(path.join(root, registerPath), "utf8"));
if (register.schema !== "html5.country-viewer.iana-cctld-register/v1") throw new Error("unsupported IANA ccTLD register schema");
if (register.reviewDate !== "2026-11-09") throw new Error("IANA ccTLD review date must remain 2026-11-09");

const knownFactbookCodes = new Set(COUNTRIES.map((country) => country.code));
const knownIsoCodes = new Set(COUNTRY_ISO_CROSSWALK.map((entry) => entry.isoAlpha2));
const isoCodes = new Set();
const tldCounts = new Map();
let tldAliasCount = 0;
for (const entry of register.entries) {
  if (!/^[A-Z]{2}$/.test(entry.isoAlpha2) || isoCodes.has(entry.isoAlpha2)) throw new Error(`invalid/duplicate ISO code: ${entry.isoAlpha2}`);
  isoCodes.add(entry.isoAlpha2);
  if (!knownIsoCodes.has(entry.isoAlpha2)) throw new Error(`${entry.isoAlpha2}: missing reviewed ISO crosswalk entry`);
  if (!Array.isArray(entry.tlds) || !entry.tlds.length) throw new Error(`${entry.isoAlpha2}: expected at least one verified TLD alias`);
  if (!Array.isArray(entry.factbookCodes)) throw new Error(`${entry.isoAlpha2}: factbookCodes must be an array`);
  for (const code of entry.factbookCodes) if (!knownFactbookCodes.has(code)) throw new Error(`${entry.isoAlpha2}: unknown Factbook code ${code}`);
  for (const alias of entry.tlds) {
    if (typeof alias.ascii !== "string" || !/^\.[a-z0-9-]+$/.test(alias.ascii)) throw new Error(`${entry.isoAlpha2}: invalid ASCII TLD ${alias.ascii}`);
    if (typeof alias.sourceName !== "string" || !alias.sourceName.trim()) throw new Error(`${entry.isoAlpha2}: missing source TLD value`);
    tldAliasCount += 1;
    tldCounts.set(alias.ascii, (tldCounts.get(alias.ascii) ?? 0) + 1);
  }
}
const shared = [...tldCounts].filter(([, count]) => count > 1).map(([tld]) => tld).sort();
const uniqueTldCount = tldCounts.size;
if (register.counts.isoEntriesWithTld !== register.entries.length ||
    register.counts.validatedTldAliases !== tldAliasCount ||
    register.counts.uniqueValidatedTlds !== uniqueTldCount ||
    register.counts.sharedTldNames !== shared.length) {
  throw new Error("IANA ccTLD register summary counts do not match its entries");
}

const metadata = {
  reviewDate: register.reviewDate,
  source: register.source,
  ianaList: register.ianaList,
  counts: register.counts,
  exclusions: register.exclusions,
  sharedTldAssignments: register.sharedTldAssignments,
  attribution: register.attribution,
};
const generated = `// Generated from ${registerPath}; edit the source register, then run the builder.\n` +
  `// TLD data is a limited ODbL-1.0 database extraction; attribution and license text are bundled with the Country Viewer.\n` +
  `export const COUNTRY_IANA_TLD_META = Object.freeze(${JSON.stringify(metadata, null, 2)});\n\n` +
  `export const COUNTRY_IANA_TLD_CROSSWALK = Object.freeze(${JSON.stringify(register.entries, null, 2)});\n`;
const output = path.join(root, outputPath);
if (process.argv.includes("--check")) {
  const current = await readFile(output, "utf8").catch(() => "");
  if (current !== generated) {
    console.error(`${outputPath} is stale; run node scripts/build-country-viewer-iana-cctlds.mjs`);
    process.exitCode = 1;
  } else {
    console.log(`${outputPath}: up to date`);
  }
} else {
  await writeFile(output, generated);
  console.log(`${outputPath}: ${uniqueTldCount} current IANA names, ${tldAliasCount} ISO assignments, ${shared.length} shared`);
}
