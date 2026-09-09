import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_RENGA_MNEMONIC } from "../src/lib/renga";

const html = readFileSync(
  path.resolve("public/apps/renga-camouflage/index.html"),
  "utf8",
);

describe("HTML5 renga camouflage app", () => {
  it("is a self-contained document with no network dependencies", () => {
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/<script src=/i);
    expect(html).toContain("Two Voices at Harvest");
  });

  it("embeds the harvest mnemonic as tan-renga and can hide the scholar note in print", () => {
    expect(html).toContain(CANONICAL_RENGA_MNEMONIC);
    expect(html).toContain("morning brief captain");
    expect(html).toContain("suspect great weather again");
    expect(html).toContain("chronic leaf harvest");
    expect(html).toContain("other night rookie erase");
    expect(html).toContain("rival web design domain");
    expect(html).toMatch(/@media print/);
    expect(html).toMatch(/\.scholar/);
  });
});
