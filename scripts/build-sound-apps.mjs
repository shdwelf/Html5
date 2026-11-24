#!/usr/bin/env node
/** Deterministically restore the complete, reviewed sound snapshots; originals stay untouched. */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SOUND_SNAPSHOTS = Object.freeze([
  { source: "apps/noise-canceling-sanctuary (1) (1).html", sha256: "70d89f65244ccf981375929bc950ddc6b8fe197a0c9de7c88f82db979d3c618e", slug: "sound-sanctuary", output: "index.html", title: "Sound Sanctuary — Noise Canceling Sanctuary" },
  { source: "apps/AURA_SoundStudio_Quine_1783095741599.html", sha256: "0a99f6c1cad66da3901f73e82f8a2399aed8315db964e3bcfbec4fa193bf0fd6", slug: "aura-sound-studio", output: "index.html", title: "AURA Sound Studio — Experimental Audio Lab" },
  { source: "apps/AURA_SoundStudio_Quine_Self_1783095663453.html", sha256: "cb9bac38bdae5048e5da9ff6d1fd957d2bd8698eb0240fb7507bd3ca2b9f6a11", slug: "aura-sound-studio", output: "saved-settings.html", title: "AURA Sound Studio — Alternate Saved-Settings Snapshot" },
]);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const banner = (snapshot) => `\n<aside id="sound-snapshot-safety" role="note" style="position:relative;z-index:100;background:#172337;color:#f1f5f9;padding:10px 16px;font:13px/1.5 system-ui,sans-serif">Experimental browser audio lab, not certified THX/Dolby/Bose/IMAX processing or hearing protection. Start at low volume; microphone/speaker feedback can be loud. Prefer headphones and stop if feedback occurs. ${snapshot.slug === "aura-sound-studio" ? '<a style="color:#67e8f9" href="./index.html">Main snapshot</a> · <a style="color:#67e8f9" href="./saved-settings.html">Alternate saved-settings snapshot</a> · ' : ""}<a style="color:#67e8f9" href="./README.md">Offline notes &amp; backup limitations</a></aside>\n`;

export function restoreSoundSnapshot(snapshot) {
  const bytes = readFileSync(join(ROOT, snapshot.source));
  if (hash(bytes) !== snapshot.sha256) throw new Error(`Sound source changed; review before updating provenance: ${snapshot.source}`);
  let html = bytes.toString("utf8");
  html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "");
  html = html.replace(/<script\b[^>]*src=["']https:\/\/static\.cloudflareinsights\.com\/[^>]*>\s*<\/script>\s*/gi, "");
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${snapshot.title}</title>`);
  html = html.replace(/(<body\b[^>]*>)/i, `$1${banner(snapshot)}`);
  if (/<(?:script|link|img|iframe|source|audio|video|object)\b[^>]*\b(?:src|href|data)\s*=\s*["'](?:https?:)?\/\//i.test(html) || /@import\s.*https?:|fonts\.googleapis\.com|cloudflareinsights\.com/i.test(html)) {
    throw new Error(`Unreviewed external resource survived sound snapshot restore: ${snapshot.source}`);
  }
  return html;
}

export function buildSoundApps({ check = false } = {}) {
  const outputs = new Map();
  for (const snapshot of SOUND_SNAPSHOTS) {
    const html = restoreSoundSnapshot(snapshot);
    outputs.set(`public/apps/${snapshot.slug}/${snapshot.output}`, html);
  }
  const receipt = SOUND_SNAPSHOTS.map((snapshot) => ({ ...snapshot, output: `public/apps/${snapshot.slug}/${snapshot.output}`, outputSha256: hash(outputs.get(`public/apps/${snapshot.slug}/${snapshot.output}`)) }));
  for (const slug of ["sound-sanctuary", "aura-sound-studio"]) {
    const name = slug === "sound-sanctuary" ? "Sound Sanctuary" : "AURA Sound Studio";
    outputs.set(`public/apps/${slug}/manifest.toml`, `name = "${name}"\ndescription = "Self-contained experimental audio lab. Local presets/HTML exports; microphone opt-in. Not certified ANC or hearing protection."\n`);
    outputs.set(`public/apps/${slug}/provenance.json`, JSON.stringify({ version: 1, transforms: ["remove Google Fonts connections/styles", "remove Cloudflare analytics beacon", "add accurate title, safety and snapshot links"], snapshots: receipt.filter((entry) => entry.slug === slug) }, null, 2) + "\n");
    outputs.set(`public/apps/${slug}/README.md`, `# ${name}\n\nRestored from complete self-contained snapshots already present in this repository. Original source files are preserved byte-for-byte; see provenance.json for exact input/output SHA-256. The extensionless AURA /src/main.tsx placeholder is NOT the app.\n\n- Inline React, DSP, styles and assets; no remote fonts, analytics, runtime CDN or app-level uploads.\n- Browser audio experiments, NOT certified THX, Dolby, Bose or IMAX technology, reliable acoustic active noise cancellation, or hearing protection. Start at low volume; headphones recommended. Stop on feedback.\n- Playback and microphone access require your interaction. Android grants audio only to the current matching allowlisted packaged audio origin, never cameras or arbitrary network pages.\n- Use the app's explicit preset/HTML export controls. Android uses the system Files picker for Blob exports up to 64 MiB and reports success only after read-back verification. A browser download request is not proof of a saved file. Choose an on-device destination to avoid a cloud provider.\n- Runtime state is not automatically backed up. Uninstall, clearing app data, closing/navigating away and an OS process kill can lose unsaved changes. Keep an independent exported copy of your research/settings. Audio file import is user-selected, not a bundled recording.\n${slug === "aura-sound-studio" ? "- index.html is the later full snapshot; saved-settings.html preserves the alternate full snapshot and its embedded DSP settings on the same isolated origin. Both remain independently usable.\n" : ""}`);
  }
  for (const [relativePath, content] of outputs) {
    const path = join(ROOT, relativePath);
    if (check) {
      if (readFileSync(path, "utf8") !== content) throw new Error(`Restored sound app is stale: ${relativePath}`);
    } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); }
  }
  return { apps: 2, snapshots: SOUND_SNAPSHOTS.length, files: outputs.size };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildSoundApps({ check: process.argv.includes("--check") });
  console.log(`Sound app snapshots validated: ${result.apps} apps / ${result.snapshots} full snapshots / ${result.files} files.`);
}
