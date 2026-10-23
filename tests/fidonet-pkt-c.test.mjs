import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parsePacket, serializePacket } from "../js/fidonet-pkt.js";

// Cross-check: the C reference implementation (tools/bbs/ftnpkt.c, the
// uClinux conversion artifact) must agree with js/fidonet-pkt.js on the
// same synthetic packets. Skips cleanly where no C compiler exists.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cc = spawnSync("cc", ["--version"], { encoding: "utf8" });
const hasCc = cc.status === 0;

const HEADER = {
  origNode: 100, destNode: 200, year: 1994, month: 9, day: 9,
  hour: 12, minute: 30, second: 0, baud: 0, origNet: 104, destNet: 104,
  productCode: 0, revision: 0,
};

function fixtureBytes() {
  const rawBody = [
    "AREA:FIDOTEST",
    "\x01MSGID: 1:104/100 2f3a4b5c",
    "\x01REPLY: 1:104/200 1a2b3c4d",
    "\x01CHRS: UTF-8 4",
    "Hello from a synthetic node.",
    "Second line stays visible.",
    "--- SBBSecho 3.14",
    " * Origin: Synthetic BBS (1:104/100)",
    "SEEN-BY: 104/100 200 999",
    "\x01PATH: 104/100 200",
  ].join("\r");
  return serializePacket(HEADER, [{
    origNode: 100, destNode: 200, origNet: 104, destNet: 104,
    attribute: 0, cost: 0, dateTime: "09 Sep 94  12:30:00",
    toName: "All", fromName: "Synthetic Sysop", subject: "Gateway test", rawBody,
  }]);
}

test("C ftnpkt agrees with the JS parser on dump and --news views", { skip: !hasCc && "no C compiler in this environment" }, () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ftnpkt-"));
  try {
    const bin = path.join(dir, "ftnpkt");
    execFileSync("cc", ["-std=c99", "-Wall", "-Wextra", "-Werror", "-O2", "-o", bin, path.join(root, "tools/bbs/ftnpkt.c")], { stdio: "pipe" });
    const pkt = path.join(dir, "fixture.pkt");
    const bytes = fixtureBytes();
    writeFileSync(pkt, bytes);

    const js = parsePacket(bytes);
    const dump = execFileSync(bin, [pkt], { encoding: "utf8" });
    assert.match(dump, /PKT orig=104\/100 dest=104\/200 date=1994-09-09 12:30:00 type=2/);
    assert.match(dump, new RegExp(`area=${js.messages[0].area}`));
    assert.match(dump, new RegExp(`msgid="${js.messages[0].kludges.MSGID}"`));
    assert.match(dump, /BODY\nHello from a synthetic node\.\nSecond line stays visible\.\nEND/);

    const news = execFileSync(bin, ["--news", pkt], { encoding: "utf8" });
    assert.match(news, /Newsgroups: fidonet\.fidotest/);
    assert.match(news, /Message-ID: <2f3a4b5c@1\.104\.100\.fidonet\.invalid>/);
    assert.match(news, /References: <1a2b3c4d@1\.104\.200\.fidonet\.invalid>/);
    assert.doesNotMatch(news, /SEEN-BY|MSGID:|PATH:/, "control lines must never reach the news view");

    // Damaged input degrades, never crashes (nonzero exit only for <58B).
    const short = spawnSync(bin, [pkt + ".missing"], { encoding: "utf8" });
    assert.equal(short.status, 2);
    const tiny = path.join(dir, "tiny.pkt");
    writeFileSync(tiny, new Uint8Array(10));
    assert.equal(spawnSync(bin, [tiny], { encoding: "utf8" }).status, 2);
    const cut = path.join(dir, "cut.pkt");
    writeFileSync(cut, bytes.slice(0, bytes.length - 20));
    assert.equal(spawnSync(bin, [cut], { encoding: "utf8" }).status, 0, "truncated body must still dump with warnings");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
