/**
 * MINIMAL DJVU — an IFF85 walker, an INFO/TXTa/DIRM decoder, and a reader for
 * the Internet Archive's `_djvu.xml` word-box derivative.
 *
 * Why a scanned-document format is in a naval-geometry app
 * -------------------------------------------------------
 * Every primary source this viewer plots is a page image. The Nimitz Graybook
 * is 3,548 scanned pages; the Fogarty report is a photocopied typescript with
 * the classification markings struck through by hand; the ICAO figures are
 * halftones. DjVu is the format that library and archive scanning pipelines
 * put those pages into, and it is the only common document format whose
 * *structure* is the thing you want: the page is explicitly separated into a
 * bitonal JB2 mask (the typing, the contour lines, the struck-through stamps)
 * and IW44 wavelet colour layers, with the OCR text in its own chunk carrying
 * a bounding box per word. That is a document you can overlay on a map.
 *
 * What is implemented, exactly
 * ----------------------------
 *   IFF85 container walk (AT&T magic, FORM/FORM:DJVU/DJVM/DJVI/THUM, nesting,
 *     odd-length padding, offsets)                            \u2014 complete
 *   INFO  (10 bytes: w, h, ver, dpi little-endian, gamma, flags) \u2014 complete
 *   INCL  (component id)                                       \u2014 complete
 *   ANTa  (plain-text annotation s-expressions)                \u2014 complete
 *   TXTa  (BE24 length + UTF-8 text + version byte)            \u2014 complete,
 *         this part is normative in the published spec
 *   TXTa  zone tree                                            \u2014 best effort:
 *         the zone record layout is NOT in the published DjVu3 spec (\u00a72.4 says
 *         "to be documented") and exists only in DjVuLibre's DjVuText.cpp.
 *         `ZONE_RECORD` below is that layout. The parser verifies it consumed
 *         exactly the chunk and refuses to emit zones if it did not \u2014 so a
 *         wrong guess shows up as `zoneParse: "length-mismatch"`, never as
 *         plausible-looking wrong boxes.
 *   DIRM  header (bundled flag, version, file count, offsets)  \u2014 complete
 *   TXTz / ANTz / NAVM / DIRM body                             \u2014 DETECTED AND
 *         REPORTED, NOT DECODED. They are BZZ streams (Burrows\u2013Wheeler + the
 *         ZP adaptive binary arithmetic coder). Implementing ZP from memory
 *         would be a coin flip, so this module says so and points at the two
 *         paths that do work: `djvused -e 'select 1; print-pure-txt'`, or the
 *         Internet Archive's `<id>_djvu.xml` derivative, which is read here.
 *   Sjbz / BG44 / FG44 / Smmr / FGbz                           \u2014 inventoried
 *         (id, offset, length, position in the layer stack), not decoded. This
 *         is a geometry viewer; it wants the page rectangle and the words.
 */

const MAGIC = [0x41, 0x54, 0x26, 0x54]; // "AT&T"
const td = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8") : null;

const COMPRESSED_CHUNKS = new Set(["TXTz", "ANTz", "NAVM"]);
const IMAGE_CHUNKS = new Set(["Sjbz", "Smmr", "BG44", "FG44", "TH44", "PM44", "BM44", "BGjp", "FGjp", "FGbz", "Djbz", "WMRM"]);

export const ZONE_TYPES = {
  1: "page",
  2: "column",
  3: "region",
  4: "paragraph",
  5: "line",
  6: "word",
  7: "character",
};

/**
 * The undocumented bit. Field order and widths of one hidden-text zone record,
 * as DjVuLibre writes it. 16-bit geometry fields carry a +0x8000 bias because
 * they are signed deltas from the parent or previous sibling.
 */
export const ZONE_RECORD = {
  bytes: 17,
  fields: ["type:u8", "x:i16+0x8000", "y:i16+0x8000", "w:i16+0x8000", "h:i16+0x8000", "textStart:i16+0x8000", "textLength:u24", "children:u24"],
  reference: "djvulibre libdjvu/DjVuText.cpp \u2014 DjVuTXT::Zone::decode",
  caveat: "Not specified in the DjVu3 spec (\u00a72.4: \u201cto be documented\u201d).",
};

/* ------------------------------------------------------------- primitives */

const u8 = (b, o) => b[o];
const be16 = (b, o) => (b[o] << 8) | b[o + 1];
const be24 = (b, o) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];
const be32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const le16 = (b, o) => b[o] | (b[o + 1] << 8);
const ascii = (b, o, n) => String.fromCharCode(...b.subarray(o, o + n));
const utf8 = (b, o, n) =>
  td ? td.decode(b.subarray(o, o + n)) : Buffer.from(b.subarray(o, o + n)).toString("utf8");

/* ----------------------------------------------------------- the container */

/**
 * Walk a DjVu byte array. Returns a chunk tree plus a flat inventory.
 * Never throws on malformed input: it stops and records a warning, because
 * half of a real archival file is still worth looking at.
 */
export function parseDjvu(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  const doc = {
    bytes: b.length,
    magic: false,
    root: null,
    inventory: [],
    pages: [],
    warnings: [],
    capabilities: {
      decoded: ["IFF85", "INFO", "INCL", "ANTa", "TXTa"],
      inventoried: [...IMAGE_CHUNKS],
      notDecoded: [...COMPRESSED_CHUNKS, "DIRM body"],
      reason: "BZZ (ZP arithmetic coder) not implemented \u2014 see module header",
    },
  };
  if (b.length < 12) {
    doc.warnings.push("file shorter than an IFF header");
    return doc;
  }
  doc.magic = MAGIC.every((v, i) => b[i] === v);
  if (!doc.magic) doc.warnings.push('missing "AT&T" magic \u2014 parsing as bare IFF anyway');

  const start = doc.magic ? 4 : 0;
  const { chunk, next } = readChunk(b, start, doc, 0);
  doc.root = chunk;
  if (chunk && next < b.length) {
    doc.warnings.push(`${b.length - next} trailing byte(s) after the root FORM`);
  }
  // collect pages
  const visit = (c) => {
    if (!c) return;
    if (c.id === "FORM" && c.form === "DJVU") {
      const info = c.children.find((k) => k.id === "INFO");
      doc.pages.push({
        form: c,
        info: info ? info.decoded : null,
        text: c.children.filter((k) => k.id === "TXTa" || k.id === "TXTz").map((k) => k.decoded ?? { compressed: "bzz", chunk: k.id, length: k.length }),
        layers: c.children.filter((k) => IMAGE_CHUNKS.has(k.id)).map((k) => ({ id: k.id, length: k.length, offset: k.dataOffset })),
      });
    }
    for (const k of c.children ?? []) visit(k);
  };
  visit(doc.root);
  return doc;
}

function readChunk(b, off, doc, depth) {
  if (off + 8 > b.length) return { chunk: null, next: b.length };
  const id = ascii(b, off, 4);
  const length = be32(b, off + 4);
  const dataOffset = off + 8;
  if (dataOffset + length > b.length) {
    doc.warnings.push(`chunk ${id} at ${off} claims ${length} bytes but only ${b.length - dataOffset} remain`);
  }
  const avail = Math.max(0, Math.min(length, b.length - dataOffset));
  const chunk = { id, offset: off, dataOffset, length, depth, children: [] };

  if (id === "FORM") {
    chunk.form = avail >= 4 ? ascii(b, dataOffset, 4) : "????";
    let p = dataOffset + 4;
    const end = dataOffset + avail;
    while (p + 8 <= end) {
      const r = readChunk(b, p, doc, depth + 1);
      if (!r.chunk) break;
      chunk.children.push(r.chunk);
      p = r.next;
    }
  } else {
    chunk.decoded = decodeChunk(id, b, dataOffset, avail, doc);
  }
  doc.inventory.push({
    id: chunk.form ? `FORM:${chunk.form}` : id,
    offset: off,
    length,
    depth,
    note: describe(chunk),
  });
  let next = dataOffset + length;
  if (length % 2 === 1) next += 1; // IFF pads chunks to even length
  return { chunk, next: Math.min(next, b.length) };
}

function describe(c) {
  if (c.form) return c.form === "DJVM" ? "multi-page document" : c.form === "DJVU" ? "page" : c.form === "DJVI" ? "shared component" : c.form === "THUM" ? "thumbnails" : "";
  const d = c.decoded;
  if (c.id === "INFO" && d) return `${d.width}\u00d7${d.height}, v${d.version}, ${d.dpi} dpi, gamma ${d.gamma}`;
  if (c.id === "TXTa" && d) return `hidden text, ${d.text.length} chars, ${d.zones?.length ?? 0} top-level zones`;
  if (COMPRESSED_CHUNKS.has(c.id)) return "BZZ stream \u2014 not decoded";
  if (c.id === "DIRM" && d) return `${d.bundled ? "bundled" : "indirect"}, ${d.nFiles} files`;
  if (c.id === "INCL" && d) return `\u2192 ${d.id}`;
  if (IMAGE_CHUNKS.has(c.id)) return "image layer \u2014 inventoried";
  return "";
}

function decodeChunk(id, b, off, len, doc) {
  try {
    if (id === "INFO") return decodeInfo(b, off, len);
    if (id === "INCL") return { id: ascii(b, off, len).replace(/\0+$/, "") };
    if (id === "ANTa") return { annotation: utf8(b, off, len) };
    if (id === "TXTa") return decodeTxt(b, off, len, doc);
    if (id === "DIRM") return decodeDirmHeader(b, off, len);
    if (COMPRESSED_CHUNKS.has(id)) return { compressed: "bzz", length: len, decoded: false };
    if (IMAGE_CHUNKS.has(id)) return { layer: id, length: len, decoded: false };
  } catch (err) {
    doc.warnings.push(`${id}: ${err.message}`);
  }
  return null;
}

/* ------------------------------------------------------------------- INFO */

/**
 * 10 bytes. Note the dpi field is LITTLE-endian in an otherwise big-endian
 * format \u2014 a genuine quirk of the original AT&T encoder, not a typo here.
 */
export function decodeInfo(b, off, len = 10) {
  if (len < 8) throw new Error(`INFO too short (${len})`);
  const width = be16(b, off);
  const height = be16(b, off + 2);
  const minor = u8(b, off + 4);
  const major = u8(b, off + 5);
  const dpi = len >= 8 ? le16(b, off + 6) : 300;
  const gammaRaw = len >= 9 ? u8(b, off + 8) : 22;
  const flags = len >= 10 ? u8(b, off + 9) : 0;
  return {
    width,
    height,
    version: major,
    versionMinor: minor,
    dpi,
    gamma: Math.round((gammaRaw / 10) * 10) / 10,
    flags,
    rotation: [0, 0, 90, 180, 270][flags & 0x07] ?? 0,
    inchesWide: dpi ? width / dpi : null,
    inchesHigh: dpi ? height / dpi : null,
  };
}

/* ------------------------------------------------------------------- DIRM */

export function decodeDirmHeader(b, off, len) {
  const flags = u8(b, off);
  const bundled = (flags & 0x80) !== 0;
  const version = flags & 0x7f;
  const nFiles = be16(b, off + 1);
  const offsets = [];
  let p = off + 3;
  if (bundled) {
    for (let i = 0; i < nFiles && p + 4 <= off + len; i++, p += 4) offsets.push(be32(b, p));
  }
  return {
    bundled,
    version,
    nFiles,
    offsets,
    bzzOffset: p - off,
    bzzLength: len - (p - off),
    bodyDecoded: false,
    bodyNote: "component sizes, flags and IDs are a BZZ stream \u2014 not decoded",
  };
}

/* ------------------------------------------------------------------- TXTa */

export function decodeTxt(b, off, len, doc = { warnings: [] }) {
  if (len < 4) throw new Error("TXTa too short");
  const textLen = be24(b, off);
  if (textLen > len - 3) throw new Error(`TXTa text length ${textLen} exceeds chunk`);
  const text = utf8(b, off + 3, textLen);
  let p = off + 3 + textLen;
  const out = { text, version: null, zones: [], zoneParse: "none", zoneCount: 0 };
  if (p >= off + len) return out;
  out.version = u8(b, p);
  p += 1;
  const end = off + len;
  if (p >= end) {
    out.zoneParse = "no-zones";
    return out;
  }

  // Parse the zone tree, then insist we landed exactly on the chunk end.
  const zones = [];
  let flat = 0;
  try {
    const readZone = (parent, prev) => {
      if (p + ZONE_RECORD.bytes > end) throw new Error("zone record past chunk end");
      const type = u8(b, p);
      if (!ZONE_TYPES[type]) throw new Error(`zone type ${type} out of range`);
      const x = be16(b, p + 1) - 0x8000;
      const y = be16(b, p + 3) - 0x8000;
      const w = be16(b, p + 5) - 0x8000;
      const h = be16(b, p + 7) - 0x8000;
      const ts = be16(b, p + 9) - 0x8000;
      const tl = be24(b, p + 11);
      const nKids = be24(b, p + 14);
      p += ZONE_RECORD.bytes;

      const z = { type, kind: ZONE_TYPES[type], textLength: tl, children: [] };
      if (!parent) {
        z.x = x;
        z.y = y;
        z.textStart = ts;
      } else if (!prev) {
        z.x = parent.x + x;
        z.y = parent.y2 - y;
        z.textStart = parent.textStart + ts;
      } else if (type <= 5) {
        z.x = parent.x + x;
        z.y = prev.y - y;
        z.textStart = prev.textStart + prev.textLength + ts;
      } else {
        z.x = prev.x2 + x;
        z.y = prev.y + y;
        z.textStart = prev.textStart + prev.textLength + ts;
      }
      z.w = w;
      z.h = h;
      z.x2 = z.x + w;
      z.y2 = z.y + h;
      z.text = text.slice(z.textStart, z.textStart + tl);
      flat += 1;
      let last = null;
      for (let i = 0; i < nKids; i++) {
        last = readZone(z, last);
        z.children.push(last);
      }
      return z;
    };
    let last = null;
    while (p + ZONE_RECORD.bytes <= end) {
      last = readZone(null, last);
      zones.push(last);
    }
    if (p !== end) throw new Error(`zone tree ended at ${p - off}/${len}`);
    out.zones = zones;
    out.zoneCount = flat;
    out.zoneParse = "ok";
  } catch (err) {
    out.zones = [];
    out.zoneParse = "length-mismatch";
    out.zoneError = err.message;
    out.zoneLayout = ZONE_RECORD;
    doc.warnings?.push(
      `TXTa zone tree not parsed (${err.message}). Text layer is still available; ` +
        "the zone record layout is undocumented \u2014 see ZONE_RECORD in js/vincennes-djvu.js."
    );
  }
  return out;
}

/** Flatten a zone tree to the leaves of one kind ("word", "line", \u2026). */
export function zonesOfKind(zones, kind) {
  const out = [];
  const walk = (list) => {
    for (const z of list) {
      if (z.kind === kind) out.push(z);
      if (z.children?.length) walk(z.children);
    }
  };
  walk(zones);
  return out;
}

/* --------------------------------------------- Internet Archive derivative */

/**
 * Internet Archive runs every scanned item through a pipeline that emits
 * `<id>_djvu.txt` (plain text) and `<id>_djvu.xml` (ABBYY word coordinates in
 * a DjVu-shaped OBJECT/PARAGRAPH/LINE/WORD tree). The XML is the practical way
 * to get word boxes out of an archival scan without a BZZ decoder, and it is
 * the same coordinate system as the DjVu page.
 *
 * `coords` on a WORD is "left,bottom,right,top" in page pixels.
 */
export function parseIaDjvuXml(xml) {
  const pages = [];
  const objectRe = /<OBJECT\b([^>]*)>([\s\S]*?)<\/OBJECT>/g;
  const attrRe = /(\w+)\s*=\s*"([^"]*)"/g;
  const paramRe = /<PARAM\b([^>]*)\/?>/g;
  const wordRe = /<WORD\b([^>]*)>([\s\S]*?)<\/WORD>/g;
  let m;
  while ((m = objectRe.exec(xml))) {
    const attrs = {};
    let a;
    attrRe.lastIndex = 0;
    while ((a = attrRe.exec(m[1]))) attrs[a[1]] = a[2];
    const params = {};
    let p;
    paramRe.lastIndex = 0;
    while ((p = paramRe.exec(m[2]))) {
      const pa = {};
      let q;
      attrRe.lastIndex = 0;
      while ((q = attrRe.exec(p[1]))) pa[q[1]] = q[2];
      if (pa.name) params[pa.name] = pa.value;
    }
    const words = [];
    let w;
    wordRe.lastIndex = 0;
    while ((w = wordRe.exec(m[2]))) {
      const wa = {};
      let q;
      attrRe.lastIndex = 0;
      while ((q = attrRe.exec(w[1]))) wa[q[1]] = q[2];
      const c = (wa.coords || "").split(",").map(Number);
      if (c.length < 4) continue;
      const [x1, y2, x2, y1] = c;
      words.push({
        kind: "word",
        text: w[2].replace(/<[^>]+>/g, "").trim(),
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        x2: Math.max(x1, x2),
        y2: Math.max(y1, y2),
        w: Math.abs(x2 - x1),
        h: Math.abs(y2 - y1),
      });
    }
    pages.push({
      width: Number(attrs.width) || 0,
      height: Number(attrs.height) || 0,
      dpi: Number(params.DPI) || 0,
      page: params.PAGE || attrs.data || "",
      words,
    });
  }
  return { pages, source: "internet-archive _djvu.xml (ABBYY derivative)" };
}

/* ------------------------------------------------------------- the encoder */

/**
 * Build a structurally valid single-page DjVu carrying only geometry and a
 * hidden-text layer: AT&T + FORM:DJVU + INFO + ANTa + TXTa.
 *
 * It has no Sjbz/BG44, so a full renderer will report a page with no image
 * data \u2014 which is the honest thing for a fixture that contains no scan. What
 * it *is* good for: it is a real IFF85 DjVu byte stream with a real INFO chunk
 * and a real zone tree, so `parseDjvu(encodePlate(\u2026))` round-trips and proves
 * the decoder above against something other than itself.
 */
export function encodePlate({ width, height, dpi = 300, gamma = 2.2, rotation = 0, annotation = "", lines = [] }) {
  const parts = [];
  const push = (arr) => parts.push(arr instanceof Uint8Array ? arr : Uint8Array.from(arr));

  // --- text string + zone tree -----------------------------------------
  const text = lines.map((l) => l.text).join("\n");
  const enc = new TextEncoder();
  const textBytes = enc.encode(text);

  const zoneBytes = [];
  const w16 = (v) => {
    const x = (v + 0x8000) & 0xffff;
    zoneBytes.push(x >> 8, x & 0xff);
  };
  const w24 = (v) => zoneBytes.push((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);

  // one page zone containing one line zone per input line
  const pageZone = { x: 0, y: 0, w: width, h: height };
  zoneBytes.push(1); // page
  w16(pageZone.x);
  w16(pageZone.y);
  w16(pageZone.w);
  w16(pageZone.h);
  w16(0); // textStart
  w24(textBytes.length);
  w24(lines.length);

  let prev = null;
  let cursor = 0;
  for (const line of lines) {
    const lb = enc.encode(line.text);
    const absX = line.x;
    const absY = line.y;
    const dx = prev ? absX - pageZone.x : absX - pageZone.x;
    const dy = prev ? prev.y - absY : pageZone.y + pageZone.h - absY;
    const dts = prev ? cursor - (prev.textStart + prev.textLength) : cursor;
    zoneBytes.push(5); // line
    w16(dx);
    w16(dy);
    w16(line.w);
    w16(line.h);
    w16(dts);
    w24(lb.length);
    w24(0);
    prev = { x: absX, y: absY, x2: absX + line.w, textStart: cursor, textLength: lb.length };
    cursor += lb.length + 1; // +1 for the "\n" separator
  }

  const txt = new Uint8Array(3 + textBytes.length + 1 + zoneBytes.length);
  txt[0] = (textBytes.length >> 16) & 0xff;
  txt[1] = (textBytes.length >> 8) & 0xff;
  txt[2] = textBytes.length & 0xff;
  txt.set(textBytes, 3);
  txt[3 + textBytes.length] = 1; // version
  txt.set(Uint8Array.from(zoneBytes), 4 + textBytes.length);

  // --- INFO --------------------------------------------------------------
  const info = Uint8Array.from([
    (width >> 8) & 0xff, width & 0xff,
    (height >> 8) & 0xff, height & 0xff,
    0, 26, // version 26.0
    dpi & 0xff, (dpi >> 8) & 0xff, // little-endian, per spec
    Math.round(gamma * 10) & 0xff,
    [0, 1, 6, 2, 5][[0, 90, 180, 270].indexOf(rotation) + 1] ?? 1,
  ]);

  const chunks = [chunk("INFO", info)];
  if (annotation) chunks.push(chunk("ANTa", new TextEncoder().encode(annotation)));
  chunks.push(chunk("TXTa", txt));

  const body = concat([enc.encode("DJVU"), ...chunks]);
  const form = chunk("FORM", body);
  push(Uint8Array.from(MAGIC));
  push(form);
  return concat(parts);
}

function chunk(id, data) {
  const head = new Uint8Array(8);
  for (let i = 0; i < 4; i++) head[i] = id.charCodeAt(i);
  head[4] = (data.length >>> 24) & 0xff;
  head[5] = (data.length >>> 16) & 0xff;
  head[6] = (data.length >>> 8) & 0xff;
  head[7] = data.length & 0xff;
  const pad = data.length % 2 === 1 ? 1 : 0;
  const out = new Uint8Array(8 + data.length + pad);
  out.set(head, 0);
  out.set(data, 8);
  return out;
}

function concat(list) {
  let n = 0;
  for (const a of list) n += a.length;
  const out = new Uint8Array(n);
  let p = 0;
  for (const a of list) {
    out.set(a, p);
    p += a.length;
  }
  return out;
}

/** One-line human summary, the `djvudump` shape. */
export function dump(doc) {
  return doc.inventory
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .map((c) => `${"  ".repeat(c.depth)}${c.id} [${c.length}]${c.note ? "  " + c.note : ""}`)
    .join("\n");
}

export default { parseDjvu, decodeInfo, decodeTxt, decodeDirmHeader, parseIaDjvuXml, encodePlate, zonesOfKind, dump, ZONE_TYPES, ZONE_RECORD };
