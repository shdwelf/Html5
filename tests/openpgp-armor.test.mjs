// OpenPGP Radix-64 armor checksum (RFC 4880 §6.1) — the recipe the Kleopatra /
// GnuPG thread contributed, with GnuPG's own repository test blob as the control
// vector.  Source record: docs/recipe-sourcing-round-4-2026-10-14.md
//
// The blob below is tests/openpgp/bug1223-good.asc, verbatim, from the GnuPG
// repository (github.com/gpg/gnupg, fetched 2026-10-14).  Its printed armor
// checksum is "=xsEd" — 0xC6C11D over the 592-byte packet stream — so the test
// fails loudly if either the parser or the CRC-24 drifts.
const GNUPG_BLOB = `Good test key for bug 1223 (Designated revoker sigs are not properly merged)

-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v1.4.10 (GNU/Linux)

mI0ES+OoSQEEAJUZ/+fC6DXN2X7Wxl4Huud/+i2qP1hcq+Qnbr7hVCKEnn0edYl+
6xfsKmAMBjl+qTZxPSDSx4r3ciMiIbnvXFtlBAQmji86kqoR6fm9s8BN7LTq7+2/
c2FHVF67D7zES7WgHc4i7CfiZnwXgkLvi5b1jBt+MTAOrFhdobxoy6/XABEBAAGI
twQfAQIAIQUCS+OsRRcMgAEO5b6XkoLYC591QPHM0u2U0hc56QIHAAAKCRA0t9EL
wQjoOrRXBACBqhigTcj8pJY14AkjV+ZzUbm55kJRDPdU7NQ1PSvczm7HZaL3b8Lr
Psa5c5+caVLjsGWkQycQl7lUIGU84KoUfwACQKVVLkqJz8LkL54lLcwkG70+1NH5
xoSNcHHVbYtqDLNeCOq5jEIoXuz44wiWVEfF+/B115PvgwZ63pjH1rRGVGVzdCBL
ZXkgRGVtb25zdHJhdGluZyBSZXZva2VyIFRyb3VibGUgKERPIE5PVCBVU0UpIDx0
ZXN0QGV4YW1wbGUubmV0Poi+BBMBAgAoBQJL46hJAhsDBQkACTqABgsJCAcDAgYV
CAIJCgsEFgIDAQIeAQIXgAAKCRA0t9ELwQjoOgLpA/9/si2QYmietY9a6VlAmMri
mhZeqo6zyn8zrO9RGU7+8jmeb5nVnXw1YmZcw2fiJgI9+tTMkTfomyR6k0EDvcEu
2Mg3USkVnJfrrkPjSL9EajW6VpOUNxlox3ZT1oyEo3OOnVF1gC1reWYfy7Ns9zIB
1leLXbMr86zYdCoXp0Xu4g==
=xsEd
-----END PGP PUBLIC KEY BLOCK-----
`;

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-openpgp-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = dom.window.eval("OPERATIONS");
  const byId = new Map(ops.map((op) => [op.id, op]));
  const run = (id, input = "", changes = {}) => {
    const op = byId.get(id);
    assert.ok(op, `operation ${id} is registered`);
    const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return op.run(input, args);
  };
  return { run, ops, dom };
}

// The 592-byte packet stream, decoded straight out of the embedded armor.
function payloadBytes() {
  const lines = GNUPG_BLOB.split("\n");
  const start = lines.findIndex((line) => line.startsWith("-----BEGIN PGP"));
  const payload = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || /^Version:/.test(line)) continue;
    if (line.startsWith("=")) break;
    payload.push(line);
  }
  return Buffer.from(payload.join(""), "base64");
}

test("the GnuPG control blob verifies: =xsEd is 0xC6C11D over its 592-byte payload", () => {
  const { run, dom } = boot();
  try {
    const bytes = payloadBytes();
    assert.equal(bytes.length, 592, "the control blob is the published 592-byte packet stream");

    const out = run("pgpArmorCheck", GNUPG_BLOB);
    assert.match(out, /Payload {4}: 592 bytes of decoded packet stream/, out);
    assert.match(out, /Printed {4}: =xsEd/, out);
    assert.match(out, /Computed {3}: =xsEd {2}\(0xC6C11D\)/, out);
    assert.match(out, /Verdict {4}: OK — the printed checksum matches the payload/, out);
  } finally {
    dom.window.close();
  }
});

test("a damaged armor block is reported as a mismatch, and a block without a CRC line says so", () => {
  const { run, dom } = boot();
  try {
    // One character of the payload changed — the ordinary transcription accident.
    const damaged = GNUPG_BLOB.replace("mI0ES+OoSQEEAJUZ", "mI0ES+OoSQEEAJUY");
    assert.notEqual(damaged, GNUPG_BLOB, "the negative vector must actually differ");
    const out = run("pgpArmorCheck", damaged);
    assert.match(out, /Verdict {4}: MISMATCH — the payload was altered or truncated after it was armored/, out);
    assert.match(out, /Printed {4}: =xsEd/, out);
    assert.doesNotMatch(out, /Computed {3}: =xsEd/, out);

    const stripped = GNUPG_BLOB.replace("\n=xsEd", "");
    const noCrc = run("pgpArmorCheck", stripped);
    assert.match(noCrc, /Printed {4}: \(none\)/, noCrc);
    assert.match(noCrc, /Verdict {4}: NO CHECKSUM LINE/, noCrc);

    assert.throws(() => run("pgpArmorCheck", "not an armored block"), /armor header/i);
  } finally {
    dom.window.close();
  }
});

test("Data mode prints the exact armor line a writer would append", () => {
  const { run, dom } = boot();
  try {
    const hex = payloadBytes().toString("hex");
    const out = run("pgpArmorCheck", hex, { mode: "data", infmt: "hex" });
    assert.match(out, /Input {6}: 592 bytes/, out);
    assert.match(out, /CRC-24 {5}: 0xC6C11D {2}\(poly 0x1864CFB, init 0xB704CE, no final XOR\)/, out);
    assert.match(out, /Armor line : =xsEd/, out);

    // The same 592 bytes arriving as base64 (the blocks are pasted in both forms).
    const b64 = payloadBytes().toString("base64").replace(/(.{64})/g, "$1\n");
    assert.match(run("pgpArmorCheck", b64, { mode: "data", infmt: "base64" }), /Armor line : =xsEd/);

    // Empty input: the CRC is the bare initial value, and its Radix-64 line is "=twTO".
    assert.match(run("pgpArmorCheck", "", { mode: "data" }), /CRC-24 {5}: 0xB704CE/);
    assert.match(run("pgpArmorCheck", "", { mode: "data" }), /Armor line : =twTO/);
  } finally {
    dom.window.close();
  }
});
