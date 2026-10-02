import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

type Operation = { id: string; args: Array<{ key: string; default: string }>; run: (input: string, args: Record<string, string>) => unknown };

function kitchen() {
  const html = readFileSync(path.resolve("public/apps/cyberchef/index.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.test/apps/cyberchef/", beforeParse(window) {
    window.alert = () => undefined; window.confirm = () => false; window.prompt = () => null;
    window.URL.createObjectURL = () => "blob:test"; window.URL.revokeObjectURL = () => undefined;
  }});
  const ops = dom.window.eval("OPERATIONS") as Operation[];
  const run = (id: string, input = "", changes: Record<string, string> = {}) => {
    const op = ops.find(x => x.id === id); if (!op) throw new Error(`missing ${id}`);
    return op.run(input, { ...Object.fromEntries(op.args.map(a => [a.key, a.default])), ...changes });
  };
  return { dom, html, ops, run };
}

describe("museum and field-cipher research recipes", () => {
  it("registers auditable M4, SECOM schedule, and OD poem worksheets", () => {
    const k = kitchen();
    try {
      expect(k.html).toContain("369 recipes");
      expect(k.html).toContain("Museum Rotor Machines — Enigma M3/M4");
      expect(k.html).toContain("Field Ciphers — SECOM & OD Poem Code");
      expect(k.html).toContain("repository probe reproduces the official full vector and rejects INMYMEMORYIWILLALWAY");
      expect(k.ops.map(x => x.id)).toEqual(expect.arrayContaining(["enigmaM4", "secomSchedule", "odPoemKey"]));
      expect(k.ops.find(x => x.id === "enigmaM4")?.args.find(a => a.key === "plug")?.default).toBe("");
      expect(new Set(k.ops.map(x => x.id)).size).toBe(k.ops.length);

      // Beta A + thin B is electrically equivalent to the old wide B reflector.
      expect(k.run("enigmaM4", "AAAAA", { G: "Beta", L: "I", M: "II", R: "III", ukw: "Bthin", pos: "AAAA", ring: "AAAA", plug: "" })).toBe("BDZGO");
      const m4 = k.run("enigmaM4", "SECRETMESSAGE", { G: "Gamma", L: "V", M: "II", R: "IV", ukw: "Cthin", pos: "QWER", ring: "BDFH", plug: "AV BS CG DL FU HZ IN KM OW RX" }) as string;
      expect(k.run("enigmaM4", m4, { G: "Gamma", L: "V", M: "II", R: "IV", ukw: "Cthin", pos: "QWER", ring: "BDFH", plug: "AV BS CG DL FU HZ IN KM OW RX" })).toBe("SECRETMESSAGE");

      const secom = k.run("secomSchedule", "", { phrase: "MAKE NEW FRIENDS BUT KEEP THE OLD" }) as string;
      expect(secom).toContain("Ranks : 7162830495 3728109645");
      expect(secom).toContain("Seed   : 0880939030");
      expect(secom).toContain("Board  : 8139065427");

      const od = k.run("odPoemKey") as string;
      expect(od).toContain("Key       : ONZEWASZIENALLE");
      expect(od).toContain("Indicator : EJHQT");
      expect(od).toContain("Check     : OTRGJ");
    } finally { k.dom.window.close(); }
  });
});
