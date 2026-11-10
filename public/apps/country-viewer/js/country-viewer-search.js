import {
  COUNTRY_ISO_CROSSWALK,
  COUNTRY_ISO_DISPLAY_OVERRIDES,
  COUNTRY_SEARCH_ALIASES,
} from "./country-iso-crosswalk.js";
import { COUNTRY_IANA_TLD_CROSSWALK } from "./country-iana-cctlds.js";

const isoByCode = new Map(COUNTRY_ISO_CROSSWALK.map((entry) => [entry.isoAlpha2.toLowerCase(), entry]));
const isoNamesByFactbookCode = new Map();
const isoCodesByFactbookCode = new Map();
const ianaTldsByFactbookCode = new Map();
const ianaTldsByIsoCode = new Map();
const extraNamesByFactbookCode = new Map();

function appendNames(index, code, names) {
  const current = index.get(code) ?? [];
  current.push(...names);
  index.set(code, current);
}

for (const entry of COUNTRY_ISO_CROSSWALK) {
  for (const code of entry.factbookCodes) {
    appendNames(isoNamesByFactbookCode, code, entry.names);
    appendNames(isoCodesByFactbookCode, code, [entry.isoAlpha2]);
  }
}
for (const alias of COUNTRY_SEARCH_ALIASES) {
  appendNames(extraNamesByFactbookCode, alias.factbookCode, alias.names);
}
for (const entry of COUNTRY_IANA_TLD_CROSSWALK) {
  const tlds = entry.tlds.flatMap((tld) => [tld.sourceName, tld.ascii]);
  appendNames(ianaTldsByIsoCode, entry.isoAlpha2, tlds);
  for (const code of entry.factbookCodes) appendNames(ianaTldsByFactbookCode, code, tlds);
}

export function normalizeCountrySearchQuery(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function termMatches(value, raw, normalized) {
  const term = String(value ?? "");
  if (term.toLowerCase().includes(raw.toLowerCase())) return true;
  const normalizedTerm = normalizeCountrySearchQuery(term);
  return Boolean(normalized && normalizedTerm.includes(normalized));
}

function exactIanaTldMatches(query) {
  const key = String(query ?? "").trim().toLowerCase().replace(/^\./, "").replace(/\.$/, "");
  if (!key) return [];
  return COUNTRY_IANA_TLD_CROSSWALK.filter((entry) => entry.tlds.some((tld) =>
    [tld.sourceName, tld.ascii].some((value) => String(value).toLowerCase().replace(/^\./, "").replace(/\.$/, "") === key)));
}

export function countryDisplayName(country) {
  if (!country) return "";
  return COUNTRY_ISO_DISPLAY_OVERRIDES[country.code] || country.name;
}

export function countryIsoCodes(country) {
  if (!country) return [];
  return [...new Set(isoCodesByFactbookCode.get(country.code) ?? [])].sort();
}

export function countryIanaTlds(country) {
  if (!country) return [];
  return [...new Set(ianaTldsByFactbookCode.get(country.code) ?? [])].sort();
}

export function isoIanaTlds(isoAlpha2) {
  return [...new Set(ianaTldsByIsoCode.get(String(isoAlpha2 ?? "").toUpperCase()) ?? [])].sort();
}

export function sortByName(list) {
  return [...list].sort((a, b) => countryDisplayName(a).localeCompare(countryDisplayName(b)));
}

export function filterCountries(list, query) {
  const raw = String(query ?? "").trim();
  if (!raw) return [...list];
  const normalized = normalizeCountrySearchQuery(raw);
  const tldMatches = exactIanaTldMatches(raw);
  const explicitTld = raw.startsWith(".") || /^xn--/i.test(raw) ||
    (tldMatches.length > 0 && /[^\x00-\x7f]/.test(raw));
  if (!normalized && !explicitTld) return [];

  // A dotted domain (or IDN spelling) is an exact TLD lookup, never a fuzzy
  // substring search for the letters in that domain.
  if (explicitTld) {
    const codes = new Set(tldMatches.flatMap((entry) => entry.factbookCodes));
    return list.filter((country) => codes.has(country.code));
  }

  // A two-letter query may be a Factbook code, an ISO alpha-2 code, or an
  // IANA ccTLD alias. Preserve all exact matches so source-code collisions are
  // visible instead of silently misrouted.
  if (/^[a-z]{2}$/i.test(raw)) {
    const codes = new Set(list.filter((country) => country.code.toLowerCase() === raw.toLowerCase()).map((country) => country.code));
    const isoEntry = isoByCode.get(raw.toLowerCase());
    for (const code of isoEntry?.factbookCodes ?? []) codes.add(code);
    for (const entry of tldMatches) for (const code of entry.factbookCodes) codes.add(code);
    if (codes.size) return list.filter((country) => codes.has(country.code));
  }

  return list.filter((country) => {
    const terms = [
      country.name,
      countryDisplayName(country),
      country.capital?.name,
      ...(isoNamesByFactbookCode.get(country.code) ?? []),
      ...(extraNamesByFactbookCode.get(country.code) ?? []),
    ];
    return terms.some((term) => termMatches(term, raw, normalized));
  });
}

export function findUnprofiledIsoEntries(query, limit = 8) {
  const raw = String(query ?? "").trim();
  const normalized = normalizeCountrySearchQuery(raw);
  if (!raw) return [];

  if (raw.length < 2) return [];
  const exactCode = /^[a-z]{2}$/i.test(raw) ? raw.toLowerCase() : "";
  const tldMatches = exactIanaTldMatches(raw);
  const explicitTld = raw.startsWith(".") || /^xn--/i.test(raw) ||
    (tldMatches.length > 0 && /[^\x00-\x7f]/.test(raw));
  const exactTldIsoCodes = new Set(tldMatches.map((entry) => entry.isoAlpha2));
  const exactIdentifier = Boolean(exactCode || explicitTld);
  return COUNTRY_ISO_CROSSWALK
    .filter((entry) => entry.factbookCodes.length === 0 && (
      entry.isoAlpha2.toLowerCase() === exactCode ||
      exactTldIsoCodes.has(entry.isoAlpha2) ||
      (!exactIdentifier && entry.names.some((name) => termMatches(name, raw, normalized)))
    ))
    .slice(0, Math.max(0, limit));
}
