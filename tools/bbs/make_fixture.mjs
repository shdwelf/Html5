#!/usr/bin/env node
/**
 * make_fixture.mjs — write the synthetic FTS-0001 fixture packet used to
 * cross-check ftnpkt builds (host vs m68k runner build, T6.3/T7.2).
 *
 * The bytes mirror the fixture in tests/fidonet-pkt-c.test.mjs (which
 * pins them against js/fidonet-pkt.js); this tool exists so the GitHub
 * runner can regenerate the identical packet without the test harness.
 * Usage: node tools/bbs/make_fixture.mjs <out.pkt>
 */
import { writeFileSync } from "node:fs";
import { serializePacket } from "../../js/fidonet-pkt.js";

const HEADER = {
  origNode: 100, destNode: 200, year: 1994, month: 9, day: 9,
  hour: 12, minute: 30, second: 0, baud: 0, origNet: 104, destNet: 104,
  productCode: 0, revision: 0,
};

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

const bytes = serializePacket(HEADER, [{
  origNode: 100, destNode: 200, origNet: 104, destNet: 104,
  attribute: 0, cost: 0, dateTime: "09 Sep 94  12:30:00",
  toName: "All", fromName: "Synthetic Sysop", subject: "Gateway test", rawBody,
}]);

const out = process.argv[2];
if (!out) { console.error("usage: make_fixture.mjs <out.pkt>"); process.exit(2); }
writeFileSync(out, bytes);
console.log(`wrote ${out} (${bytes.length} bytes)`);
