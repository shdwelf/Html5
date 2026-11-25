import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRIES } from "../js/country-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registerPath = "resources/country-viewer/country-iso-crosswalk-register-2026-11-09.json";
const outputPath = "js/country-iso-crosswalk.js";
const register = JSON.parse(await readFile(path.join(root, registerPath), "utf8"));

if (register.schema !== "html5.country-viewer.iso-crosswalk/v1") throw new Error("unsupported ISO crosswalk schema");
if (register.reviewDate !== "2026-11-09") throw new Error("ISO crosswalk review date must remain 2026-11-09");
if (!Array.isArray(register.entries) || register.entries.length !== 250) throw new Error("expected the complete 250-entry ISO name register");

const knownFactbookCodes = new Set(COUNTRIES.map((country) => country.code));
const isoCodes = new Set();
for (const entry of register.entries) {
  if (!/^[A-Z]{2}$/.test(entry.isoAlpha2) || isoCodes.has(entry.isoAlpha2)) throw new Error(`invalid/duplicate ISO code: ${entry.isoAlpha2}`);
  isoCodes.add(entry.isoAlpha2);
  if (!Array.isArray(entry.names) || entry.names.length < 1 || entry.names.some((name) => typeof name !== "string" || !name.trim())) {
    throw new Error(`${entry.isoAlpha2}: expected one or more source names`);
  }
  if (!Array.isArray(entry.factbookCodes)) throw new Error(`${entry.isoAlpha2}: factbookCodes must be an array`);
  for (const code of entry.factbookCodes) {
    if (!knownFactbookCodes.has(code)) throw new Error(`${entry.isoAlpha2}: unknown Factbook code ${code}`);
  }
  if (!entry.factbookCodes.length && entry.mapping !== "no-separate-profile") {
    throw new Error(`${entry.isoAlpha2}: missing profile must stay explicit and searchable as an ISO-only name`);
  }
}
for (const item of [...register.displayOverrides, ...register.searchAliases]) {
  if (!knownFactbookCodes.has(item.factbookCode)) throw new Error(`unknown Factbook code in overlay: ${item.factbookCode}`);
}
const unmapped = register.entries.filter((entry) => entry.factbookCodes.length === 0).length;
const mapped = register.entries.length - unmapped;
if (register.comparison.counts.isoNameEntries !== register.entries.length ||
    register.comparison.counts.mappedIsoEntries !== mapped ||
    register.comparison.counts.unmappedIsoEntries !== unmapped) {
  throw new Error("crosswalk summary counts do not match the reviewed entries");
}

const displayOverrides = Object.fromEntries(register.displayOverrides.map(({ factbookCode, displayName }) => [factbookCode, displayName]));
const sourceMeta = {
  reviewDate: register.reviewDate,
  source: register.source,
  counts: register.comparison.counts,
  unmappedPolicy: register.comparison.unmappedPolicy,
};
const generated = `// Generated from ${registerPath}; edit the source register, then run the builder.\n` +
  `export const COUNTRY_ISO_REGISTER_META = Object.freeze(${JSON.stringify(sourceMeta, null, 2)});\n\n` +
  `export const COUNTRY_ISO_CROSSWALK = Object.freeze(${JSON.stringify(register.entries, null, 2)});\n\n` +
  `export const COUNTRY_ISO_DISPLAY_OVERRIDES = Object.freeze(${JSON.stringify(displayOverrides, null, 2)});\n\n` +
  `export const COUNTRY_SEARCH_ALIASES = Object.freeze(${JSON.stringify(register.searchAliases, null, 2)});\n`;
const output = path.join(root, outputPath);
if (process.argv.includes("--check")) {
  const current = await readFile(output, "utf8").catch(() => "");
  if (current !== generated) {
    console.error(`${outputPath} is stale; run node scripts/build-country-viewer-iso-crosswalk.mjs`);
    process.exitCode = 1;
  } else {
    console.log(`${outputPath}: up to date`);
  }
} else {
  await writeFile(output, generated);
  console.log(`${outputPath}: ${register.entries.length} ISO names, ${mapped} mapped profiles, ${unmapped} ISO-only entries`);
}
