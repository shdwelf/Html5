#!/usr/bin/env node
/** Account for every HTML source without treating the mixed apps/ archive as a public allowlist. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, NETWORK_APP_SOURCES } from "./build-html5-offline-launcher-assets.mjs";
import { SOUND_SNAPSHOTS } from "./build-sound-apps.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVATE_MARKERS = /(?:dna|genetic|family|greeran|seize[-_ ]?quartiers|gedcom|ahnentafel|resume|portfolio|lisa[-_])/i;
const WALLET_MARKERS = /(?:wallet|bip[-_ ]?39|haiku|banano|ens[-_ ]?gen|ens[oō].*(?:vault|forge))/i;
const REMOTE_RESOURCE = /<(?:script|link|img|iframe|source|audio|video|object)\b[^>]*\b(?:src|href|data)\s*=\s*["'](?:https?:)?\/\/|@import\s+url\(\s*["']?https?:/i;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function auditAppSources() {
  const tracked = execFileSync("git", ["ls-files", "-z", "--", "apps"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
  const publicCatalog = buildCatalog("public"), networkCatalog = buildCatalog("network");
  const publicSlugs = new Set(publicCatalog.map((app) => app.slug));
  const reviewed = new Map(SOUND_SNAPSHOTS.map((snapshot) => [snapshot.source, { slug: snapshot.slug, file: snapshot.output }]));
  reviewed.set("apps/anc-studio-ultra-html5-active-noise-control-lab", { slug: "anc-studio", file: "index.html", note: "Maintained offline mirror; local Tailwind build." });
  reviewed.set("apps/cyberchef.html", { slug: "cyberchef", file: "index.html", note: "Legacy redirect; maintained bundled app is used." });
  const network = new Map(NETWORK_APP_SOURCES.map((app) => [app.sourcePath, app.slug]));
  const entries = [];
  for (const source of tracked) {
    const parts = source.split("/");
    // Top-level imported documents and canonical directory entrypoints only,
    // not Android fixtures, JS module strings or every HTML help subresource.
    if (!(parts.length === 2 || (parts.length === 3 && parts[2] === "index.html"))) continue;
    const bytes = readFileSync(join(ROOT, source));
    const html = bytes.toString("utf8");
    if (!/(?:<!doctype\s+html|<html)\b/i.test(html.slice(0, 4096)) && !source.endsWith(".html")) continue;
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    let disposition = "review-required", reason = "Preserved source; privacy, completeness and runtime dependencies are not approved for public packaging.";
    let packaged;
    if (reviewed.has(source)) {
      packaged = reviewed.get(source); disposition = "bundled-reviewed-snapshot"; reason = packaged.note ?? "Complete snapshot preserved; deterministic sanitized public copy included.";
    } else if (network.has(join(ROOT, source))) {
      packaged = { slug: network.get(join(ROOT, source)), file: "index.html" }; disposition = "network-only"; reason = "Explicit opt-in network source; not copied into offline profiles.";
    } else if (parts.length === 3 && publicSlugs.has(parts[1])) {
      packaged = { slug: parts[1], file: "index.html" }; disposition = "bundled-maintained-app"; reason = "Canonical source has a maintained public build; do not copy the raw source tree twice.";
    } else if (PRIVATE_MARKERS.test(source + " " + title)) {
      disposition = "private-review-required"; reason = "Personal/family/genetic/portfolio source: preserve; require exact-recipient encryption for a private backup, never auto-publish.";
    } else if (/<script\b[^>]*src\s*=\s*["']\/(?:src\/|@vite\/)/i.test(html) || (bytes.length < 4096 && /<div\b[^>]*id=["']root["']/i.test(html) && !/<script\b[^>]*>[^<]{500}/i.test(html))) {
      disposition = "unbuilt-placeholder"; reason = "Source-entry shell without its built JS payload; not a working offline app.";
    } else if (WALLET_MARKERS.test(source + " " + title)) {
      disposition = "security-review-required"; reason = "Wallet/mnemonic material: preserve; no automatic runtime/security approval or publication.";
    } else if (REMOTE_RESOURCE.test(html)) {
      disposition = "dependency-review-required"; reason = "Remote resources need review/localization before offline packaging; not enabled by adding INTERNET.";
    }
    if (packaged && !existsSync(join(ROOT, "public/apps", packaged.slug, packaged.file)) && disposition !== "network-only") throw new Error(`Missing reviewed bundled target for ${source}`);
    entries.push({ source, bytes: bytes.length, sha256: hash(bytes), disposition, ...(packaged ? { packaged } : {}), reason });
  }
  entries.sort((a, b) => a.source.localeCompare(b.source, "en"));
  const counts = {};
  for (const entry of entries) counts[entry.disposition] = (counts[entry.disposition] ?? 0) + 1;
  return {
    schema: 1,
    scope: "Tracked apps/ top-level HTML documents (including extensionless imports) and canonical directory index.html files; public catalog is audited independently.",
    policy: "Unapproved means preserved for review, NOT deleted and NOT approved for public packaging. Filename classifications are triage, not a content/privacy certification. Full inventory stays in an ignored local directory.",
    publicApps: publicCatalog.length, networkApps: networkCatalog.length, privateAndroidApps: buildCatalog("private").length,
    sources: entries.length, counts, inventorySha256: hash(JSON.stringify(entries)), entries,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditAppSources();
  const index = process.argv.indexOf("--out");
  if (index !== -1) {
    const output = resolve(process.argv[index + 1] || "");
    const allowed = [join(ROOT, ".cache") + sep, join(ROOT, "google_drive") + sep];
    if (!allowed.some((prefix) => output.startsWith(prefix))) throw new Error("The complete mixed/private source inventory must stay in an ignored local directory.");
    mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
    writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  }
  console.log(JSON.stringify({ sources: report.sources, counts: report.counts, publicApps: report.publicApps, networkApps: report.networkApps, privateAndroidApps: report.privateAndroidApps, inventorySha256: report.inventorySha256 }, null, 2));
}
