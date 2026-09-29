#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const manifestPath = process.env.FLASH_TARGETS || path.join(root, "data", "flash-decompiler-targets.json");
const outDir = process.env.FLASH_WORKDIR || path.join(root, "flash-work");
const includeNsfw = /^(1|true|yes)$/i.test(process.env.INCLUDE_NSFW || "");
const onlyIds = new Set((process.env.ONLY_IDS || "").split(/[\s,]+/).filter(Boolean));
const ffdecImage = process.env.FFDEC_IMAGE || "ffdec-local";
const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || "");

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed with ${r.status}`);
}

function safeName(s) {
  return s.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 96);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const swfTargets = manifest.filter((t) => {
  if (!t.url || !/\.swf(?:$|[?#])/i.test(t.url)) return false;
  if (t.nsfw && !includeNsfw) return false;
  if (onlyIds.size && !onlyIds.has(t.id)) return false;
  return true;
});

await fs.mkdir(path.join(outDir, "input"), { recursive: true });
await fs.mkdir(path.join(outDir, "output"), { recursive: true });
await fs.writeFile(path.join(outDir, "selected-targets.json"), JSON.stringify(swfTargets, null, 2));

const summary = [];
for (const target of swfTargets) {
  const base = safeName(target.id || target.label || "target");
  const swfPath = path.join(outDir, "input", `${base}.swf`);
  summary.push(`# ${target.id}\n${target.label}\n${target.url}\nnsfw=${Boolean(target.nsfw)}\n`);
  if (dryRun) continue;
  sh("curl", ["-L", "--fail", "--retry", "3", "--connect-timeout", "30", "--max-time", "600", "-o", swfPath, target.url]);
  const out = path.join(outDir, "output", base);
  await fs.mkdir(out, { recursive: true });
  // FFDec CLI entrypoint comes from the upstream Dockerfile. Export text + scripts only,
  // not images/sounds, so the artifact stays focused on code/easter-egg search.
  sh("docker", [
    "run", "--rm",
    "-v", `${path.resolve(outDir)}:/work`,
    ffdecImage,
    "-onerror", "ignore",
    "-config", "autoDeobfuscate=1,parallelSpeedUp=0",
    "-format", "script:pcode,text:plain",
    "-export", "script,text",
    `/work/output/${base}`,
    `/work/input/${base}.swf`
  ]);
}

await fs.writeFile(path.join(outDir, "README.txt"), [
  "Flash decompiler run",
  `include_nsfw=${includeNsfw}`,
  `only_ids=${[...onlyIds].join(",") || "(none)"}`,
  `targets=${swfTargets.length}`,
  "",
  ...summary
].join("\n"));

console.log(`Selected ${swfTargets.length} SWF target(s). Output: ${outDir}`);
