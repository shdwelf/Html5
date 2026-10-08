import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(path.join(root, name), "utf8");

test("benign Ghidra example hash matches its published Optiboot provenance", () => {
  const sample = readFileSync(path.join(root, "samples/avr/optiboot_atmega328.hex"));
  const sha256 = createHash("sha256").update(sample).digest("hex");
  assert.equal(sha256, "0d9097a14032b1a882ac660add5d4092ad43e897903309a52d94f9949edf8877");
  assert.match(read("docs/ghidra-headless-benign-sample-methodology.md"), /Optiboot 8\.0/);
});

test("generic Ghidra postScript exports reports without launching or emulating its input", () => {
  const script = read("tools/ghidra_scripts/GenericProgramReport.java");
  assert.match(script, /Static disassembly only/);
  assert.match(script, /decompileFunction\([^,]+,\s*DECOMPILE_TIMEOUT_SECONDS/);
  assert.doesNotMatch(script, /ProcessBuilder|Runtime\.getRuntime\(\)\.exec|emulate\(|launchProgram\(/i);
  assert.match(read("docs/ghidra-headless-benign-sample-methodology.md"), /Geomate\.jr boundary/);
});
