import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const kitchen = readFileSync("public/apps/cyberchef/index.html", "utf8");
const packBlock = kitchen.match(/const RECIPE_PACKS=\{([\s\S]*?)\n\};/);
const packOperations = new Set([...kitchen.matchAll(/addOp\('([^']+)'/g)].map((match) => match[1]));
// Six 2-input gate ops are registered in a loop (addOp('ic' + g.name, …) over
// the GATES table), so the plain addOp('…') scan above cannot see icAND &
// friends. They only surfaced here when round 14's Electronics spotlight put
// them in the RECIPE_PACKS literal; materialise the loop's ids explicitly.
const gateBlock = kitchen.match(/const GATES=\{([\s\S]*?)\n\};/);
for (const match of (gateBlock?.[1] ?? "").matchAll(/name:'([A-Z]+)'/g)) packOperations.add("ic" + match[1]);

describe("safe-source encoding, obfuscation, encryption and Ghidra recipe packs", () => {
  it("exposes the new operation packs in the in-app recipe-pack picker", () => {
    expect(packBlock).not.toBeNull();
    for (const name of [
      "Encoding Lab — Base64, Base32, URL, Unicode, Hex, ROT47 round-trips",
      "Binary File Lab — byte-exact Base64 round-trip (load a file first)",
      "Obfuscation Lab — single-byte XOR with a toy ASCII input",
      "Encryption Lab — AES-GCM password round-trip (demo text only)",
      "Encryption Lab — AES-CBC round-trip (legacy mode; demo text only)",
      "Block Cipher Lab — Camellia ECB round-trip (demo text only)",
      "Stream Cipher Lab — ChaCha20 round-trip (fixed test key/nonce only)",
      "Legacy Cipher Lab — RC4 round-trip (analysis only; not secure)",
      "MZ Header Preflight — static triage before a Ghidra import",
    ]) expect(packBlock![1]).toContain(name);
  });

  it("uses only operations implemented in this kitchen, and excludes ViewerMade", () => {
    expect(packBlock).not.toBeNull();
    const ids = [...packBlock![1].matchAll(/\[\['([A-Za-z0-9_]+)'/g)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(packOperations.has(id), `missing operation implementation: ${id}`).toBe(true);
    expect(kitchen).not.toMatch(/N17Pro3426|ViewerMade/);
    expect(kitchen).toContain("demo-only-not-secret");
  });
});
