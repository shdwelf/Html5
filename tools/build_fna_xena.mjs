/**
 * build_fna_xena.mjs — Xena-inspired preservation bag for FIRST NAME ALMANAC
 * v1.02b (Kenneth G. Kirkpatrick shareware, `samples/archive/kirkpatrick/FNA102B.ZIP`).
 *
 * Follows the house pattern set by `tools/build_virus_xena.mjs` and
 * `docs/geomate-gpx-preservation.md`: a BagIt 1.0 bag that retains the source
 * objects it is allowed to retain, adds documented normalized renditions, and
 * records a preservation event with SHA-256 payload and tag manifests. It is
 * Xena-*inspired* (source object + rendition + preservation event); it is NOT
 * processed by Xena and is not a native .xena object.
 *
 * What is preserved
 *   - INSTALL.COM        — preserved verbatim; analyzed statically with the
 *                          vendored Ghidra WASM decompiler (no JVM, no
 *                          execution of the DOS code) plus the repo's own
 *                          `tools/exe_triage.py` observations.
 *   - FILE_ID.DIZ        — preserved verbatim + CP437 -> UTF-8 rendition.
 *   - SYSOP.DOC          — preserved verbatim + CP437 -> UTF-8 rendition.
 *   - MEANINGS.OVL       — RETAINED IN PLACE, referenced by SHA-256 only.
 *   - NAMES.OVL          — RETAINED IN PLACE, referenced by SHA-256 only.
 *
 * The two `.OVL` volumes are the two halves of a split ARJ archive whose
 * members are GARBLED (password-transformed). They are recorded, hashed and
 * format-identified, and then left alone: no member is decrypted, no garble key
 * is sought, and no name data is copied. See the "KGK.ARJ inspection" section
 * of docs/greeran-family-tree-ebook-and-data-status.md for the standing
 * decision and its provenance.
 *
 *   node tools/build_fna_xena.mjs [outdir]
 */

import { createHash } from "node:crypto";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(root, process.argv[2] || "dist/fna102b-xena");
const ZIP_REL = "samples/archive/kirkpatrick/FNA102B.ZIP";
/** From samples/archive/PROVENANCE.md — the bag refuses to build if it drifts. */
const ZIP_SHA256 = "341271dbce5aa7ed864fd9fd2d9fd41c1c17f2ccaf524178ac945ad1e9d94caf";
const NOW = "2026-10-17T00:00:00Z";
const TOOL = "tools/build_fna_xena.mjs";

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const crc32Hex = (n) => (n >>> 0).toString(16).padStart(8, "0").toUpperCase();
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

/* ------------------------------------------------------------- CP437 -> UTF-8 */

const CP437_HIGH = (
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»" +
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
  "αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■"
).split("");

function cp437ToUtf8(buf) {
  let out = "";
  for (const b of buf) out += b < 0x80 ? String.fromCharCode(b) : (CP437_HIGH[b - 0x80] ?? "\uFFFD");
  return out.replace(/\r\n/g, "\n");
}

/* ------------------------------------------------------------ minimal ZIP read */

function readZip(buf) {
  // End of central directory record, scanned from the tail.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("EOCD not found: not a ZIP");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad central header at ${p}`);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    // Entry names here are 8.3 ASCII; latin1 is a byte-faithful decode.
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("latin1");
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + csize);
    let data;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) data = inflateRawSync(raw);
    else throw new Error(`${name}: unsupported ZIP method ${method}`);
    if (data.length !== usize) throw new Error(`${name}: inflated ${data.length}, header says ${usize}`);
    entries.push({ name, method, crc32: crc, compressedSize: csize, originalSize: usize, data });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/* --------------------------------------------------------------- DOS analysis */

function mzHeader(b) {
  if (b.readUInt16LE(0) !== 0x5a4d) return null;
  const cblp = b.readUInt16LE(2), cp = b.readUInt16LE(4), hdrParas = b.readUInt16LE(8);
  // Image bytes = cp*512, less the unused tail of the last page, less the header.
  const imageSize = cp * 512 - (cblp ? 512 - cblp : 0) - hdrParas * 16;
  return {
    magic: "MZ",
    pages: cp, lastPageSize: cblp, headerParagraphs: hdrParas,
    minAlloc: b.readUInt16LE(10), maxAlloc: b.readUInt16LE(12),
    ss: b.readUInt16LE(14), sp: b.readUInt16LE(16),
    checksum: b.readUInt16LE(18), ip: b.readUInt16LE(20), cs: b.readUInt16LE(22),
    relocOffset: b.readUInt16LE(24),
    loadModuleSize: imageSize,
    entryCsIp: `0x${b.readUInt16LE(22).toString(16).toUpperCase()}:0x${b.readUInt16LE(20).toString(16).toUpperCase()}`,
  };
}

function stringsOf(b, min = 4) {
  const out = [];
  let run = "";
  for (let i = 0; i <= b.length; i++) {
    const c = i < b.length ? b[i] : 0;
    if (c >= 0x20 && c <= 0x7e) { run += String.fromCharCode(c); continue; }
    if (run.length >= min) out.push({ offset: i - run.length, text: run });
    run = "";
  }
  return out;
}

/* ------------------------------------------------------------------ renditions */

/** Per-member preservation record: what it is, what was done, what was not. */
function memberRecord(e) {
  const rec = {
    name: e.name,
    zipMethod: e.method === 0 ? "stored" : "deflate",
    compressedSize: e.compressedSize,
    originalSize: e.originalSize,
    zipCrc32: crc32Hex(e.crc32),
    sha256: sha256(e.data),
  };
  switch (e.name) {
    case "INSTALL.COM":
      return { ...rec, format: "DOS MZ executable, 16-bit x86 real mode",
        action: "preserved", rendition: "normalized/install-com-ghidra.txt" };
    case "FILE_ID.DIZ":
      return { ...rec, format: "MS-DOS text, CP437",
        action: "preserved", rendition: "normalized/file-id-diz.txt" };
    case "SYSOP.DOC":
      return { ...rec, format: "MS-DOS text, CP437",
        action: "preserved", rendition: "normalized/sysop-doc.txt" };
    default:
      return { ...rec, format: "ARJ archive volume segment (split archive, revision 4)",
        action: "retained-in-place", rendition: null,
        encrypted: true, decrypted: false,
        note: "Half of a two-part ARJ archive whose members carry the GARBLED "
          + "flag. Recorded and hashed only: no member was decrypted, no garble "
          + "key was sought, and no name data was copied. The redistribution "
          + "notice in SYSOP.DOC limits use to the original form." };
  }
}

function catalogXml(records, zipSha) {
  const body = records.map((r) => `  <member name="${esc(r.name)}" action="${esc(r.action)}"${r.encrypted ? ' encrypted="true" decrypted="false"' : ""}>
    <format>${esc(r.format)}</format>
    <zip method="${esc(r.zipMethod)}" compressed="${r.compressedSize}" original="${r.originalSize}" crc32="${esc(r.zipCrc32)}"/>
    <sha256>${r.sha256}</sha256>
${r.rendition ? `    <rendition>${esc(r.rendition)}</rendition>\n` : ""}${r.note ? `    <note>${esc(r.note)}</note>\n` : ""}  </member>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Application-defined normalized rendition of the FIRST NAME ALMANAC v1.02b
     shareware archive. Schema is app-defined (see the companion doc); this is
     a Xena-inspired rendition, not a native Xena object. The two .OVL volumes
     are recorded, not decrypted. -->
<fnaArchive xmlns="urn:shdwelf:html5:fna-preservation:1" generated="${NOW}" tool="${TOOL}"
    container="${esc(ZIP_REL)}" containerSha256="${zipSha}" members="${records.length}">
  <product>
    <title>FIRST NAME ALMANAC</title>
    <version>1.02b</version>
    <released>1993-12</released>
    <author>Kenneth G. Kirkpatrick &lt;ASP&gt;</author>
    <licence>Shareware; SYSOP.DOC permits redistribution only in its ORIGINAL FORM
      with all copyright notices and files in place.</licence>
  </product>
${body}
</fnaArchive>
`;
}

function preservationEvent(records) {
  return JSON.stringify({
    eventType: "normalization",
    tool: TOOL,
    timestamp: NOW,
    outcome: "success",
    source: ZIP_REL,
    description:
      "Read the FIRST NAME ALMANAC v1.02b shareware ZIP, verified it against the "
      + "SHA-256 recorded in samples/archive/PROVENANCE.md, and normalized the "
      + "three unprotected members: INSTALL.COM is preserved verbatim with a "
      + "static Ghidra-WASM decompilation of its MZ entry point and a string "
      + "table; FILE_ID.DIZ and SYSOP.DOC are preserved verbatim with CP437 -> "
      + "UTF-8 renditions. The two .OVL volumes (a split ARJ archive whose "
      + "members are GARBLED) are recorded by hash and format identification "
      + "only, and were neither decrypted nor copied.",
    exclusions: {
      decrypted: [],
      retainedInPlace: records.filter((r) => r.action === "retained-in-place").map((r) => r.name),
      reason:
        "The GARBLED transform is the author's password protection over a "
        + "commercial database whose redistribution notice limits use to the "
        + "original form. No garble key was sought or derived.",
    },
    xenaRelationship:
      "Xena-inspired (source object + documented rendition + preservation "
      + "event). Not processed by Xena; not a native .xena object.",
    counts: {
      members: records.length,
      preserved: records.filter((r) => r.action === "preserved").length,
      retainedInPlace: records.filter((r) => r.action === "retained-in-place").length,
    },
  }, null, 2) + "\n";
}

/* ------------------------------------------------------------------------ main */

async function main() {
  const zipBuf = await readFile(path.join(root, ZIP_REL));
  const zipSha = sha256(zipBuf);
  if (zipSha !== ZIP_SHA256) {
    throw new Error(`${ZIP_REL} SHA-256 drifted from PROVENANCE.md:\n  got ${zipSha}\n  want ${ZIP_SHA256}`);
  }
  const entries = readZip(zipBuf);
  const records = entries.map(memberRecord);

  const install = entries.find((e) => e.name === "INSTALL.COM");
  if (!install) throw new Error("INSTALL.COM missing from the archive");

  // data/original — the source objects the notice lets us retain verbatim.
  const payload = new Map();
  for (const e of entries) {
    const rec = records.find((r) => r.name === e.name);
    if (rec.action !== "preserved") continue;   // .OVL volumes stay in samples/
    payload.set(`data/original/${e.name}`, e.data);
  }
  payload.set("data/original/fna102b-zip-manifest.json", Buffer.from(JSON.stringify({
    generated: NOW, container: ZIP_REL, containerSha256: zipSha,
    containerBytes: zipBuf.length, entries: records,
  }, null, 2) + "\n"));

  // data/normalized — the renditions.
  payload.set("data/normalized/file-id-diz.txt",
    Buffer.from(cp437ToUtf8(entries.find((e) => e.name === "FILE_ID.DIZ").data)));
  payload.set("data/normalized/sysop-doc.txt",
    Buffer.from(cp437ToUtf8(entries.find((e) => e.name === "SYSOP.DOC").data)));

  const mz = mzHeader(install.data);
  const installPath = path.join(OUT, "data/original/INSTALL.COM");
  await mkdir(path.dirname(installPath), { recursive: true });
  await writeFile(installPath, install.data);
  // Static analysis only: the vendored Ghidra WASM decompiler parses and
  // decompiles the image; the DOS code is never run.
  const proc = spawnSync(process.execPath, [path.join(root, "tools/decompile_mz.mjs"), installPath],
    { cwd: root, encoding: "utf8" });
  if (proc.status !== 0) throw new Error(`decompile_mz.mjs exited ${proc.status}: ${proc.stderr}`);
  // stderr carries the loader's own MZ parse; stdout is the decompiled entry point.
  const decomp = [proc.stderr.trim(), "", proc.stdout.trim()].filter(Boolean).join("\n") + "\n";
  const strs = stringsOf(install.data);
  const triage = [
    `# INSTALL.COM — static preservation analysis`,
    `# source: ${ZIP_REL}!INSTALL.COM (${install.data.length} bytes)`,
    `# sha256: ${sha256(install.data)}`,
    `# MZ header: ${JSON.stringify(mz)}`,
    `# e_csum check: see tools/exe_triage.py (stored checksum does not match the image)`,
    `# packer probe: tools/pklite.py info -> "not PKLITE-compressed"`,
    `#   the entry stub does carry an integrity-check error path that prints`,
    `#   "Packed file is corrupt" then INT 21h / exit(0xFF); the packer was not`,
    `#   identified and the stub was NOT unpacked.`,
    `# strings (${strs.length} runs >= 4 printable bytes):`,
    ...strs.map((s) => `  ${String(s.offset).padStart(5)}  ${s.text}`),
    `# no garble key appears in the plaintext string table; the invocation`,
    `# template at offset 3022 is "KGK -Y -g".`,
    ``,
    `# ---- Ghidra WASM decompilation of the MZ entry point ----`,
    decomp,
  ].join("\n");
  payload.set("data/normalized/install-com-ghidra.txt", Buffer.from(triage));
  payload.set("data/normalized/fna102b-catalog.xml", Buffer.from(catalogXml(records, zipSha)));
  payload.set("data/normalized/fna102b-catalog.json",
    Buffer.from(JSON.stringify({ generated: NOW, container: ZIP_REL, containerSha256: zipSha, members: records }, null, 2) + "\n"));

  const tags = new Map([
    ["bagit.txt", Buffer.from("BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n")],
    ["metadata/preservation-event.json", Buffer.from(preservationEvent(records))],
  ]);
  const manifest = [...payload].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n";
  tags.set("manifest-sha256.txt", Buffer.from(manifest));
  const tagmanifest = [...tags].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n";
  tags.set("tagmanifest-sha256.txt", Buffer.from(tagmanifest));

  for (const [rel, buf] of [...payload, ...tags]) {
    const fp = path.join(OUT, rel);
    await mkdir(path.dirname(fp), { recursive: true });
    await writeFile(fp, buf);
  }
  console.log(`Xena-inspired BagIt bag: ${path.relative(root, OUT)}`);
  console.log(`  container SHA-256 verified against PROVENANCE.md`);
  console.log(`  members: ${records.length}  preserved: ${records.filter((r) => r.action === "preserved").length}`
    + `  retained in place (encrypted, not decrypted): ${records.filter((r) => r.action === "retained-in-place").length}`);
  console.log(`  payload files: ${payload.size}  tag files: ${tags.size}  INSTALL.COM strings: ${strs.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
