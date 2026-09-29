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
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const operations = dom.window.eval("OPERATIONS") as Operation[];
  const run = async (id: string, input: string, changes: Record<string, string> = {}) => {
    const op = operations.find((candidate) => candidate.id === id);
    if (!op) throw new Error(`Operation not registered: ${id}`);
    const args = Object.fromEntries(op.args.map((a) => [a.key, a.default]));
    return await op.run(input, { ...args, ...changes });
  };
  return { dom, operations, run };
}

const sample = (name: string) =>
  readFileSync(path.resolve("samples/archive/virushistory", name));
const hex = (buf: Buffer) => buf.toString("hex");

describe("virus encyclopedia recipes (verified against samples/archive/virushistory)", () => {
  it("registers both operations", () => {
    const { operations } = bootCyberChef();
    expect(operations.find((op) => op.id === "virusSigScan")).toBeTruthy();
    expect(operations.find((op) => op.id === "dosBootSector")).toBeTruthy();
  });

  it("virusSigScan identifies Stoned from its boot sector", async () => {
    const { run } = bootCyberChef();
    const out = await run("virusSigScan", hex(sample("stoned-standard.boo")));
    expect(out).toContain("Stoned (standard)");
    expect(out).toContain("far JMP"); // EA 05 00 00 7C entry tell
    expect(out).toContain("Your PC is now Stoned!");
    expect(out).toContain("LEGALISE MARIJUANA!");
    expect(out).toContain("55 AA");
  });

  it("virusSigScan flags the Michelangelo entry jump", async () => {
    const { run } = bootCyberChef();
    const out = await run("virusSigScan", hex(sample("michelangelo.boo")));
    expect(out).toContain("Michelangelo (A)");
    expect(out).toContain("entry near-jmp");
    expect(out).toMatch(/INT 13h sites: [1-9]/); // INT 13h-dense
  });

  it("virusSigScan finds the Cascade 1701 self-decryptor", async () => {
    const { run } = bootCyberChef();
    const out = await run("virusSigScan", hex(sample("cascade1701a.vom")));
    expect(out).toContain("Cascade 1701");
    expect(out).toContain("call $+3"); // decryptor prologue note
    expect(out).toContain("overlapping-word"); // decryptor loop note
  });

  it("virusSigScan finds the Jerusalem F1h/A1h install check", async () => {
    const { run } = bootCyberChef();
    const out = await run("virusSigScan", hex(sample("jerusalem664.vom")));
    expect(out).toContain("Jerusalem (standard family)");
    expect(out).toContain("F1h"); // install-check note
  });

  it("virusSigScan stays quiet on a clean image", async () => {
    const { run } = bootCyberChef();
    const clean = Buffer.alloc(512, 0);
    clean[510] = 0x55;
    clean[511] = 0xaa;
    const out = await run("virusSigScan", hex(clean));
    expect(out).toContain("no verified signature matched");
  });

  it("dosBootSector flags the Stoned far-jmp layout", async () => {
    const { run } = bootCyberChef();
    const out = await run("dosBootSector", hex(sample("stoned-standard.boo")));
    expect(out).toContain("far JMP 7C00:0005"); // EA 05 00 00 7C — offset 0x0005, segment 0x7C00 (matches js/x86dis.js: jmp far 0x7c00:0x5)
    expect(out).toContain("boot-virus layout");
    expect(out).toContain("no sane BPB");
    expect(out).toContain("55 AA (valid)"); // 0x1FE signature of the real Stoned sector
  });

  it("dosBootSector parses a healthy DOS 3.31 floppy BPB", async () => {
    const { run } = bootCyberChef();
    const sector = Buffer.alloc(512, 0);
    sector[0] = 0xeb; sector[1] = 0x3c; sector[2] = 0x90;          // short jmp + nop
    sector.write("MSDOS5.0", 3, "ascii");                           // OEM
    sector.writeUInt16LE(512, 0x0b);                                // bytes/sector
    sector[0x0d] = 2;                                               // sectors/cluster
    sector.writeUInt16LE(1, 0x0e);                                  // reserved
    sector[0x10] = 2;                                               // FATs
    sector.writeUInt16LE(224, 0x11);                                // root entries
    sector.writeUInt16LE(2880, 0x13);                               // total sectors (1.44M)
    sector[0x15] = 0xf0;                                            // media
    sector.writeUInt16LE(9, 0x16);                                  // sectors/FAT
    sector.writeUInt16LE(18, 0x18);                                 // sectors/track
    sector.writeUInt16LE(2, 0x1a);                                  // heads
    sector.writeUInt32LE(0, 0x1c);                                  // hidden
    sector[510] = 0x55; sector[511] = 0xaa;                         // 0x1FE boot signature
    const out = await run("dosBootSector", hex(sector));
    expect(out).toContain("512 B/sector");
    expect(out).toContain("2880 sectors");
    expect(out).toContain("1.44M");
    expect(out).toContain("MSDOS5.0");
    expect(out).toContain("9 sectors/FAT");
    expect(out).not.toContain("partition["); // empty partition table on a floppy boot sector
  });

  it("dosBootSector parses an MBR partition table", async () => {
    const { run } = bootCyberChef();
    const mbr = Buffer.alloc(512, 0);
    mbr[0] = 0xeb; mbr[1] = 0x04; mbr[2] = 0x90;
    const part = Buffer.alloc(16);
    part[0] = 0x80;               // bootable
    part[4] = 0x06;               // FAT16B
    part.writeUInt32LE(63, 8);
    part.writeUInt32LE(2048000, 12);
    part.copy(mbr, 0x1be);
    mbr[510] = 0x55; mbr[511] = 0xaa;
    const out = await run("dosBootSector", hex(mbr));
    expect(out).toContain("partition[0]");
    expect(out).toContain("BOOT");
    expect(out).toContain("FAT16B");
    expect(out).toContain("2048000 sectors");
  });

  it("dosBootSector flags Michelangelo's near-jmp-over-garbage", async () => {
    const { run } = bootCyberChef();
    const out = await run("dosBootSector", hex(sample("michelangelo.boo")));
    expect(out).toContain("Michelangelo pattern");
    expect(out).toContain("no sane BPB");
  });
});
