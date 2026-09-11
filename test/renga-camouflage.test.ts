import { describe, expect, it } from "vitest";
import { validateMnemonic } from "../src/lib/wallet";
import {
  CANONICAL_HAIBUN,
  CANONICAL_HOKKU,
  CANONICAL_RENGA_MNEMONIC,
  CANONICAL_WAKIKU,
  extractTanRenga,
  haibunForMnemonic,
  mergeTanRenga,
  mnemonicFromRenga,
  packRenga,
  RENGA_PATTERN,
  renderCamouflageHtml,
  solveTanRengaChecksum,
  splitCanonicalRenga,
  splitVoices,
} from "../src/lib/renga";

describe("canonical harvest renga", () => {
  it("is an 18-word checksum-valid BIP-39 phrase", () => {
    const words = CANONICAL_RENGA_MNEMONIC.split(" ");
    expect(words).toHaveLength(18);
    expect(validateMnemonic(CANONICAL_RENGA_MNEMONIC)).toBe(true);
  });

  it("partitions exactly into tan-renga 5-7-5 / 7-7", () => {
    const split = splitCanonicalRenga();
    expect(split.valid).toBe(true);
    expect(split.counts).toEqual([...RENGA_PATTERN]);
    expect(split.stanzas.map((s) => s.type)).toEqual(["hokku", "wakiku"]);
    expect(split.lines.map((l) => l.words.join(" "))).toEqual([
      "morning brief captain",
      "suspect great weather again",
      "chronic leaf harvest",
      "other night rookie erase",
      "rival web design domain",
    ]);
    expect(mnemonicFromRenga(split)).toBe(CANONICAL_RENGA_MNEMONIC);
  });

  it("keeps the haibun free of wallet vocabulary so the story is the camouflage", () => {
    const prose = CANONICAL_HAIBUN.beats
      .filter((b) => b.kind === "prose")
      .map((b) => b.text ?? "")
      .join(" ");
    expect(prose).toMatch(/harbour woke before the bells/i);
    expect(prose).not.toMatch(/bip-?39|mnemonic|wallet|seed phrase|checksum/i);
    expect(CANONICAL_HAIBUN.beats.some((b) => b.kind === "hokku")).toBe(true);
    expect(CANONICAL_HAIBUN.beats.some((b) => b.kind === "wakiku")).toBe(true);
  });

  it("exports a literary chapbook that still contains every spine word, in order", () => {
    const { haibun, renga } = haibunForMnemonic(CANONICAL_RENGA_MNEMONIC);
    const html = renderCamouflageHtml(haibun, renga, false);
    expect(html).toContain("Two Voices at Harvest");
    expect(html).not.toMatch(/BIP-39|mnemonic|checksum/i);
    const verse = renga.lines.map((l) => l.words.join(" "));
    for (const line of verse) expect(html).toContain(line);
  });
});

describe("tan-renga merge", () => {
  it("joins the two harvest voices into the checksum-valid spine", () => {
    const merged = mergeTanRenga(CANONICAL_HOKKU, CANONICAL_WAKIKU);
    expect(merged.mnemonic).toBe(CANONICAL_RENGA_MNEMONIC);
    expect(merged.meterValid).toBe(true);
    expect(merged.checksumValid).toBe(true);
    expect(splitVoices(merged.mnemonic)).toEqual({
      hokku: CANONICAL_HOKKU,
      wakiku: CANONICAL_WAKIKU,
    });
  });

  it("extracts the five verse lines from the camouflage chapbook", () => {
    const { haibun, renga } = haibunForMnemonic(CANONICAL_RENGA_MNEMONIC);
    const html = renderCamouflageHtml(haibun, renga, false);
    const found = extractTanRenga(html);
    expect(found?.mnemonic).toBe(CANONICAL_RENGA_MNEMONIC);
    expect(found?.meterValid).toBe(true);
    expect(found?.checksumValid).toBe(true);
  });

  it("solves an unread wakiku closing word that still scans as tan-renga", () => {
    const hits = solveTanRengaChecksum(CANONICAL_HOKKU, "other night rookie erase\nrival web design ?");
    expect(hits.map((h) => h.mnemonic)).toContain(CANONICAL_RENGA_MNEMONIC);
    for (const hit of hits) {
      expect(hit.meterValid).toBe(true);
      expect(hit.checksumValid).toBe(true);
      expect(hit.renga.counts).toEqual([...RENGA_PATTERN]);
    }
  });
});

describe("packRenga", () => {
  it("rejects a phrase that overshoots a line", () => {
    const split = packRenga("abandon ability able about above absent".split(" "));
    expect(split.valid).toBe(false);
  });

  it("wraps an unknown renga-shaped phrase in the generic haibun", () => {
    const { canonical, haibun } = haibunForMnemonic("not a phrase");
    expect(canonical).toBe(false);
    expect(haibun.title).toBe("A Poem Left in a Drawer");
  });
});
