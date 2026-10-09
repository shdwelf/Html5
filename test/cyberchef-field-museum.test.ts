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
      // The header badge must track the live registry, not a frozen number.
      expect(k.html).toContain(`${k.ops.length} recipes`);
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

  it("ports the Sylichenko lab: exact SECOM, fitness ladder, plugboard hill-climb", () => {
    const k = kitchen();
    try {
      expect(k.html).toContain("Sylichenko Enigma Lab — Hill-Climbing the Plugboard");
      expect(k.ops.map(x => x.id)).toEqual(expect.arrayContaining(["secomExact", "iocFitness", "plugboardHillClimb"]));

      // Exact SECOM reproduces the official Rijmenants 105-digit vector…
      const VEC = "777193862200032042396003829683146080607178016736060606463536069686740369681890014021906662606660863160549";
      const enc = k.run("secomExact", "RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL",
        { phrase: "MAKE NEW FRIENDS BUT KEEP THE OLD", mode: "encrypt" }) as string;
      expect(enc.replace(/^[\s\S]*Result : /, "").split("\n")[0].replace(/\D/g, "")).toBe(VEC);
      // …and round-trips it.
      const dec = k.run("secomExact", VEC, { phrase: "MAKE NEW FRIENDS BUT KEEP THE OLD", mode: "decrypt" }) as string;
      expect(dec).toContain("Plain  : RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL");
      // The failed Crow candidate stays a failed candidate: the exact model
      // emits the same recorded letter soup, not silently "improved" output.
      const CROW = "81232 44783 73232 32263 75722 86365 51963 87366 03222 72668 33331 27230 52235 23366 23822 87373 75343 52352 22233 29348 72314 63282 03622 22824 35552 23820 28242 22051 38253 78435 26882 44825 82262 72736 59828 70417 82232 22288 22682 21731 65838 47821 47438 75321 25803 22980 25288 84853 83221 55566 12882 32833 56821 61483 61322 52289 29223 38362 64330 03281 04482 38254 24393 22203 85563 42714 75854 33606 22125 32227 32427 54827 34541 73353 02673 22537 58933 02858 78627 23216 18332 58738 17238 27432 75818 78175 22327 21458 58181 16284 32082 36857 60426 34562 34873 32531 48845 26072 42848 81358 26533 52733 04602 28232 38732 23385 38336 23731 83852 72638 08538 20333 27838 52662 13523 27833 39332 81488 25260 82636";
      const crow = k.run("secomExact", CROW, { phrase: "IN MY MEMORY I WILL ALWAYS SEE", mode: "decrypt" }) as string;
      expect(crow).toContain("Plain  : OYSASOXVEMSA 0OYVEAAPSFPSMSFITOTSHAOSHSS");

      // The fitness instruments report English-like vs soup-like IoC.
      const english = "THE OLD CROWS ARE ON THE WATCH AND THE TOWN REMEMBERS EVERY WINTER OF GRIEF AND EVERY NAME OF THE LOST";
      const fit = k.run("iocFitness", english) as string;
      expect(fit).toMatch(/IoC {5}: 0\.0[5-8]/);
      expect(fit).toContain("Σh²");
      expect(fit).toContain("Stage 1");

      // End-to-end control: Beta/A/thin-B M4 ≡ wide-B M3, so the M4 recipe
      // builds the ciphertext and the hill-climb recovers Stecker + text.
      const SAMPLE = ("THE OLD CROWS ARE ON THE WATCH AND THE TOWN REMEMBERS EVERY WINTER OF GRIEF " +
        "THE PEOPLE WALK THE NARROW STREETS AT NIGHT AND SPEAK OF BETTER DAYS WHEN MUSIC FILLED " +
        "THE SQUARES AND NOBODY FEARED THE SOUND OF STRANGE ENGINES OVER THE RIVER AND EVERY " +
        "CHILD KNEW THE NAMES OF THE BIRDS AND THE BELLS RANG FOR EVENING PRAYER ACROSS THE VALLEY").replace(/[^A-Z]/g, "");
      const ct = k.run("enigmaM4", SAMPLE, { G: "Beta", L: "II", M: "IV", R: "I", ukw: "Bthin", pos: "ACRW", ring: "AAAA", plug: "EN RT OS AI" }) as string;
      const climb = k.run("plugboardHillClimb", ct, { L: "II", M: "IV", R: "I", ukw: "B", pos: "CRW", ring: "AAA", pairs: "6" }) as string;
      expect(climb).toContain("Found  : AI EN OS RT");
      expect(climb).toContain("Plain  : THEOLDCROWSAREONTHEWATCH");
    } finally { k.dom.window.close(); }
  });
});
