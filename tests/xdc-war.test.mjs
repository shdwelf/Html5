import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "dist", "_xdc-war-test");
const BUILDER = path.join(root, "tools", "build_xdc_wars.mjs");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

function build(args) {
  return execFileSync(process.execPath, [BUILDER, "--out", OUT, ...args], { cwd: root, encoding: "utf8" });
}

test("xdc -> WAR conversion repackages faithfully and deterministically", () => {
  rmSync(OUT, { recursive: true, force: true });
  const log = build(["yubnub.xdc", "haiku.xdc"]);
  assert.match(log, /yubnub\.war:/);
  assert.match(log, /xdc-viewer\.war:/);

  const xdc = readFileSync(path.join(root, "yubnub.xdc"));
  const war = readFileSync(path.join(OUT, "yubnub.war"));
  const appEntries = unzipSync(new Uint8Array(xdc));
  const warEntries = unzipSync(new Uint8Array(war));

  // Every original app entry survives byte-for-byte at the same path.
  for (const [name, bytes] of Object.entries(appEntries)) {
    assert.deepEqual(Buffer.from(warEntries[name] ?? []), Buffer.from(bytes), `WAR entry differs from .xdc: ${name}`);
  }
  // Deployment metadata is added, and only metadata.
  const added = Object.keys(warEntries).filter((name) => !(name in appEntries)).sort();
  assert.deepEqual(added, ["META-INF/MANIFEST.MF", "WEB-INF/web.xml", "WEB-INF/xdc-origin.json"]);

  const webXml = new TextDecoder().decode(warEntries["WEB-INF/web.xml"]);
  assert.match(webXml, /<welcome-file>index\.html<\/welcome-file>/);
  assert.doesNotMatch(webXml, /<servlet>|<servlet-mapping>|<filter>|servlet-class|faces-config|struts2/i,
    "static WARs must declare no servlet/filter machinery (no Struts/JSF runtime)");

  const origin = JSON.parse(new TextDecoder().decode(warEntries["WEB-INF/xdc-origin.json"]));
  assert.equal(origin.sourceSha256, sha256(xdc));
  assert.equal(origin.app, "yubnub");

  const catalogue = JSON.parse(readFileSync(path.join(OUT, "catalogue.json"), "utf8"));
  assert.equal(catalogue.apps.length, 2);
  const yub = catalogue.apps.find((a) => a.app === "yubnub");
  assert.equal(yub.warSha256, sha256(war));
  assert.equal(yub.contextPath, "/yubnub/");

  // Deterministic: rebuilding the same set yields identical WAR bytes.
  const again = build(["yubnub.xdc", "haiku.xdc"]);
  assert.match(again, /yubnub\.war:/);
  assert.equal(sha256(readFileSync(path.join(OUT, "yubnub.war"))), sha256(war));

  // The viewer WAR carries the catalogue and the vendored zip lib it imports.
  const viewer = unzipSync(new Uint8Array(readFileSync(path.join(OUT, "xdc-viewer.war"))));
  assert.ok(viewer["index.html"], "viewer WAR root is the viewer page");
  assert.ok(viewer["vendor/fflate/index.mjs"], "viewer WAR must bundle the fflate module it imports");
  const cat = JSON.parse(new TextDecoder().decode(viewer["catalogue.json"]));
  assert.equal(cat.apps.length, 2);

  rmSync(OUT, { recursive: true, force: true });
});

test("the builder fails closed on a non-webxdc zip", () => {
  rmSync(OUT, { recursive: true, force: true });
  // dist/changelly-drainer-xena.zip is a BagIt bag, not a webxdc app.
  const notApp = path.join(root, "dist", "changelly-drainer-xena.zip");
  if (!existsSync(notApp)) return; // bag not built in this checkout; nothing to probe with
  assert.throws(
    () => execFileSync(process.execPath, [BUILDER, "--out", OUT, "--no-viewer", notApp], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    /no index\.html at archive root|not a webxdc/,
  );
  rmSync(OUT, { recursive: true, force: true });
});

test("the viewer page is wired for catalogue + local play, with no uploads", () => {
  const html = readFileSync(path.join(root, "xdc-viewer.html"), "utf8");
  assert.match(html, /vendor\/fflate\/index\.mjs/);
  assert.match(html, /catalogue\.json/);
  assert.match(html, /window\.webxdc = \{/);
  assert.match(html, /sandbox="allow-scripts/);
  assert.match(html, /ArcaneChat/);
});
