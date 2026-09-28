import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
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

/** dr7 corpus: 99info.zip → ATR.EXE (LZEXE 0.91 packed), disavr121.zip → Disavr3.exe (PKLITE). */
function corpusFile(zip: string, member: string): Buffer {
  const zipBytes = new Uint8Array(readFileSync(path.resolve("samples/archive/dr7", zip)));
  const entries = unzipSync(zipBytes);
  const key = Object.keys(entries).find((name) => name.toLowerCase() === member.toLowerCase());
  if (!key) throw new Error(`member ${member} not found in ${zip}`);
  return Buffer.from(entries[key]);
}

const sha256 = (data: Buffer | Uint8Array | string) =>
  createHash("sha256").update(data).digest("hex");

describe("CyberChef EXE protection deep dive", () => {
  it("registers five researched recipes and curated packs", () => {
    const kitchen = bootCyberChef();
    try {
      const ids = kitchen.operations.map((operation) => operation.id);
      const added = ["mzTriage", "lzexeDecode", "tpeCrypt", "opcodeSubst", "antiDebugScan"];
      expect(ids).toEqual(expect.arrayContaining(added));
      expect(new Set(ids).size).toBe(ids.length);
      expect(kitchen.html).toContain("358 recipes");
      expect(kitchen.html).toContain("EXE Packer Triage & LZEXE Unpack (Ghidra-verified)");
      expect(kitchen.html).toContain("DOS Anti-Debug & Polymorphic Ops (TPE, Johansson)");
      for (const id of added) expect(operationCategory(kitchen, id)).toBe("EXE Protection");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("mzTriage parses the MZ header and fingerprints LZEXE 0.91 and PKLITE", async () => {
    const kitchen = bootCyberChef();
    try {
      const atr = corpusFile("99info.zip", "ATR.EXE");
      const report = await kitchen.run("mzTriage", atr.toString("hex"));
      expect(report).toContain("e_cs       = 0x05B3");
      expect(report).toContain("e_ip       = 0x000E");
      expect(report).toContain("entry = 05B3:000E");
      expect(report).toContain('packer: LZEXE 0.91 — signature "LZ91" at 0x1C');
      // Stub data area: original entry 0:0, original ss:sp 0x0D86:0x0080.
      expect(report).toContain("orig entry 0:0");
      expect(report).toContain("orig ss:sp D86:80");
      expect(report).toContain("packed paras 0x5B3");
      expect(report).toContain("stub reloc table decodes to 132 entries");

      const disavr = corpusFile("disavr121.zip", "Disavr3.exe");
      const pkreport = await kitchen.run("mzTriage", disavr.toString("hex"));
      expect(pkreport).toContain("packer: PKLITE");
      expect(pkreport).toContain('string "PKLITE Copr."');
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("lzexeDecode unpacks ATR.EXE byte-identically to the UNLZEXE 0.9 reference", async () => {
    const kitchen = bootCyberChef();
    try {
      const atr = corpusFile("99info.zip", "ATR.EXE");
      const report = await kitchen.run("lzexeDecode", atr.toString("hex"));
      expect(report).toContain("unpacked 55002 bytes (0xD6DA) from a 23851-byte stream");
      expect(report).toContain("stream consumed : 23335 of 23851 bytes");
      expect(report).toContain("literals        : 9974");
      expect(report).toContain("short matches   : 2957");
      expect(report).toContain("relocations     : 132");

      const exeHex = await kitchen.run("lzexeDecode", atr.toString("hex"), { mode: "exe" });
      const exe = Buffer.from(exeHex, "hex");
      // Verified against UNLZEXE 0.9 (mywave82/unlzexe) compiled and run on the
      // same file; see samples/exeprotect/VECTORS.md for the full chain.
      expect(exe.length).toBe(56026);
      expect(sha256(exe)).toBe("4eb9a400e69b310882cfc3dca4402520ff515f5476eb7a7852582d7eb545c38c");

      // The rebuilt original triages as a plain EXE with the restored header.
      const triage = await kitchen.run("mzTriage", exeHex);
      expect(triage).toContain("entry = 0000:0000");
      expect(triage).toContain("relocations: 132");
      expect(triage).toContain("[0] 0000:0001");
      expect(triage).toContain("packer: unknown");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("lzexeDecode refuses non-LZEXE-0.91 input instead of guessing", async () => {
    const kitchen = bootCyberChef();
    try {
      const disavr = corpusFile("disavr121.zip", "Disavr3.exe");
      await expect(kitchen.run("lzexeDecode", disavr.toString("hex"))).rejects.toThrow(
        /unsupported packer: PKLITE/,
      );
      await expect(kitchen.run("lzexeDecode", "00ff")).rejects.toThrow(/Not an MZ file/);
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("tpeCrypt matches the asm-transcribed reference harness and round-trips", async () => {
    const kitchen = bootCyberChef();
    try {
      // Vectors cross-checked against a C harness transcribed from
      // samples/src/tpe_v12.asm (do_encrypt + lup/blup loops).
      expect(
        await kitchen.run("tpeCrypt", "abcdef01", {
          key: "beef", step: "0001", method: "xor", width: "word", mode: "encrypt",
        }),
      ).toBe("5b731ebf");
      expect(
        await kitchen.run("tpeCrypt", "5b731ebf", {
          key: "beef", step: "0001", method: "xor", width: "word", mode: "decrypt",
        }),
      ).toBe("abcdef01");
      expect(
        await kitchen.run("tpeCrypt", "00010203", {
          key: "beef", step: "0101", method: "add", width: "byte", mode: "encrypt",
        }),
      ).toBe("f0f2f4f6");
      expect(
        await kitchen.run("tpeCrypt", "deadbeefcafe", {
          key: "1234", step: "beef", method: "add", width: "word", mode: "encrypt",
        }),
      ).toBe("017fd07fcb4d");
      expect(
        await kitchen.run("tpeCrypt", "017fd07fcb4d", {
          key: "1234", step: "beef", method: "add", width: "word", mode: "decrypt",
        }),
      ).toBe("deadbeefcafe");
      expect(
        await kitchen.run("tpeCrypt", "0011223344556677", {
          key: "aaaa", step: "0007", method: "xor", width: "byte", mode: "encrypt",
        }),
      ).toBe("b1a99df58981bd95");
      expect(
        await kitchen.run("tpeCrypt", "0102", {
          key: "0000", step: "00ff", method: "sub", width: "word", mode: "encrypt",
        }),
      ).toBe("0201");
      // Word mode requires an even byte count (text "abc" is 3 bytes; hex
      // strings are always left-padded to whole bytes by the input parser).
      await expect(
        kitchen.run("tpeCrypt", "abc", { width: "word", infmt: "text" }),
      ).rejects.toThrow(/even number of bytes/);
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("opcodeSubst applies and inverts Johansson's published byte-pairs", async () => {
    const kitchen = bootCyberChef();
    try {
      const report = await kitchen.run("opcodeSubst", "03C313C28AE1", {
        direction: "report", infmt: "hex",
      });
      expect(report).toContain("Johansson substitutions found: 3");
      expect(report).toContain("03C3 → 01D8  (ADD AX,BX, set 1→2)");
      expect(report).toContain("13C2 → 11D0  (ADC AX,DX, set 1→2)");

      const forward = await kitchen.run("opcodeSubst", "03C3", { direction: "12", infmt: "hex" });
      expect(forward).toContain("substituted 1 byte pair(s)");
      expect(forward.endsWith("01d8")).toBe(true);

      const back = await kitchen.run("opcodeSubst", "01d8", { direction: "21", infmt: "hex" });
      expect(back.endsWith("03c3")).toBe(true);

      const none = await kitchen.run("opcodeSubst", "9090", { direction: "report", infmt: "hex" });
      expect(none).toContain("no table entries matched");
    } finally {
      kitchen.dom.window.close();
    }
  });

  it("antiDebugScan flags the corpus techniques with offsets", async () => {
    const kitchen = bootCyberChef();
    try {
      // Hand-assembled from samples/src/anti-debug1*.asm snippets.
      const code =
        "b805fe" + //        mov ax,0FE05h      (1a)
        "ebfc" + //          jmp $-2            (1a) backward jump into the immediate
        "2d039e" + //        sub ax,9E03h
        "9c9e" + //          pushf / popf       trap-flag inspection
        "b80835" + //        mov ax,3508h       timer vector fetch (1e)
        "f6f4" + //          div ah             deliberate INT 0 (1d)
        "cd01" + //          int 01h
        "f1" + //            icebp
        "ebfe" + //          jmp $               jump-to-self hang
        "c60600009090" + // mov byte [0000],90 self-modifying store
        "b421" + "cd21"; //  mov ah,21h-ish then int 21h
      const report = await kitchen.run("antiDebugScan", code);
      expect(report).toContain("JMP $ (jump-to-self)");
      expect(report).toContain("backward short jump (EB FC)");
      expect(report).toContain("PUSHF … POPF pair");
      expect(report).toContain("MOV AX,3508h (get INT 8 vector)");
      expect(report).toContain("DIV AH (deliberate divide error)");
      expect(report).toContain("INT 01h");
      expect(report).toContain("ICEBP (undocumented INT 1)");
      expect(report).toContain("before INT 21h");
      expect(await kitchen.run("antiDebugScan", "90909090")).toContain(
        "no anti-debug signatures matched",
      );
    } finally {
      kitchen.dom.window.close();
    }
  });
});

function operationCategory(kitchen: { operations: Operation[] }, id: string): string {
  const found = kitchen.operations.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Operation not registered: ${id}`);
  return (found as unknown as { category: string }).category;
}
