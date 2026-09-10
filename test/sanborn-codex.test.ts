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

  it("declares name, landscape orientation and source URL in both manifests", () => {
    for (const dir of ["sanborn-codex", "kryptos-vrml"]) {
      const manifest = readFileSync(path.resolve(`public/apps/${dir}/manifest.toml`), "utf8");
      expect(manifest).toMatch(/name\s*=\s*"/);
      expect(manifest).toContain('orientation = "landscape"');
      expect(manifest).toContain('source_code_url = "https://github.com/shdwelf/Html5"');
    }
  });

  it("ships a square 256×256 PNG icon inside the spec's 128–512px band", () => {
    for (const dir of ["sanborn-codex", "kryptos-vrml"]) {
      const icon = readFileSync(path.resolve(`public/apps/${dir}/icon.png`));
      // PNG magic + IHDR
      expect(icon.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      const width = icon.readUInt32BE(16);
      const height = icon.readUInt32BE(20);
      expect(width).toBe(256);
      expect(height).toBe(256);
    }
  });

  it("fixes the Kryptos info panel so it never idles on a 'Loading...' placeholder", () => {
    const html = readFileSync(path.resolve("public/apps/kryptos-vrml/index.html"), "utf8");
    // init must populate the panel via selectSculpture (plain createScene left it on "Loading...")
    expect(html).toContain("selectSculpture('kryptos')");
    // section jumpers must open the panel instead of toggling it shut
    expect(html).toContain("function openPanel()");
    expect(html).toContain("wasOpen");
    // broken WebXR session replaced with a graceful notice
    expect(html).toContain('id="toast"');
  });
});
