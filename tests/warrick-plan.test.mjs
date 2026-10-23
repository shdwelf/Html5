// T12.1: Warrick-method recovery plans — scope, queries, refusals, packaging.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRecoveryPlan, waybackCdxUrl, inScope, recoveryLogLine } from "../js/warrick-plan.js";

test("plan carries discovery queries, Warrick passes and BagIt packaging", () => {
  const plan = buildRecoveryPlan(["http://example.org/lost/"], { from: 2010, to: 2015, targetDate: "20120109170000" });
  assert.equal(plan.tool, "warrick-method");
  assert.match(plan.mode, /no network access/);
  const [seed] = plan.seeds;
  const cdx = seed.discovery.find((d) => d.kind === "wayback-cdx").url;
  assert.match(cdx, /web\.archive\.org\/cdx\/search\/cdx\?/);
  assert.match(cdx, /url=http%3A%2F%2Fexample\.org%2Flost%2F/);
  assert.match(cdx, /from=2010/);
  assert.match(cdx, /collapse=digest/);
  const timemap = seed.discovery.find((d) => d.kind === "memento-timemap").url;
  assert.match(timemap, /20120109170000\/http:\/\/example\.org\/lost\//);
  assert.match(plan.packaging.format, /BagIt 1\.0 \(RFC 8493\)/);
  assert.ok(plan.knownLimits.some((l) => /robots-blocked/.test(l)));
});

test("scope rule keeps the crawl at and beneath the seed", () => {
  const seed = "http://example.org/lost/";
  assert.equal(inScope(seed, "http://example.org/lost/"), true);
  assert.equal(inScope(seed, "http://example.org/lost/page.html"), true);
  assert.equal(inScope(seed, "http://example.org/lost/deep/img.png"), true);
  assert.equal(inScope(seed, "http://example.org/other/"), false);
  assert.equal(inScope(seed, "http://example.org/lostevil/"), false);
  assert.equal(inScope(seed, "https://example.org/lost/page.html"), false);
  assert.equal(inScope(seed, "http://cdn.example.org/lost/page.html"), false);
});

test("unrecoverable or unsafe seeds are refused with reasons", () => {
  assert.throws(() => buildRecoveryPlan(["http://something.onion/"]), /\.onion.*impossible by design/);
  assert.throws(() => buildRecoveryPlan(["https://user:pass@example.org/"]), /credentials/);
  assert.throws(() => buildRecoveryPlan(["ftp://example.org/"]), /http\(s\)/);
  assert.throws(() => buildRecoveryPlan([]), /at least one seed/);
});

test("CDX helper and recovery-log line match the documented formats", () => {
  assert.equal(
    waybackCdxUrl("http://example.org/", {}),
    "https://web.archive.org/cdx/search/cdx?url=http%3A%2F%2Fexample.org%2F&output=json&filter=statuscode%3A200&collapse=digest",
  );
  assert.equal(
    recoveryLogLine("http://example.org/a", "https://web.archive.org/web/2012/http://example.org/a", "recovered/a.html"),
    "http://example.org/a => https://web.archive.org/web/2012/http://example.org/a => recovered/a.html",
  );
});
