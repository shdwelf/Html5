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

describe("CyberChef matrix-cipher deep dive", () => {
  it("ships six researched matrix recipes, curated packs, and reversible implementations", async () => {
    const kitchen = bootCyberChef();
    try {
      const ids = kitchen.operations.map((operation) => operation.id);
      const added = ["hill3", "twoSquare", "doubleColumn", "myszkowski", "turningGrille", "phillips"];
      expect(ids).toEqual(expect.arrayContaining(added));
      expect(new Set(ids).size).toBe(ids.length);
      expect(kitchen.html).toContain("372 recipes");
      expect(kitchen.html).toContain("Matrix Deep Dive — Hill, Two-Square & Phillips");
      expect(kitchen.html).toContain("Matrix Deep Dive — Columnar, Myszkowski & Grilles");

      // Wikipedia's Hill example: key GYBNQKURP encrypts ACT → POH and CAT → FIN;
      // the documented inverse matrix IFKVIVVMI recovers the plaintext.
      expect(await kitchen.run("hill3", "ACT")).toBe("POH");
      expect(await kitchen.run("hill3", "CAT")).toBe("FIN");
      expect(await kitchen.run("hill3", "POH", { mode: "decrypt" })).toBe("ACT");
      const hillCipher = await kitchen.run("hill3", "MATRIXENCRYPTION", { key: "KRYPTOSAB" });
      expect(await kitchen.run("hill3", hillCipher, { key: "KRYPTOSAB", mode: "decrypt" })).toBe("MATRIXENCRYPTIONXX");
      await expect(kitchen.run("hill3", "POHPOH", { key: "AAAAAAAAA", mode: "decrypt" })).rejects.toThrow(/not invertible/);

      // ACA's published TwoSquare sheet: horizontal squares DIALO / BIOGR…
      // encrypt "another digraphic setupx" to IRRTEHMKGIMEQGRUNMMZSV.
      expect(await kitchen.run("twoSquare", "another digraphic setupx")).toBe("IRRTEHMKGIMEQGRUNMMZSV");
      expect(await kitchen.run("twoSquare", "IRRTEHMKGIMEQGRUNMMZSV", { mode: "decrypt" })).toBe("ANOTHERDIGRAPHICSETUPX");
      // Wikipedia's vertical two-square (Q omitted): "help me obi wan kenobi".
      expect(await kitchen.run("twoSquare", "help me obi wan kenobi", {
        key1: "EXAMPLE", key2: "KEYWORD", layout: "vertical", merging: "q",
      })).toBe("HEDLXWSDJYANHOTKDG");
      expect(await kitchen.run("twoSquare", "HEDLXWSDJYANHOTKDG", {
        key1: "EXAMPLE", key2: "KEYWORD", layout: "vertical", merging: "q", mode: "decrypt",
      })).toBe("HELPMEOBIWANKENOBI");
      const horizontal = await kitchen.run("twoSquare", "MEET ME AT MIDNIGHT", { key1: "ZEBRA", key2: "OCTOPUS" });
      expect(await kitchen.run("twoSquare", horizontal, { key1: "ZEBRA", key2: "OCTOPUS", mode: "decrypt" })).toBe("MEETMEATMIDNIGHT");

      // Wikipedia's double-transposition walkthrough: ZEBRAS then STRIPE.
      expect(await kitchen.run("doubleColumn", "WE ARE DISCOVERED. FLEE AT ONCE")).toBe("CAEENSOIAEDRLEFWEDREEVTOC");
      const doubled = await kitchen.run("doubleColumn", "BRING RATIONS AT TEN PM", { key1: "CIPHER", key2: "MATRIX" });
      expect(await kitchen.run("doubleColumn", doubled, { key1: "CIPHER", key2: "MATRIX", mode: "decrypt" })).toBe("BRINGRATIONSATTENPM");

      // Wikipedia's Myszkowski example with key TOMATO.
      expect(await kitchen.run("myszkowski", "WE ARE DISCOVERED FLEE AT ONCE")).toBe("ROFOACDTEDSEEEACWEIVRLENE");
      // ACA's published Myszkowski sheet with key BANANA (89-letter message).
      const bananaP = "INCOMPLETECOLUMNARWITHPATTERNWORDKEYANDLETTERSUNDERSAMENUMBERTAKENOFFBYROWFROMTOPTOBOTTOM";
      const bananaC = "NOPEEOUNRIHATRWRKYNLTESNESMNMETKNFBRWRMOTBTOILLWTOATDEROOTOCMTCMATPENDEDERURAUBAEFYFOPOTM";
      expect(await kitchen.run("myszkowski", bananaP, { key: "BANANA" })).toBe(bananaC);
      expect(await kitchen.run("myszkowski", bananaC, { key: "BANANA", mode: "decrypt" })).toBe(bananaP);

      // ACA's published Grille sheet: 4×4 grille "1 8 10 12" clockwise.
      expect(await kitchen.run("turningGrille", "THETURNINGGRILLE", { size: "4", holes: "1 8 10 12" })).toBe("TILUNRGHGELTENIR");
      expect(await kitchen.run("turningGrille", "TILUNRGHGELTENIR", { size: "4", holes: "1 8 10 12", mode: "decrypt" })).toBe("THETURNINGGRILLE");
      // Black Chamber's 6×6 Cm walkthrough (default holes), both directions.
      expect(await kitchen.run("turningGrille", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", { mode: "decrypt" })).toBe(
        "CFJUXZ158GHORTWY69BEIKMP047ADLNQSV23");
      expect(await kitchen.run("turningGrille", "CFJUXZ158GHORTWY69BEIKMP047ADLNQSV23")).toBe(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
      await expect(kitchen.run("turningGrille", "HELLO WORLD", { holes: "1 2 3 4 5 6 7 8 9" })).rejects.toThrow(/overlap/);

      // CWU's textbook Phillips example, first 40 letters verified letter-by-letter.
      expect(await kitchen.run("phillips", "SQUARESONEANDFIVEARETHESAMEANDSOARETWOAN")).toBe(
        "ZXVIYGZIWGIWLGPAVIPVHRTZIKGRWUFIXDGOBIMW");
      expect(await kitchen.run("phillips", "ZXVIYGZIWGIWLGPAVIPVHRTZIKGRWUFIXDGOBIMW", { mode: "decrypt" })).toBe(
        "SQUARESONEANDFIVEARETHESAMEANDSOARETWOAN");
      // ACA's published Phillips sheet (81-letter self-describing message, explicit square).
      const acaP = "SQUARESONEANDFIVEAREACTUALLYTHESAMEASARESQUARESTWOANDEIGHTTHEOVERALLPERIODISFORTY";
      const acaC = "KZWLYTGEDTQETARBTYGTLFXWLPPOXLTYKUTKGKYTKZWLYTGXSEQETIRZQAAQTCITYKPPVBLHEFHGREYXO";
      expect(await kitchen.run("phillips", acaP, { square: "DIAGOCBSLNEFHKMUTRQPVWXYZ" })).toBe(acaC);
      expect(await kitchen.run("phillips", acaC, { square: "DIAGOCBSLNEFHKMUTRQPVWXYZ", mode: "decrypt" })).toBe(acaP);
      const enc = await kitchen.run("phillips", "THE THINGS THAT COME TO THOSE WHO WAIT", { key: "PATIENCE" });
      expect(await kitchen.run("phillips", enc, { key: "PATIENCE", mode: "decrypt" })).toBe("THETHINGSTHATCOMETOTHOSEWHOWAIT");
    } finally {
      kitchen.dom.window.close();
    }
  });
});
