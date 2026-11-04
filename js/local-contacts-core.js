export const CONTACT_FIELDS = Object.freeze([
  "name",
  "kind",
  "organization",
  "eventName",
  "booth",
  "productCategory",
  "scanDate",
  "address1",
  "address2",
  "city",
  "region",
  "postalCode",
  "countryCode",
  "phone",
  "email",
  "sourceTitle",
  "sourceEdition",
  "sourceYear",
  "page",
  "sourceUrl",
  "sourceRights",
  "latitude",
  "longitude",
  "notes",
]);

export const CSV_HEADERS = Object.freeze([
  "name",
  "kind",
  "organization",
  "event_name",
  "booth",
  "product_category",
  "scan_date",
  "address_line_1",
  "address_line_2",
  "city",
  "region",
  "postal_code",
  "country_code",
  "phone",
  "email",
  "source_title",
  "source_edition",
  "source_year",
  "page",
  "source_url",
  "source_rights",
  "latitude",
  "longitude",
  "notes",
]);

const HEADER_ALIASES = new Map();
const addAliases = (field, aliases) => {
  for (const alias of aliases) HEADER_ALIASES.set(normalizeHeader(alias), field);
};

addAliases("name", ["name", "full name", "display name", "contact name", "person", "person name", "individual", "business name", "listing"]);
addAliases("firstName", ["first name", "first", "given name", "forename"]);
addAliases("lastName", ["last name", "last", "surname", "family name"]);
addAliases("kind", ["kind", "type", "record type", "category"]);
addAliases("organization", ["organization", "organisation", "company", "business", "institution", "employer", "firm"]);
addAliases("eventName", ["event", "event name", "event title", "show", "show name", "conference", "conference name", "trade show"]);
addAliases("booth", ["booth", "booth number", "booth no", "stand", "stand number", "exhibit booth"]);
addAliases("productCategory", ["product category", "product service category", "product/service category", "supplier category", "service category", "product or service", "products and services", "industry", "solution category"]);
addAliases("scanDate", ["scan date", "scan date time", "badge scan date", "badge scan time", "badge scanned at", "date scanned", "scanned date", "scanned at", "scan timestamp"]);
addAliases("address1", ["address", "street", "street address", "address 1", "address line 1", "address1", "street 1", "street1"]);
addAliases("address2", ["address 2", "address line 2", "address2", "street 2", "street2", "suite", "unit", "apartment"]);
addAliases("city", ["city", "town", "locality", "place"]);
addAliases("region", ["region", "state", "province", "county", "territory", "state province"]);
addAliases("postalCode", ["zip", "zip code", "zipcode", "zip 4", "zip plus 4", "postal", "postal code", "postcode", "post code"]);
addAliases("countryCode", ["country", "country code", "country iso", "iso country", "iso alpha 2", "iso2", "alpha 2"]);
addAliases("phone", ["phone", "telephone", "telephone number", "tel", "phone number", "mobile"]);
addAliases("email", ["email", "e mail", "email address"]);
addAliases("sourceTitle", ["source", "source title", "directory", "directory title", "book title", "publication", "source name"]);
addAliases("sourceEdition", ["source edition", "edition", "directory edition", "issue", "volume", "volume edition"]);
addAliases("sourceYear", ["source year", "year", "edition year", "directory year", "publication year"]);
addAliases("page", ["page", "page number", "page no", "folio"]);
addAliases("sourceUrl", ["source url", "source link", "url", "archive url", "catalog url"]);
addAliases("sourceRights", ["rights", "source rights", "license", "licence", "copyright", "rights statement"]);
addAliases("latitude", ["latitude", "lat"]);
addAliases("longitude", ["longitude", "lon", "lng"]);
addAliases("notes", ["notes", "note", "comments", "description", "memo"]);

const SEARCH_FIELDS = Object.freeze([
  "name", "kind", "organization", "eventName", "booth", "productCategory", "scanDate",
  "address1", "address2", "city", "region", "postalCode", "countryCode", "phone", "email",
  "sourceTitle", "sourceEdition", "sourceYear", "page", "notes",
]);

const HEADER_TO_CSV = Object.freeze(Object.fromEntries(
  CSV_HEADERS.map((header, index) => [CONTACT_FIELDS[index], header])
));

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}@.+-]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value).trim();
}

function fieldMapFromObject(input = {}) {
  const mapped = {};
  for (const [key, value] of Object.entries(input)) {
    const field = HEADER_ALIASES.get(normalizeHeader(key));
    if (field && !mapped[field]) mapped[field] = cleanValue(value);
  }
  return mapped;
}

export function normalizeContact(input = {}, defaults = {}) {
  const mapped = fieldMapFromObject(input);
  if (!mapped.name?.trim()) {
    mapped.name = [mapped.firstName, mapped.lastName].filter(Boolean).join(" ") || mapped.organization || "";
  }
  const defaultFields = fieldMapFromObject(defaults);
  const contact = {};

  for (const field of CONTACT_FIELDS) {
    const value = mapped[field] || defaultFields[field] || "";
    contact[field] = field === "countryCode" && /^[a-z]{2}$/i.test(value.trim())
      ? value.trim().toUpperCase()
      : value.trim();
  }

  const kind = normalizeText(contact.kind);
  contact.kind = ["person", "business", "organization", "institution", "other"].includes(kind)
    ? kind
    : "person";

  // ZIP/postal codes deliberately remain text, preserving leading zeroes and
  // historical formats. This app stores them; it does not validate delivery.
  contact.postalCode = String(contact.postalCode ?? "").trim();
  contact.id = cleanValue(input.id) || "";
  return contact;
}

export function validateContact(contact) {
  // Historical transcriptions are intentionally permissive: malformed OCR,
  // legacy phone/email notation, and uncertain coordinates should be retained
  // verbatim rather than causing an otherwise useful listing to be discarded.
  return cleanValue(contact?.name) ? [] : ["A name or listing label is required."];
}

export function parseCsv(text) {
  const source = String(text ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"' && value.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      value += char;
    }
  }

  if (quoted) throw new Error("The CSV ends inside a quoted field.");
  if (value.length || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  if (!rows.length) return { headers: [], rows: [] };

  const headers = rows.shift().map((header) => header.trim());
  const records = rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  return { headers, rows: records };
}

function extractJsonRecords(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.contacts)) return value.contacts;
  if (value && Array.isArray(value.records)) return value.records;
  throw new Error("JSON must be a contact array or an export with a contacts array.");
}

export function parseDirectoryText(text, { format = "csv", defaults = {} } = {}) {
  if (format.toLowerCase() === "json") {
    const payload = JSON.parse(String(text ?? ""));
    const records = extractJsonRecords(payload);
    const contacts = [];
    const issues = [];
    records.forEach((record, index) => {
      const contact = normalizeContact(record, defaults);
      const errors = validateContact(contact);
      if (errors.length) issues.push({ row: index + 1, messages: errors });
      else contacts.push(contact);
    });
    return { headers: Object.keys(records[0] ?? {}), contacts, issues, totalRows: records.length };
  }

  const parsed = parseCsv(text);
  const contacts = [];
  const issues = [];
  parsed.rows.forEach((record, index) => {
    const contact = normalizeContact(record, defaults);
    const errors = validateContact(contact);
    if (errors.length) issues.push({ row: index + 2, messages: errors });
    else contacts.push(contact);
  });
  return { headers: parsed.headers, contacts, issues, totalRows: parsed.rows.length };
}

export function searchContacts(contacts, query = "", { year = "", source = "", kind = "", event = "", limit = Infinity } = {}) {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  const filtered = [];
  for (const contact of contacts) {
    if (year && contact.sourceYear !== year) continue;
    if (source && sourceKey(contact) !== source) continue;
    if (kind && contact.kind !== kind) continue;
    if (event && String(contact.eventName ?? "").trim() !== event) continue;
    if (terms.length) {
      const haystack = normalizeText(SEARCH_FIELDS.map((field) => contact[field] || "").join(" "));
      if (!terms.every((term) => haystack.includes(term))) continue;
    }
    filtered.push(contact);
  }
  filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return Number.isFinite(limit) ? filtered.slice(0, Math.max(0, limit)) : filtered;
}

export function sourceKey(contact) {
  return [contact.sourceTitle, contact.sourceEdition, contact.sourceYear]
    .map((value) => String(value ?? "").trim())
    .join("\u001f");
}

export function sourceLabel(contact) {
  const parts = [contact.sourceTitle, contact.sourceEdition, contact.sourceYear].filter(Boolean);
  return parts.join(" · ") || "Manual / unspecified source";
}

export function escapeCsv(value) {
  let text = String(value ?? "");
  // Avoid spreadsheet formula execution when someone opens an exported CSV.
  // JSON backup remains the lossless format; this apostrophe is intentional.
  if (/^[\u0000-\u0020]*[=+@-]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function contactsToCsv(contacts) {
  const lines = [CSV_HEADERS.map(escapeCsv).join(",")];
  for (const contact of contacts) {
    const values = CONTACT_FIELDS.map((field) => contact[field] ?? "");
    lines.push(values.map(escapeCsv).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function contactsToBackup(contacts, exportedAt = new Date().toISOString()) {
  return {
    schemaVersion: 1,
    exportedAt,
    contacts: contacts.map((contact) => ({ ...contact })),
  };
}

export function sourceSummary(contacts) {
  const sources = new Map();
  for (const contact of contacts) {
    const key = sourceKey(contact);
    if (!sources.has(key)) sources.set(key, sourceLabel(contact));
  }
  return [...sources.entries()].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
}

export function makeContactId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `contact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function csvHeaderForField(field) {
  return HEADER_TO_CSV[field] ?? field;
}
