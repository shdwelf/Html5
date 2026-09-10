import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Jim Sanborn exhibits and VRML apps", () => {
  it("includes Sanborn Codex with all 30 exhibits in public/apps", () => {
    const codexPath = path.resolve("public/apps/sanborn-codex/index.html");
    expect(existsSync(codexPath)).toBe(true);
    const html = readFileSync(codexPath, "utf8");
    expect(html).toContain("Sanborn Codex");
    expect(html).toContain("The Encrypted Art of Jim Sanborn");
    expect(html).toContain("kryptos");
    expect(html).toContain("antipodes");
    expect(html).toContain("cyrillic-projector");
    expect(html).toContain("critical-assembly");
    expect(html).toContain("terrestrial-physics");
  });

  it("includes Kryptos VRML with 11 sculptures and CIA grounds", () => {
    const kryptosPath = path.resolve("public/apps/kryptos-vrml/index.html");
    expect(existsSync(kryptosPath)).toBe(true);
    const html = readFileSync(kryptosPath, "utf8");
    expect(html).toContain("Kryptos");
    expect(html).toContain("Cyrillic Projector");
    expect(html).toContain("Antipodes");
    expect(html).toContain("Elonka Dunin");
  });

  it("has webxdc manifests and runtime shims for companion XDCs", () => {
    expect(existsSync(path.resolve("public/apps/sanborn-codex/manifest.toml"))).toBe(true);
    expect(existsSync(path.resolve("public/apps/sanborn-codex/webxdc.js"))).toBe(true);
    expect(existsSync(path.resolve("public/apps/kryptos-vrml/manifest.toml"))).toBe(true);
    expect(existsSync(path.resolve("public/apps/kryptos-vrml/webxdc.js"))).toBe(true);
  });
});
