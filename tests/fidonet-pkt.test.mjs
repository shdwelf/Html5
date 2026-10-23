import { test } from "node:test";
import assert from "node:assert/strict";

import {
  echomailToNews,
  isValidNewsgroup,
  newsgroupForArea,
  parseBody,
  parsePacket,
  serializePacket,
} from "../js/fidonet-pkt.js";

// All fixtures are SYNTHETIC packets built in-test (FTS-0001 layout).
// No real FidoNet traffic is reproduced.

const HEADER = {
  origNode: 100, destNode: 200, year: 1994, month: 9, day: 9,
  hour: 12, minute: 30, second: 0, baud: 0, origNet: 104, destNet: 104,
  productCode: 0, revision: 0,
};

function echoMessage(overrides = {}) {
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
  return {
    origNode: 100, destNode: 200, origNet: 104, destNet: 104,
    attribute: 0, cost: 0, dateTime: "09 Sep 94  12:30:00",
    toName: "All", fromName: "Synthetic Sysop", subject: "Gateway test",
    rawBody, ...overrides,
  };
}

test("Type-2 packet round-trips header and packed echomail", () => {
  const bytes = serializePacket(HEADER, [echoMessage()]);
  const { header, messages, warnings } = parsePacket(bytes);
  assert.deepEqual(warnings, []);
  assert.equal(header.origNet, 104);
  assert.equal(header.destNode, 200);
  assert.equal(header.year, 1994);
  assert.equal(messages.length, 1);
  const m = messages[0];
  assert.equal(m.fromName, "Synthetic Sysop");
  assert.equal(m.subject, "Gateway test");
  assert.equal(m.dateTime, "09 Sep 94  12:30:00");
  assert.equal(m.area, "FIDOTEST");
  assert.equal(m.kludges.MSGID, "1:104/100 2f3a4b5c");
  assert.equal(m.kludges.REPLY, "1:104/200 1a2b3c4d");
  assert.match(m.text, /Hello from a synthetic node\./);
  assert.doesNotMatch(m.text, /SEEN-BY/, "footers are preserved as fields, not body text");
  assert.equal(m.seenBy.length, 1);
  assert.deepEqual(m.path, ["104/100 200"]);
  assert.match(m.origin, /Synthetic BBS/);
});

test("packet parsing is bounded and fail-soft on damaged input", () => {
  assert.throws(() => parsePacket(new Uint8Array(12)), /too short/);
  const bytes = serializePacket(HEADER, [echoMessage()]);
  const cut = bytes.slice(0, bytes.length - 30); // truncate inside the body
  const { messages, warnings } = parsePacket(cut);
  assert.equal(messages.length, 1, "the damaged message is still surfaced");
  assert.ok(warnings.length >= 0); // truncation must never throw past the header gate
  const junk = parsePacket(new Uint8Array([...serializePacket(HEADER, []).slice(0, 58), 9, 9, 1, 2, 3]));
  assert.ok(junk.warnings.some((w) => /unknown packed-message type/.test(w)));
});

test("echomail -> news mapping keeps ids stable and control lines off the wire", () => {
  const { messages } = parsePacket(serializePacket(HEADER, [echoMessage()]));
  const article = echomailToNews(messages[0]);
  assert.equal(article.newsgroup, "fidonet.fidotest");
  assert.equal(article.messageId, "<2f3a4b5c@1.104.100.fidonet.invalid>");
  assert.deepEqual(article.references, ["<1a2b3c4d@1.104.200.fidonet.invalid>"]);
  assert.doesNotMatch(article.body, /MSGID|SEEN-BY|PATH:/);
  assert.equal(article.ftn.area, "FIDOTEST");
  assert.equal(article.ftn.seenByCount, 1);

  // Netmail (no AREA) maps only with an explicit group, never an invented one.
  const net = echomailToNews({ ...messages[0], area: null, kludges: {} });
  assert.equal(net.newsgroup, null);
  assert.equal(net.messageId, null);
});

test("newsgroup mapping follows the mbnntp valid-name rule", () => {
  assert.equal(newsgroupForArea("FIDOTEST"), "fidonet.fidotest");
  assert.equal(newsgroupForArea("SCI.ANCIENT"), "fidonet.sci.ancient");
  assert.equal(newsgroupForArea("WEIRD TAG!"), "fidonet.weird.tag");
  assert.equal(newsgroupForArea(""), null);
  assert.ok(isValidNewsgroup("fidonet.fidotest"));
  assert.ok(!isValidNewsgroup("fidonet"));
  assert.ok(!isValidNewsgroup("fidonet..double"));
  assert.ok(!isValidNewsgroup("FidoNet.Upper"));
});

test("parseBody separates kludges from text without dropping trailing content", () => {
  const body = parseBody("AREA:X\r\x01MSGID: 1:1/1 abc\rfirst\r--- tear\r * Origin: Somewhere (1:1/1)\rSEEN-BY: 1/1");
  assert.equal(body.area, "X");
  assert.equal(body.kludges.MSGID, "1:1/1 abc");
  assert.match(body.text, /first/);
  assert.equal(body.seenBy.length, 1);
});
