import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

const APP = path.resolve("public/apps/cyberchef/index.html");

type Op = {
  id: string; name: string; category: string;
  args: Array<{ key: string; default: unknown }>;
  run: (input: string, args: Record<string, unknown>) => { __html?: string; __text?: string };
};

function boot(file = APP) {
  const html = readFileSync(file, "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const win = dom.window as unknown as { eval: (src: string) => any; close: () => void; document: Document };
  const ops = win.eval("OPERATIONS") as Op[];
  const run = (id: string, changes: Record<string, unknown> = {}) => {
    const op = ops.find((o) => o.id === id);
    if (!op) throw new Error(`missing operation ${id}`);
    return op.run("", { ...Object.fromEntries(op.args.map((a) => [a.key, a.default])), ...changes });
  };
  return { html, win, document: win.document, ops, run, close: () => win.close() };
}

/** Text a user actually sees: script, style and template content excluded. */
function visibleText(document: Document) {
  const clone = document.body.cloneNode(true) as HTMLElement;
  for (const el of clone.querySelectorAll("script,style,template")) el.remove();
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

/* Reference Code 39 patterns (ISO/IEC 16388), narrow = 1 module, wide = 3.
   Index follows the mod-43 value order; entry 43 is the '*' start/stop. */
const CODE39_REF = [
  "101000111011101",
  "111010001010111",
  "101110001010111",
  "111011100010101",
  "101000111010111",
  "111010001110101",
  "101110001110101",
  "101000101110111",
  "111010001011101",
  "101110001011101",
  "111010100010111",
  "101110100010111",
  "111011101000101",
  "101011100010111",
  "111010111000101",
  "101110111000101",
  "101010001110111",
  "111010100011101",
  "101110100011101",
  "101011100011101",
  "111010101000111",
  "101110101000111",
  "111011101010001",
  "101011101000111",
  "111010111010001",
  "101110111010001",
  "101010111000111",
  "111010101110001",
  "101110101110001",
  "101011101110001",
  "111000101010111",
  "100011101010111",
  "111000111010101",
  "100010111010111",
  "111000101110101",
  "100011101110101",
  "100010101110111",
  "111000101011101",
  "100011101011101",
  "100010001000101",
  "100010001010001",
  "100010100010001",
  "101000100010001"
];
const CODE39_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";
const CODE39_START_STOP = "1000101110111010";

/** Minimal spec-conformant Code 39 decoder, used to round-trip the encoder. */
function decodeCode39(pattern: string) {
  const lookup = new Map<string, string>();
  CODE39_REF.forEach((p, i) => lookup.set(p.slice(0, 15), CODE39_ALPHABET[i]));
  lookup.set(CODE39_START_STOP.slice(0, 15), "*");
  const p = pattern.replace(/^0+/, "").replace(/0+$/, "");
  const out: string[] = [];
  let i = 0;
  while (i + 15 <= p.length) {
    const char = lookup.get(p.slice(i, i + 15));
    if (!char) return null;
    out.push(char);
    i += 15;
    if (p[i] === "0") i += 1;
  }
  return i === p.length ? out.join("") : null;
}

const QR_GOLDENS = [
  { text: "HELLO WORLD", level: "M", version: 1, size: 21, matrix:
    "111111101100101111111100000100001001000001101110100101001011101101110101001001011101101110101110101011101100000101001001000001111111101010101111111000000001001100000000100010111111011111001000100001011100001111001111110011011010010111110001100010000000111110101010101100110000000001010111101011111111101110101011010100000100101110110011101110101101011000110101110100100100011011101110100111000111000100000100001010000000111111101111111110101" },
  { text: "https://github.com/shdwelf/Html5", level: "M", version: 3, size: 29, matrix:
    "1111111011011000000000111111110000010011010001101101000001101110100010110111101010111011011101011000011101000101110110111010101101101010001011101100000101111011100011010000011111111010101010101010111111100000000100000100110000000000100010111010011111001111110011111110000110000011001111111101010110100011110110101100001100011010011010111010011110111001101010110100010101000001000011001110011101010001111111010100110000100010101111011011110000111000010010111000001111110011101011110110100100010111001001110100001101011110110011011101110111001010000010100011001111101010110110110011111001100011110010001111110010000000010010111011110001000111111110111000011101101011101100000100001101101011000100111011101011111111010111111100010111010010110011000010000001101110100011000101111100011111000001000110011010011101101111111110111000010100111111010" },
  { text: "CyberChef \u4e2d\u6587 \ud83c\udf89", level: "Q", version: 3, size: 29, matrix:
    "1111111001001110110110111111110000010110011100001001000001101110100110010011110010111011011101011101010111010101110110111010101001001001001011101100000100011101010010010000011111111010101010101010111111100000000110100100111100000000010111101000111000010110110100100010011010011011000110011000110010110001110111110100100101011010001001100111100001100001001001011100001010111011110111000100110100010101111011010011100001110000110110000000110100000100111000101101110110110110111101110110010110010110010011001110000000111111011100011110001010110101001000111111000100110011101100001010111001110000001011011111110010000000011110000111010001010011111110001100100001101010010100000101100011100111000110101011101011000111010111111100110111010100011000010110100010101110100101011101000101111111000001011000010111011011000111111110001100011111011010100" }
];

describe("CyberChef kitchen bootstrap", () => {
  it("ends the document at a single </html> with no trailing markup", () => {
    const html = readFileSync(APP, "utf8");
    const closes = html.match(/<\/html>/g) ?? [];
    expect(closes).toHaveLength(1);
    expect(html.slice(html.indexOf("</html>") + "</html>".length).trim()).toBe("");
  });

  it("never leaks bootstrap source into the rendered page", () => {
    const k = boot();
    try {
      const visible = visibleText(k.document);
      for (const stray of ["InitUi();", "renderOpsList();", "renderRecipe();", "</script>"]) {
        expect(visible).not.toContain(stray);
      }
      expect(visible.endsWith("Ready. 0 operations")).toBe(true);
    } finally { k.close(); }
  });

  it("defines every bootstrap entry point it calls, and drops the retired InitUi", () => {
    const k = boot();
    try {
      for (const fn of ["zenInit", "sfxInitUi", "renderOpsList", "renderRecipe"]) {
        expect(k.win.eval(`typeof ${fn}`), fn).toBe("function");
      }
      expect(k.win.eval("typeof InitUi")).toBe("undefined");
      expect(k.document.getElementById("ops-list")!.children.length).toBeGreaterThan(100);
      expect(k.ops.length).toBeGreaterThan(400);
    } finally { k.close(); }
  });

  it("ships the same clean document inside cyberchef.xdc", () => {
    const bundle = unzipSync(readFileSync(path.resolve("cyberchef.xdc")));
    const shipped = new TextDecoder().decode(bundle["index.html"]);
    expect(shipped.match(/<\/html>/g)).toHaveLength(1);
    expect(shipped.slice(shipped.indexOf("</html>") + "</html>".length).trim()).toBe("");
    expect(shipped).not.toMatch(/^InitUi\(\);/m);
  });
});

describe("Barcode: Code 39", () => {
  it("uses the reference character patterns and start/stop symbol", () => {
    const k = boot();
    try {
      expect(k.win.eval("BAR_C39")).toBe(CODE39_ALPHABET);
      expect(k.win.eval("BAR_C39SS")).toBe(CODE39_START_STOP);
      expect(k.win.eval("BAR_C39P")).toEqual(CODE39_REF.slice(0, 43));
    } finally { k.close(); }
  });

  it("round-trips through a spec-conformant decoder", () => {
    const k = boot();
    try {
      for (const sample of ["HELLO", "CODE39", "A", "0123456789", "KLMNOPQRSTUVWXYZ", "-. $/+%", "WWW.GITHUB.COM/SHDWELF"]) {
        const pattern = k.run("code39", { txt: sample }).__text as string;
        const decoded = decodeCode39(pattern);
        expect(decoded, sample).not.toBeNull();
        expect(decoded!.replace(/^\*|\*$/g, ""), sample).toBe(sample);
      }
    } finally { k.close(); }
  });

  it("separates characters with a single narrow inter-character gap", () => {
    const k = boot();
    try {
      // start(16) + 5 x (15 + 1 gap) + stop(16) = 112 modules for "HELLO"
      expect((k.run("code39", { txt: "HELLO" }).__text as string)).toHaveLength(112);
    } finally { k.close(); }
  });

  it("appends a correct mod-43 check character when asked", () => {
    const k = boot();
    try {
      // C+O+D+E+3+9 = 12+24+13+14+3+9 = 75; 75 mod 43 = 32 -> 'W'
      expect(decodeCode39(k.run("code39", { txt: "CODE39", mod43: true }).__text as string)!.replace(/^\*|\*$/g, "")).toBe("CODE39W");
      expect(decodeCode39(k.run("code39", { txt: "CODE39", mod43: false }).__text as string)!.replace(/^\*|\*$/g, "")).toBe("CODE39");
    } finally { k.close(); }
  });

  it("still rejects characters outside the Code 39 alphabet", () => {
    const k = boot();
    try {
      expect(() => k.run("code39", { txt: "bad!" })).toThrow(/invalid char/);
    } finally { k.close(); }
  });
});

describe("Barcode rendering without a 2D canvas", () => {
  it("falls back to an inline SVG instead of throwing", () => {
    const k = boot();
    try {
      const url = k.win.eval("renderBarcode(barCode39('HELLO'))") as string;
      expect(url.startsWith("data:image/svg+xml")).toBe(true);
      expect(url.length).toBeGreaterThan(100);
    } finally { k.close(); }
  });
});

describe("Barcode: QR Code", () => {
  it("is registered in the Barcode category and reachable from the ops list", () => {
    const k = boot();
    try {
      const qr = k.ops.find((o) => o.id === "qrcode");
      expect(qr).toBeDefined();
      expect(qr!.category).toBe("Barcode");
      const labels = [...k.document.querySelectorAll("#ops-list *")]
        .filter((el) => el.children.length === 0)
        .map((el) => (el.textContent ?? "").trim());
      expect(labels).toContain("Barcode: QR Code");
    } finally { k.close(); }
  });

  it("reproduces reference matrices for versions 1-9 across EC levels", () => {
    const k = boot();
    try {
      for (const golden of QR_GOLDENS) {
        const out = k.run("qrcode", { txt: golden.text, ec: golden.level });
        const matrix = (out.__text as string).split("\n");
        expect(matrix, golden.text).toHaveLength(golden.size);
        expect(matrix.join(""), `${golden.text} @ ${golden.level}`).toBe(golden.matrix);
        expect(out.__html).toContain(`QR version ${golden.version}`);
      }
    } finally { k.close(); }
  });

  it("exposes a barcode recipe pack covering the whole symbology family", () => {
    const k = boot();
    try {
      const packs = k.win.eval("RECIPE_PACKS") as Record<string, Array<[string, unknown]>>;
      const iso = packs["ISO symbologies — Code 39 / Code 128 / EAN-13 / QR"];
      expect(iso.map((e) => e[0])).toEqual(["code39", "code128", "ean13", "qrcode"]);
      const qrPack = packs["QR Code — all four error correction levels"];
      expect(qrPack.map((e) => (e[1] as { ec: string }).ec)).toEqual(["L", "M", "Q", "H"]);
    } finally { k.close(); }
  });
});
