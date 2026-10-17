#!/usr/bin/env node
/**
 * Export the family/person JSON embedded in greeran-family-4dwm.html as GEDCOM 5.5.1.
 * This is a baseline export only: it does not merge first-name data or infer missing
 * names. Missing person records referenced by a family are retained as blank stubs.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_LINE_LENGTH = 248;
const EXPORT_DATE = "16 OCT 2026";

function extractJsonConstant(html, name, nextMarker) {
  const marker = `const ${name}=`;
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`Could not find ${marker}`);
  const valueStart = start + marker.length;
  const end = html.indexOf(nextMarker, valueStart);
  if (end < 0) throw new Error(`Could not find end marker for ${name}`);
  let source = html.slice(valueStart, end).trim();
  if (source.endsWith(";")) source = source.slice(0, -1).trimEnd();
  const value = JSON.parse(source);
  if (!Array.isArray(value)) throw new Error(`${name} is not an array`);
  return value;
}

export function readEmbeddedGreeranTree(html) {
  const people = extractJsonConstant(html, "PEOPLE", "const FAMILIES=");
  const families = extractJsonConstant(html, "FAMILIES", "// ══════════ LOOKUP MAPS");
  const peopleIds = new Set();
  const familyIds = new Set();

  for (const person of people) {
    if (!/^@[A-Z0-9]+@$/.test(person.id ?? "")) {
      throw new Error(`Invalid person cross-reference: ${String(person.id)}`);
    }
    if (peopleIds.has(person.id)) throw new Error(`Duplicate person cross-reference: ${person.id}`);
    peopleIds.add(person.id);
  }
  for (const family of families) {
    if (!/^@[A-Z0-9]+@$/.test(family.id ?? "")) {
      throw new Error(`Invalid family cross-reference: ${String(family.id)}`);
    }
    if (familyIds.has(family.id)) throw new Error(`Duplicate family cross-reference: ${family.id}`);
    familyIds.add(family.id);
  }

  const missingPersonIds = new Set();
  for (const family of families) {
    for (const personId of [family.h, family.w, ...(family.ch ?? [])]) {
      if (personId && !peopleIds.has(personId)) missingPersonIds.add(personId);
    }
  }
  for (const person of people) {
    for (const familyId of [...(person.fams ?? []), ...(person.famc ?? [])]) {
      if (!familyIds.has(familyId)) throw new Error(`Unknown family ${familyId} referenced by ${person.id}`);
    }
  }

  return { people, families, missingPersonIds: [...missingPersonIds].sort() };
}

function cleanText(value) {
  return String(value)
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ");
}

function appendText(lines, level, tag, value) {
  const paragraphs = cleanText(value).split("\n");
  paragraphs.forEach((paragraph, paragraphIndex) => {
    let text = paragraph;
    let prefix = paragraphIndex === 0 ? `${level} ${tag} ` : `${level + 1} CONT `;
    if (text.length === 0) {
      lines.push(prefix.trimEnd());
      return;
    }
    while (prefix.length + text.length > MAX_LINE_LENGTH) {
      const available = MAX_LINE_LENGTH - prefix.length;
      let splitAt = text.lastIndexOf(" ", available);
      if (splitAt <= 0) splitAt = available;
      else splitAt += 1; // Keep a word-separating space when CONC joins the next line.
      lines.push(prefix + text.slice(0, splitAt));
      text = text.slice(splitAt);
      prefix = `${level + 1} CONC `;
    }
    lines.push(prefix + text);
  });
}

function appendEvent(lines, level, tag, date, place) {
  if (!date && !place) return;
  lines.push(`${level} ${tag}`);
  if (date) appendText(lines, level + 1, "DATE", date);
  if (place) appendText(lines, level + 1, "PLAC", place);
}

export function buildGreeranGedcom(html) {
  const { people, families, missingPersonIds } = readEmbeddedGreeranTree(html);
  const lines = [
    "0 HEAD",
    "1 SOUR Greeran Family Tree 4DWM",
    "2 NAME Embedded-data baseline export",
    "2 VERS 1.0.0",
    `1 DATE ${EXPORT_DATE}`,
    "1 FILE greeran-family-4dwm.ged",
    "1 GEDC",
    "2 VERS 5.5.1",
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
    "1 SUBM @SUB1@",
  ];
  appendText(
    lines,
    1,
    "NOTE",
    "Baseline GEDCOM export from the PEOPLE and FAMILIES arrays embedded in greeran-family-4dwm.html. No raw source GEDCOM was available; no Kirkpatrick or first-name-meaning data has been merged.",
  );
  appendText(
    lines,
    1,
    "NOTE",
    `The embedded source contains ${people.length} people and ${families.length} families. Any blank INDI stub is retained only to preserve an existing family reference.`,
  );

  lines.push("0 @SUB1@ SUBM");
  lines.push("1 NAME Greeran Family Tree data export");

  const peopleById = new Map(people.map((person) => [person.id, person]));
  const individuals = [...people];
  for (const id of missingPersonIds) {
    individuals.push({ id, _missingReferenceStub: true });
  }

  for (const person of individuals) {
    lines.push(`0 ${person.id} INDI`);
    if (person.n) appendText(lines, 1, "NAME", person.n);
    if (person.s === "M" || person.s === "F") lines.push(`1 SEX ${person.s}`);
    appendEvent(lines, 1, "BIRT", person.bd, person.bp);
    appendEvent(lines, 1, "DEAT", person.dd, person.dp);
    if (person.oc) appendText(lines, 1, "OCCU", person.oc);
    if (person.nt) appendText(lines, 1, "NOTE", person.nt);
    if (Number.isFinite(person.lat)) appendText(lines, 1, "_LAT", String(person.lat));
    if (Number.isFinite(person.lon)) appendText(lines, 1, "_LON", String(person.lon));
    if (person._missingReferenceStub) {
      appendText(lines, 1, "NOTE", "Blank placeholder: this identifier is referenced by an embedded family record, but no person record or name was present in the source array.");
    }
    for (const familyId of person.famc ?? []) lines.push(`1 FAMC ${familyId}`);
    for (const familyId of person.fams ?? []) lines.push(`1 FAMS ${familyId}`);
  }

  for (const family of families) {
    lines.push(`0 ${family.id} FAM`);
    if (family.h) lines.push(`1 HUSB ${family.h}`);
    if (family.w) lines.push(`1 WIFE ${family.w}`);
    for (const childId of family.ch ?? []) lines.push(`1 CHIL ${childId}`);
    appendEvent(lines, 1, "MARR", family.md, family.mp);
  }
  lines.push("0 TRLR");

  return {
    text: `${lines.join("\n")}\n`,
    stats: {
      sourcePeople: people.length,
      families: families.length,
      missingPersonIds,
      exportedIndividuals: individuals.length,
      familyRefsPreserved: families.reduce(
        (count, family) => count + Number(Boolean(family.h)) + Number(Boolean(family.w)) + (family.ch?.length ?? 0),
        0,
      ),
      peopleByIdSize: peopleById.size,
    },
  };
}

async function main() {
  const source = path.join(root, "greeran-family-4dwm.html");
  const output = path.join(root, "greeran-family-4dwm.ged");
  const html = await readFile(source, "utf8");
  const { text, stats } = buildGreeranGedcom(html);
  if (process.argv.includes("--check")) {
    const existing = await readFile(output, "utf8");
    if (existing !== text) throw new Error(`${path.basename(output)} is stale; run node tools/greeran-family-export.mjs`);
  } else {
    await writeFile(output, text, "utf8");
  }
  console.log(`GEDCOM: ${path.basename(output)} (${stats.exportedIndividuals} INDI, ${stats.families} FAM)`);
  console.log(`  source people: ${stats.sourcePeople}; blank reference stubs: ${stats.missingPersonIds.length}`);
  console.log(`  family links preserved: ${stats.familyRefsPreserved}`);
  if (stats.missingPersonIds.length) console.log(`  unresolved person IDs: ${stats.missingPersonIds.join(", ")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
