#!/usr/bin/env node
/** Compile the original offline planner and package a timestamp-stable executable JAR.
 * Default: JDK javac --release 8. --legacy-ecj is an explicit local source/behavior
 * test fallback, not the canonical distribution build. CI always uses the JDK.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = [
  'apps/riseup-invizible-gateway/app/src/main/java/org/arena/gateway/GatewayConfig.java',
  'tools/gateway-config/GatewayMain.java',
];
const args = process.argv.slice(2), legacy = args.includes('--legacy-ecj');
const index = args.indexOf('--out'), output = resolve(ROOT, index >= 0 ? args[index + 1] : 'research/gateway-config/gateway-config.jar');
const temp = mkdtempSync(join(tmpdir(), 'gateway-java-'));
try {
  const classes = join(temp, 'classes'); mkdirSync(classes);
  if (legacy) execFileSync('bash', ['tools/java-compiler/javac.sh', '-d', classes, ...sources], { cwd: ROOT, stdio: 'inherit' });
  else execFileSync(process.env.JAVAC || 'javac', ['--release', '8', '-encoding', 'UTF-8', '-d', classes, ...sources], { cwd: ROOT, stdio: 'inherit' });
  const files = {};
  const add = (name, data) => { files[name] = [new Uint8Array(data), { mtime: new Date('1980-01-01T00:00:00Z'), level: 9 }]; };
  const visit = (dir, prefix = '') => { for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.isDirectory()) visit(join(dir, entry.name), `${prefix}${entry.name}/`);
    else add(prefix + entry.name, readFileSync(join(dir, entry.name)));
  } };
  add('META-INF/MANIFEST.MF', Buffer.from('Manifest-Version: 1.0\r\nMain-Class: GatewayMain\r\nImplementation-Version: 0.2.0-plan-only\r\n\r\n'));
  add('META-INF/gateway-build.json', Buffer.from(JSON.stringify({ schema: 2, protectionActive: false, compiler: legacy ? 'ECJ Java 7 local-test fallback' : 'JDK javac --release 8', sources: Object.fromEntries(sources.map((name) => [name, createHash('sha256').update(readFileSync(join(ROOT, name))).digest('hex')])) }, null, 2) + '\n'));
  visit(classes); mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, zipSync(files));
  console.log(`Built ${output} — PLAN ONLY${legacy ? ' (local ECJ test build; replace with JDK CI artifact for distribution)' : ''}.`);
} finally { rmSync(temp, { recursive: true, force: true }); }
