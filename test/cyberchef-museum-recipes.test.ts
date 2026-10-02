import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

type Operation = {
  id: string;
  args: Array<{ key: string; default: string }>;
  run: (input: string, args: Record<string, string>) => string | Promise<string>;
};

type Visual = { __visual: true; __html: string; __text: string };

function bootCyberChef() {
  const html = readFileSync(path.resolve("public/apps/cyberchef/index.html"), "utf8");
  const dom = new JSDOM(html, {
    url: "https://example.test/apps/cyberchef/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const operations = dom.window.eval("OPERATIONS") as Operation[];
  const packs = dom.window.eval("RECIPE_PACKS") as Record<string, unknown>;

  const operation = (id: string) => {
    const value = operations.find((candidate) => candidate.id === id);
    if (!value) throw new Error(`Operation not registered: ${id}`);
    return value;
  };
  const run = async (id: string, input: string, changes: Record<string, string> = {}) => {
    const selected = operation(id);
    const args = Object.fromEntries(selected.args.map((argument) => [argument.key, argument.default]));
    return await selected.run(input, { ...args, ...changes });
  };
  /** the kitCard visual carries the machine output in its __text block */
  const textOf = (result: unknown) => (result as Visual).__text;
  const htmlOf = (result: unknown) => (result as Visual).__html;
  /** the Enigma op prints "Out    : XXXXX" lines in its ASCII card */
  const enigmaOut = (result: unknown) =>
    (textOf(result) as string)
      .split("\n")
      .find((line) => line.startsWith("Out    :"))
      ?.slice(8)
      .trim() ?? "";

  return { dom, html, operations, packs, operation, run, textOf, htmlOf, enigmaOut };
}

/** The Crow's Cryptogram digit corpus, first 120 digits, mapped 0-9 → A-J —
 *  the bridge the 2026-10-02 experiment used (docs/crow-cryptogram-investigation-2026-10-02.md). */
const CROW_HEAD_LETTERS =
  "IBCDCEEHIDHDCDCDCCGDHFHCCIGDGFFBJGDIHDGGADCCCHCGGIDDDDBCHCDAFCCDFCDDGGCDICCIHDHDHFDEDFCDFCCCCDDCJDEIHCDBEGDCICADGCCCCICE";

describe("CyberChef museum recipes (KGB Espionage Museum / Spy Museum pass, 2026-10-02)", () => {
  it("registers the Enigma M3/M4, the mod-10 pad and the museum packs", async () => {
    const kitchen = bootCyberChef();
    try {
      const ids = kitchen.operations.map((operation) => operation.id);
      expect(ids).toEqual(expect.arrayContaining(["enigma", "otp10", "vic", "freq"]));
      expect(new Set(ids).size).toBe(ids.length);

      // the museum packs, by name
      const packNames = Object.keys(kitchen.packs);
      for (const pack of [
        "Museum · Enigma I reference vector (expect BDZGO)",
        "Museum · Kriegsmarine M4 · Beta + UKW-B Thin (M3-compatible at A)",
        "Museum · Kryptos misspellings M4 experiment (IQLU / DESP / UN DE RG)",
        "Museum · KGB Espionage Museum: VIC straddling checkerboard",
        "Museum · Hollow-nickel mod-10 one-time pad (VENONA class)",
        "Museum · Crow cryptogram digit profile",
      ]) {
        expect(packNames).toContain(pack);
      }

      // the header count matches the operations that actually register
      expect(kitchen.operations.length).toBe(369);
      expect(kitchen.html).toContain("369 recipes");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("Enigma I passes the canonical Wikipedia vector", async () => {
    const kitchen = bootCyberChef();
    try {
      const out = await kitchen.run("enigma", "AAAAA", {});
      expect(kitchen.enigmaOut(out)).toBe("BDZGO");
      // the pack's documented expectation is stated in its name
      expect(kitchen.html).toContain("expect BDZGO");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("the M4 Greek rotors reduce to the M3 at position A (the wiring proof)", async () => {
    const kitchen = bootCyberChef();
    try {
      const betaM4 = await kitchen.run("enigma", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", { G: "Beta", ukw: "Bt", pos: "AQDK", ring: "AAAA" });
      const betaM3 = await kitchen.run("enigma", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", { pos: "QDK", ring: "AAA" });
      expect(kitchen.enigmaOut(betaM4)).toBe(kitchen.enigmaOut(betaM3));

      const gammaM4 = await kitchen.run("enigma", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", { G: "Gamma", ukw: "Ct", pos: "AQDK", ring: "AAAA" });
      const gammaM3 = await kitchen.run("enigma", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", { ukw: "C", pos: "QDK", ring: "AAA" });
      expect(kitchen.enigmaOut(gammaM4)).toBe(kitchen.enigmaOut(gammaM3));
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("the Kryptos-misspellings preset reproduces the documented (negative) experiment output", async () => {
    const kitchen = bootCyberChef();
    try {
      const result = await kitchen.run("enigma", CROW_HEAD_LETTERS, {
        G: "Beta", ukw: "Bt", pos: "IQLU", ring: "DESP", plug: "UN DE RG",
      });
      // PEQMUG… is the deterministic output the experiment recorded: the
      // misspellings-as-settings hypothesis scores 0.070 on this corpus,
      // far below the 0.616 the poem itself scores — a documented failure,
      // not a solution
      expect(kitchen.enigmaOut(result).startsWith("PEQMUGPJHTKKMVHWIKTAQVNNQGNOHR")).toBe(true);
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("guards the Greek-rotor / thin-reflector pairing mistakes", async () => {
    const kitchen = bootCyberChef();
    try {
      const greekWithWide = await kitchen.run("enigma", "A", { G: "Beta", ukw: "B" });
      expect(kitchen.enigmaOut(greekWithWide)).toContain("ERROR");

      const thinWithoutGreek = await kitchen.run("enigma", "A", { ukw: "Bt" });
      expect(kitchen.enigmaOut(thinWithoutGreek)).toContain("ERROR");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("the mod-10 one-time pad adds, subtracts and confesses key reuse", async () => {
    const kitchen = bootCyberChef();
    try {
      // 81232 + 31415 digit-wise mod 10 = 12647
      const encrypted = await kitchen.run("otp10", "81232", { key: "31415", mode: "encrypt", group: "yes" });
      expect(kitchen.htmlOf(encrypted)).toContain("12647");

      const decrypted = await kitchen.run("otp10", "12647", { key: "31415", mode: "decrypt", group: "yes" });
      expect(kitchen.htmlOf(decrypted)).toContain("81232");

      // a short key repeats — and the op says so, the VENONA lesson
      const repeated = await kitchen.run("otp10", "12345678", { key: "12", mode: "encrypt", group: "no" });
      expect(kitchen.htmlOf(repeated)).toContain("repeated");
      expect(kitchen.htmlOf(repeated)).toContain("VENONA");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("the VIC checkerboard still round-trips (the KGB museum pack's anchor op)", async () => {
    const kitchen = bootCyberChef();
    try {
      const digits = await kitchen.run("vic", "TEA", { mode: "encrypt" });
      expect(digits).toMatch(/^[0-9]+$/);
      const back = await kitchen.run("vic", digits, { mode: "decrypt" });
      expect(back).toBe("TEA");
    } finally {
      kitchen.dom.window.close();
    }
  });
});
