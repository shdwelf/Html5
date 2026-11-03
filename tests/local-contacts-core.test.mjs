import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contactsToBackup,
  contactsToCsv,
  normalizeContact,
  parseCsv,
  parseDirectoryText,
  searchContacts,
  sourceKey,
  validateContact,
} from "../js/local-contacts-core.js";

test("CSV parser handles BOM, quoted commas, escaped quotes, and embedded newlines", () => {
  const csv = '\uFEFFName,Address,City,Notes\r\n"Ada Lovelace","12, Main St",London,"Called the ""Analytical Engine"" address."\r\n"Grace Hopper",,New York,"line one\nline two"\r\n';
  const parsed = parseCsv(csv);
  assert.deepEqual(parsed.headers, ["Name", "Address", "City", "Notes"]);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].Address, "12, Main St");
  assert.equal(parsed.rows[0].Notes, 'Called the "Analytical Engine" address.');
  assert.equal(parsed.rows[1].Notes, "line one\nline two");
});

test("CSV import maps common directory columns and preserves postal codes as strings", () => {
  const csv = [
    "First Name,Last Name,Street Address,City,State,ZIP,Phone,Directory,Year,Page",
    "Ada,Lovelace,12 Main St,London,Greater London,01234,555-0100,Sample Directory,1958,17",
  ].join("\n");
  const result = parseDirectoryText(csv);
  assert.equal(result.contacts.length, 1);
  const contact = result.contacts[0];
  assert.equal(contact.name, "Ada Lovelace");
  assert.equal(contact.address1, "12 Main St");
  assert.equal(contact.region, "Greater London");
  assert.equal(contact.postalCode, "01234");
  assert.equal(typeof contact.postalCode, "string");
  assert.equal(contact.sourceTitle, "Sample Directory");
  assert.equal(contact.sourceYear, "1958");
  assert.equal(contact.page, "17");
});

test("import metadata fills missing source fields without replacing row provenance", () => {
  const csv = [
    "Name,Directory,Year,ZIP,Country",
    "A. Example,Printed Register,1942,00102,US",
    "B. Example,,,02108,France",
  ].join("\n");
  const result = parseDirectoryText(csv, {
    defaults: {
      sourceTitle: "Fallback directory",
      sourceYear: "1950",
      sourceEdition: "Volume 2",
      sourceRights: "User-provided licensed copy",
    },
  });
  assert.equal(result.contacts[0].sourceTitle, "Printed Register");
  assert.equal(result.contacts[0].sourceYear, "1942");
  assert.equal(result.contacts[1].sourceTitle, "Fallback directory");
  assert.equal(result.contacts[1].sourceYear, "1950");
  assert.equal(result.contacts[1].sourceEdition, "Volume 2");
  assert.equal(result.contacts[1].sourceRights, "User-provided licensed copy");
  assert.equal(result.contacts[1].countryCode, "France", "non-code country names are preserved without being misrepresented as ISO codes");
});

test("app JSON backup round-trips camel-case fields and retains ids and source notes", () => {
  const source = normalizeContact({
    id: "record-1",
    name: "Élodie Martin",
    kind: "organization",
    address1: "10 Rue Exemple",
    postalCode: "75001",
    countryCode: "fr",
    sourceTitle: "Paris directory",
    sourceEdition: "Winter issue",
    sourceYear: "1964",
    sourceRights: "Personal archival copy",
    notes: "Name spelling retained from source",
  });
  const backup = contactsToBackup([source], "2026-11-03T12:00:00.000Z");
  const restored = parseDirectoryText(JSON.stringify(backup), { format: "json" });
  assert.equal(restored.contacts.length, 1);
  assert.equal(restored.contacts[0].id, "record-1");
  assert.equal(restored.contacts[0].name, "Élodie Martin");
  assert.equal(restored.contacts[0].countryCode, "FR");
  assert.equal(restored.contacts[0].sourceTitle, "Paris directory");
  assert.equal(restored.contacts[0].sourceEdition, "Winter issue");
  assert.equal(restored.contacts[0].sourceYear, "1964");
  assert.equal(restored.contacts[0].sourceRights, "Personal archival copy");
});

test("CSV import preserves historical text and only skips rows without a listing name", () => {
  const result = parseDirectoryText("Name,Email,Latitude\nA Person,not-an-email,uncertain\n,person@example.test,42\nValid Person,valid@example.test,48.2\n");
  assert.equal(result.contacts.length, 2);
  assert.equal(result.contacts[0].email, "not-an-email");
  assert.equal(result.contacts[0].latitude, "uncertain");
  assert.equal(result.contacts[1].name, "Valid Person");
  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0].messages.join(" "), /name/);
});

test("search is accent-insensitive, requires every term, and supports source/year filters", () => {
  const contacts = [
    normalizeContact({ id: "1", name: "Élodie Martin", city: "Montréal", sourceTitle: "Directory A", sourceYear: "1964" }),
    normalizeContact({ id: "2", name: "Elodie Martin", city: "Paris", sourceTitle: "Directory B", sourceYear: "1972" }),
    normalizeContact({ id: "3", name: "Martin & Sons", city: "Montréal", sourceTitle: "Directory A", sourceYear: "1964" }),
  ];
  assert.deepEqual(searchContacts(contacts, "elodie montreal").map((record) => record.id), ["1"]);
  assert.deepEqual(searchContacts(contacts, "martin", { year: "1964" }).map((record) => record.id).sort(), ["1", "3"]);
  assert.deepEqual(searchContacts(contacts, "elodie", { source: sourceKey(contacts[1]) }).map((record) => record.id), ["2"]);
  assert.equal(searchContacts(contacts, "not a match").length, 0);
});

test("CSV export escapes fields and can be imported without losing ordinary source metadata", () => {
  const original = normalizeContact({
    name: 'A. Person, Jr.',
    organization: 'Example "Books"',
    city: "New York",
    postalCode: "00501",
    sourceTitle: "The, Directory",
    sourceYear: "1931",
    notes: "First line\nsecond line",
  });
  const csv = contactsToCsv([original]);
  const parsed = parseDirectoryText(csv);
  assert.equal(parsed.contacts.length, 1);
  assert.equal(parsed.contacts[0].name, original.name);
  assert.equal(parsed.contacts[0].organization, original.organization);
  assert.equal(parsed.contacts[0].postalCode, "00501");
  assert.equal(parsed.contacts[0].sourceTitle, "The, Directory");
  assert.equal(parsed.contacts[0].notes, "First line\nsecond line");
});

test("CSV export neutralizes spreadsheet formulas; JSON backup remains exact", () => {
  const contact = normalizeContact({ name: "=1+1", notes: "@SUM(1,2)" });
  const csv = contactsToCsv([contact]);
  const importedCsv = parseDirectoryText(csv).contacts[0];
  assert.equal(importedCsv.name, "'=1+1");
  assert.equal(importedCsv.notes, "'@SUM(1,2)");
  const backup = contactsToBackup([contact]);
  assert.equal(backup.contacts[0].name, "=1+1");
  assert.equal(backup.contacts[0].notes, "@SUM(1,2)");
});

test("only the listing label is required; historical contact fields stay verbatim", () => {
  assert.deepEqual(validateContact({ name: "", email: "", latitude: "", longitude: "" }), ["A name or listing label is required."]);
  assert.deepEqual(validateContact({ name: "Record", email: "as printed", latitude: "uncertain", longitude: "2.3522E0" }), []);
});

test("duplicate listings are retained as independent records", () => {
  const first = normalizeContact({ id: "one", name: "Same Name", city: "Boston" });
  const second = normalizeContact({ id: "two", name: "Same Name", city: "Boston" });
  const found = searchContacts([first, second], "same name");
  assert.equal(found.length, 2);
  assert.notEqual(found[0].id, found[1].id);
});
