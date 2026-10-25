#!/usr/bin/env node
/**
 * Convert this repository's webxdc apps (.xdc) into Tomcat-deployable WARs.
 *
 *   node tools/build_xdc_wars.mjs                 # all repo-root *.xdc
 *   node tools/build_xdc_wars.mjs yubnub.xdc      # selected apps
 *   node tools/build_xdc_wars.mjs --out dist/wars # output directory
 *
 * A .xdc is a ZIP with index.html at its root; a WAR is a ZIP with the web
 * app at its root plus WEB-INF/web.xml. The conversion is therefore a
 * faithful repackage: every original entry is copied byte-for-byte, and we
 * add only deployment metadata —
 *
 *   WEB-INF/web.xml          static-content descriptor (Tomcat 9 and 10;
 *                            no servlets, no Struts/JSF runtime: webxdc
 *                            apps are client-side; a framework would add
 *                            attack surface, not function — see
 *                            docs/apache-struts-jsf-tomcat-xdc-war-2026-10-23.md)
 *   WEB-INF/xdc-origin.json  provenance: source .xdc name + SHA-256
 *   META-INF/MANIFEST.MF     implementation stamps
 *
 * Output is deterministic (fixed ZIP timestamps), so a WAR's SHA-256 is a
 * stable identity for the exact .xdc it was built from. With --viewer
 * (default when xdc-viewer.html exists at the repo root) an extra
 * xdc-viewer.war packages the catalogue viewer, which links to each app
 * WAR deployed beside it (/<app-name>/…).
 *
 * Nothing here needs a JVM; Tomcat is only needed to *run* the WARs.
 */

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { unzipSync, zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXED_MTIME = new Date("2026-01-01T00:00:00Z");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function webXml(appName, welcomeFile = "index.html") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Static webxdc deployment for Apache Tomcat (9 or 10).
  No servlet classes are declared: Tomcat's default servlet serves the
  app files, and ${welcomeFile} is the welcome file. Deliberately free of
  Struts / JSF configuration — see
  docs/apache-struts-jsf-tomcat-xdc-war-2026-10-23.md for why.
-->
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0" metadata-complete="true">
  <display-name>${appName} (webxdc)</display-name>
  <welcome-file-list>
    <welcome-file>${welcomeFile}</welcome-file>
  </welcome-file-list>
  <mime-mapping>
    <extension>xdc</extension>
    <mime-type>application/zip</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>toml</extension>
    <mime-type>text/plain</mime-type>
  </mime-mapping>
</web-app>
`;
}

function manifest(appName, sourceSha) {
  return [
    "Manifest-Version: 1.0",
    `Implementation-Title: ${appName} (webxdc on Tomcat)`,
    "Implementation-Vendor: shdwelf/Html5",
    `X-Webxdc-Source-Sha256: ${sourceSha}`,
    "",
  ].join("\r\n");
}

/** Parse the few manifest.toml fields a WAR catalogue needs (no TOML dep). */
function parseManifestToml(text) {
  const out = {};
  if (!text) return out;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(name|description|version|source_code_url)\s*=\s*"([^"]*)"/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function warBytesFor(appName, xdcBytes) {
  let entries;
  try {
    entries = unzipSync(new Uint8Array(xdcBytes));
  } catch {
    throw new Error(`${appName}: not a ZIP archive (a .xdc must be a ZIP; this file cannot be repackaged or loaded by a webxdc client)`);
  }
  // webxdc wants index.html at the root; one repo app (lattice-viewer)
  // ships a single named HTML entry instead, so fall back to a sole
  // root-level .html as the welcome file rather than dropping the app.
  let welcomeFile = "index.html";
  if (!entries[welcomeFile]) {
    const rootHtml = Object.keys(entries).filter((n) => !n.includes("/") && n.endsWith(".html"));
    if (rootHtml.length !== 1) {
      throw new Error(`${appName}: not a webxdc app (no index.html at archive root)`);
    }
    [welcomeFile] = rootHtml;
  }
  const sourceSha = sha256(xdcBytes);
  const files = {};
  for (const [name, bytes] of Object.entries(entries)) {
    files[name] = [bytes, { mtime: FIXED_MTIME }];
  }
  files["WEB-INF/web.xml"] = [new TextEncoder().encode(webXml(appName, welcomeFile)), { mtime: FIXED_MTIME }];
  files["WEB-INF/xdc-origin.json"] = [
    new TextEncoder().encode(`${JSON.stringify({
      app: appName,
      builtFrom: `${appName}.xdc`,
      sourceSha256: sourceSha,
      welcomeFile,
      container: "Apache Tomcat 9/10 (static web app, Servlet 4.0 descriptor)",
      builder: "tools/build_xdc_wars.mjs",
    }, null, 2)}\n`),
    { mtime: FIXED_MTIME },
  ];
  files["META-INF/MANIFEST.MF"] = [new TextEncoder().encode(manifest(appName, sourceSha)), { mtime: FIXED_MTIME }];
  const war = zipSync(files, { level: 6 });
  const manifestInfo = parseManifestToml(
    entries["manifest.toml"] ? new TextDecoder().decode(entries["manifest.toml"]) : "",
  );
  return { war, sourceSha, manifestInfo, entryCount: Object.keys(entries).length, welcomeFile };
}

export function viewerWarBytes(viewerHtml, catalogue) {
  const files = {
    "index.html": [new TextEncoder().encode(viewerHtml), { mtime: FIXED_MTIME }],
    "catalogue.json": [new TextEncoder().encode(`${JSON.stringify(catalogue, null, 2)}\n`), { mtime: FIXED_MTIME }],
    "vendor/fflate/index.mjs": null, // filled by caller (needs the vendored lib bytes)
    "WEB-INF/web.xml": [new TextEncoder().encode(webXml("xdc-viewer")), { mtime: FIXED_MTIME }],
    "META-INF/MANIFEST.MF": [new TextEncoder().encode(manifest("xdc-viewer", sha256(viewerHtml))), { mtime: FIXED_MTIME }],
  };
  return files;
}

async function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf("--out");
  const outDir = path.resolve(root, outIdx >= 0 ? argv[outIdx + 1] : "dist/wars");
  const noViewer = argv.includes("--no-viewer");
  const named = argv.filter((a, i) => !a.startsWith("--") && !(outIdx >= 0 && i === outIdx + 1));

  let xdcFiles = named;
  if (!xdcFiles.length) {
    xdcFiles = (await readdir(root)).filter((f) => f.endsWith(".xdc")).sort();
  }
  if (!xdcFiles.length) throw new Error("no .xdc files selected");

  await mkdir(outDir, { recursive: true });
  const catalogue = [];
  const skipped = [];
  for (const file of xdcFiles) {
    const appName = path.basename(file, ".xdc");
    const xdcBytes = await readFile(path.resolve(root, file));
    let built;
    try {
      built = warBytesFor(appName, xdcBytes);
    } catch (err) {
      // A targeted build fails closed; a batch build reports and continues.
      if (named.length) throw err;
      skipped.push({ app: appName, sourceXdc: file, reason: err.message });
      console.log(`SKIPPED ${file}: ${err.message}`);
      continue;
    }
    const { war, sourceSha, manifestInfo, entryCount, welcomeFile } = built;
    const warName = `${appName}.war`;
    await writeFile(path.join(outDir, warName), war);
    catalogue.push({
      app: appName,
      war: warName,
      contextPath: `/${appName}/`,
      displayName: manifestInfo.name || appName,
      description: manifestInfo.description || "",
      sourceXdc: file,
      sourceSha256: sourceSha,
      warSha256: sha256(war),
      warBytes: war.length,
      entries: entryCount,
      welcomeFile,
    });
    console.log(`${warName}: ${entryCount} app entries, ${war.length} bytes, sha256 ${sha256(war).slice(0, 16)}…`);
  }

  if (!noViewer) {
    const viewerPath = path.join(root, "xdc-viewer.html");
    const viewerHtml = await readFile(viewerPath, "utf8").catch(() => null);
    if (viewerHtml) {
      const fflate = await readFile(path.join(root, "vendor/fflate/index.mjs"));
      const files = viewerWarBytes(viewerHtml, {
        generated: "tools/build_xdc_wars.mjs",
        note: "Deploy each app WAR beside xdc-viewer.war on the same Tomcat; the viewer links to /<app>/ contexts and can also open any .xdc file locally.",
        apps: catalogue,
        skipped,
      });
      files["vendor/fflate/index.mjs"] = [new Uint8Array(fflate), { mtime: FIXED_MTIME }];
      const war = zipSync(files, { level: 6 });
      await writeFile(path.join(outDir, "xdc-viewer.war"), war);
      console.log(`xdc-viewer.war: catalogue of ${catalogue.length} apps, ${war.length} bytes, sha256 ${sha256(war).slice(0, 16)}…`);
    }
  }

  await writeFile(
    path.join(outDir, "catalogue.json"),
    `${JSON.stringify({ generated: "tools/build_xdc_wars.mjs", apps: catalogue, skipped }, null, 2)}\n`,
  );
  console.log(`catalogue.json: ${catalogue.length} apps, ${skipped.length} skipped -> ${path.relative(root, outDir)}/`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
