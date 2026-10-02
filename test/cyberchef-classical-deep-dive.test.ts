import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

type Operation = {
  id: string;
  args: Array<{ key: string; default: string }>;
  run: (input: string, args: Record<string, string>) => string | Promise<string>;
};

function bootCyberChef() {
  const html = readFileSync(path.resolve("public/apps/cyberchef/index.html"), "utf8");
  const dom = new JSDOM(html, {
    url: "https://example.test/apps/cyberchef/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      // The kitchen can call these only from user-triggered utility buttons.
      // Stubbing them keeps the test focused on the standalone recipes.
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const operations = dom.window.eval("OPERATIONS") as Operation[];

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

  return { dom, html, operations, run };
}

describe("CyberChef classical-cipher deep dive", () => {
  it("ships six researched recipes, curated packs, and reversible implementations", async () => {
    const kitchen = bootCyberChef();
    try {
      const ids = kitchen.operations.map((operation) => operation.id);
      const added = [
        "adfgx",
        "fractionatedMorse",
        "routeTransposition",
        "straddlingCheckerboard",
        "runningKey",
        "keyedSubstitution",
      ];
      expect(ids).toEqual(expect.arrayContaining(added));
      expect(new Set(ids).size).toBe(ids.length);
      expect(kitchen.html).toContain("372 recipes");
      expect(kitchen.html).toContain("Classical Deep Dive — Fractionation & Checkerboards");
      expect(kitchen.html).toContain("Classical Deep Dive — Running Keys & Routes");

      // Boxentriq's documented ADFGX example: MEET + KEYWORD / KEY → AAAGDXAD.
      expect(await kitchen.run("adfgx", "MEET", { transKey: "KEY", squareKey: "KEYWORD" })).toBe("AAAGDXAD");
      const adfgx = await kitchen.run("adfgx", "JIG", { transKey: "BALLOON", squareKey: "SECRET" });
      expect(await kitchen.run("adfgx", adfgx, { transKey: "BALLOON", squareKey: "SECRET", mode: "decrypt" })).toBe("IIG");

      // Practical Cryptography's Fractionated Morse worked vector.
      expect(await kitchen.run("fractionatedMorse", "DEFEND THE EAST", { key: "ROUNDTABLE" })).toBe("ESOAVVLJRSSTRX");
      const fractionated = await kitchen.run("fractionatedMorse", "MEET AT 9", { key: "ROUNDTABLE" });
      expect(await kitchen.run("fractionatedMorse", fractionated, { key: "ROUNDTABLE", mode: "decrypt" })).toBe("MEET AT 9");

      // ACA's row-write / column-read route example with a five-column grid.
      expect(await kitchen.run("routeTransposition", "SOLVE A GOOD CRYPT TODAY", {
        width: "5", write: "rows", read: "columns", padding: "", whitespace: "remove",
      })).toBe("SACTOGROLOYDVOPAEDTY");
      for (const read of ["rows", "columns", "snakeRows", "snakeColumns", "spiral"]) {
        const cipher = await kitchen.run("routeTransposition", "MEETATNOON", {
          width: "4", write: "rows", read, padding: "", whitespace: "remove",
        });
        expect(await kitchen.run("routeTransposition", cipher, {
          width: "4", write: "rows", read, padding: "", whitespace: "remove", mode: "decrypt",
        })).toBe("MEETATNOON");
      }

      const checkerboard = await kitchen.run("straddlingCheckerboard", "DEFEND THE EAST", {
        top: "ETAONRIS", rows: "26", key: "KEYWORD",
      });
      expect(await kitchen.run("straddlingCheckerboard", checkerboard, {
        top: "ETAONRIS", rows: "26", key: "KEYWORD", mode: "decrypt",
      })).toBe("DEFENDTHEEAST");

      const running = await kitchen.run("runningKey", "Defend the east!", {
        key: "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG",
      });
      expect(await kitchen.run("runningKey", running, {
        key: "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG", mode: "decrypt",
      })).toBe("Defend the east!");

      const substitution = await kitchen.run("keyedSubstitution", "Meet at 7!", { key: "ZEBRAS" });
      expect(await kitchen.run("keyedSubstitution", substitution, { key: "ZEBRAS", mode: "decrypt" })).toBe("Meet at 7!");
    } finally {
      kitchen.dom.window.close();
    }
  });
});
