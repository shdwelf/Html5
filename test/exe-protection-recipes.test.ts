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

/**
 * dr7 corpus: 99info.zip → ATR.EXE (LZEXE 0.91 packed), disavr121.zip → Disavr3.exe (PKLITE).
 * games corpus: keen1.zip → KEEN1.EXE, DUKE2.zip → DUKE2/NUKEM2.EXE (both LZEXE 0.91).
 */
function corpusFile(zip: string, member: string, dir = "samples/archive/dr7"): Buffer {
  const zipBytes = new Uint8Array(readFileSync(path.resolve(dir, zip)));
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
      expect(kitchen.html).toContain("360 recipes");
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

  // Regression for the bug found by the DOS game corpus (docs/dos-game-disassembly.md
  // §2): the stub data offset was hard-coded 0x5B30, which is only e_cs<<4 for
  // ATR.EXE. Every other LZEXE 0.91 file read its stub info from the wrong bytes.
  // These two samples have e_cs = 0xC66 and 0xE02, so they fail on the old code
  // and pass only when the offset is derived from the header.
  it.each([
    {
      name: "KEEN1.EXE (Commander Keen 1 v1.31, Apogee/id 1990)",
      zip: "keen1.zip",
      member: "KEEN1.EXE",
      stubOff: 0xc660,
      unpacked: 99972,
      stream: 51158,
      consumed: 50773,
      literals: 21164,
      relocs: 17,
      exeLen: 100484,
      exeSha: "d52d7b6bd9f25412ff40d0bece121f83d3c0aca87abd7d879c8219711b61ed70",
    },
    {
      name: "NUKEM2.EXE (Duke Nukem II shareware, Apogee 1993)",
      zip: "DUKE2.zip",
      member: "DUKE2/NUKEM2.EXE",
      stubOff: 0xe020,
      unpacked: 114124,
      stream: 58820,
      consumed: 57370,
      literals: 23618,
      relocs: 949,
      exeLen: 118220,
      exeSha: "06589de60d40d85d5e97e0b9b635bfb7b84050355e63ac2bbee1176d2d4d8b0a",
    },
  ])("lzexeDecode derives the stub offset per file: $name", async (vector) => {
    const kitchen = bootCyberChef();
    try {
      const packed = corpusFile(vector.zip, vector.member, "samples/archive/games");

      // mzTriage must locate the stub from e_cs, not from a constant.
      const triage = await kitchen.run("mzTriage", packed.toString("hex"));
      expect(triage).toContain("packer: LZEXE 0.91");
      expect(triage).toContain(`LZEXE stub data at image+0x${vector.stubOff.toString(16).toUpperCase()}`);
      expect(triage).toContain(`stub reloc table decodes to ${vector.relocs} entries`);

      const report = await kitchen.run("lzexeDecode", packed.toString("hex"));
      expect(report).toContain(
        `unpacked ${vector.unpacked} bytes (0x${vector.unpacked.toString(16).toUpperCase()}) from a ${vector.stream}-byte stream`,
      );
      expect(report).toContain(`stream consumed : ${vector.consumed} of ${vector.stream} bytes`);
      expect(report).toContain(`literals        : ${vector.literals}`);
      expect(report).toContain(`relocations     : ${vector.relocs}`);

      // Byte-identical to tools/exeprotect.py, the independent Python
      // implementation; see samples/exeprotect/VECTORS.md.
      const exeHex = await kitchen.run("lzexeDecode", packed.toString("hex"), { mode: "exe" });
      const exe = Buffer.from(exeHex, "hex");
      expect(exe.length).toBe(vector.exeLen);
      expect(sha256(exe)).toBe(vector.exeSha);

      // The rebuilt original is a plain unpacked MZ again.
      const rebuilt = await kitchen.run("mzTriage", exeHex);
      expect(rebuilt).toContain(`relocations: ${vector.relocs}`);
      expect(rebuilt).toContain("packer: unknown");
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
