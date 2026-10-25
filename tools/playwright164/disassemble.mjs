#!/usr/bin/env node
/**
 * Disassembler for the playwright-core npm package (pinned target: 1.64.1).
 *
 * Playwright ships to npm as esbuild bundles whose module banners
 * (`// packages/...` / `// node_modules/...`) survive in the output, so the
 * bundle can be taken apart module-by-module without a source checkout:
 * every banner opens a module, the next banner closes it. This tool turns an
 * extracted package directory into a deterministic JSON module map:
 * package identity, entry chain, pinned browsers, per-bundle module lists
 * with line counts, area roll-ups, CDP protocol domains, and SHA-256 of the
 * load-bearing files. It never modifies the package.
 *
 *   npm pack playwright-core@1.64.1 && tar xzf playwright-core-1.64.1.tgz
 *   node tools/playwright164/disassemble.mjs <extracted>/package [out.json]
 *
 * The committed register for 1.64.1 is docs/playwright164-evidence/module-map-1.64.1.json
 * (regenerate with the command above; the package itself is not committed).
 */
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const BANNER = /^\/\/ ((?:packages|node_modules)\/\S+)$/;

/** Split an esbuild bundle into its banner-delimited modules. */
export function parseBundleModules(text) {
  const lines = text.split('\n');
  const mods = [];
  lines.forEach((line, i) => {
    const m = line.match(BANNER);
    if (m) mods.push({path: m[1], startLine: i + 1});
  });
  mods.forEach((mod, j) => {
    mod.lines = (j + 1 < mods.length ? mods[j + 1].startLine : lines.length + 1) - mod.startLine;
  });
  return {totalLines: lines.length, modules: mods};
}

function rollup(modules, keyFn) {
  const out = {};
  for (const mod of modules) {
    const k = keyFn(mod.path);
    if (!k) continue;
    out[k] ??= {modules: 0, lines: 0};
    out[k].modules++;
    out[k].lines += mod.lines;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1].lines - a[1].lines || a[0].localeCompare(b[0])));
}

/** CDP domains declared in types/protocol.d.ts (`export namespace Protocol { export namespace X {`). */
export function parseProtocolDomains(text) {
  const domains = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(/^ {2}export namespace ([A-Za-z]+) \{$/);
    if (m) domains.add(m[1]);
  }
  return [...domains].sort();
}

function bundleReport(pkgDir, rel) {
  const text = readFileSync(path.join(pkgDir, rel), 'utf8');
  const {totalLines, modules} = parseBundleModules(text);
  return {
    file: rel,
    bytes: Buffer.byteLength(text),
    totalLines,
    moduleCount: modules.length,
    areas: rollup(modules, (p) => p.split('/').slice(0, 2).join('/')),
    playwrightSrcAreas: rollup(modules, (p) =>
      p.startsWith('packages/playwright-core/src/') ? p.split('/')[3] : null),
    largest: modules.slice().sort((a, b) => b.lines - a.lines).slice(0, 15)
      .map(({path: p, lines}) => ({path: p, lines})),
    modules,
  };
}

export function disassemblePackage(pkgDir) {
  const read = (rel) => readFileSync(path.join(pkgDir, rel));
  const readJson = (rel) => JSON.parse(read(rel).toString('utf8'));
  const pkg = readJson('package.json');
  const files = {};
  for (const rel of ['index.js', 'index.mjs', 'cli.js', 'lib/bootstrap.js', 'lib/coreBundle.js',
                     'lib/utilsBundle.js', 'lib/serverRegistry.js', 'types/protocol.d.ts', 'types/types.d.ts']) {
    const p = path.join(pkgDir, rel);
    if (existsSync(p)) {
      const buf = read(rel);
      files[rel] = {bytes: buf.length, sha256: sha256(buf)};
    }
  }
  return {
    tool: 'tools/playwright164/disassemble.mjs',
    package: {
      name: pkg.name, version: pkg.version, license: pkg.license,
      engines: pkg.engines, repository: pkg.repository?.url,
      exports: pkg.exports, bin: pkg.bin, types: pkg.types,
    },
    entryChain: [
      'index.js -> require(./lib/bootstrap) [Node >= 20 gate, optional PW_PROFILE_DIR profiling]',
      'index.js -> module.exports = require(./lib/coreBundle).inprocess.playwright',
      'index.mjs -> ESM re-export of the same in-process driver',
    ],
    browsers: readJson('browsers.json').browsers,
    files,
    coreBundle: bundleReport(pkgDir, 'lib/coreBundle.js'),
    utilsBundle: bundleReport(pkgDir, 'lib/utilsBundle.js'),
    protocol: {
      file: 'types/protocol.d.ts',
      generatedFrom: 'utils/protocol-types-generator (header comment in the file)',
      domains: parseProtocolDomains(read('types/protocol.d.ts').toString('utf8')),
    },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [pkgDir, out] = process.argv.slice(2);
  if (!pkgDir) {
    console.error('usage: node tools/playwright164/disassemble.mjs <extracted package dir> [out.json]');
    process.exit(2);
  }
  const report = disassemblePackage(pkgDir);
  const json = JSON.stringify(report, null, 1) + '\n';
  if (out) {
    mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
    writeFileSync(out, json);
    console.log(`wrote ${out} (${json.length} bytes)`);
  } else process.stdout.write(json);
  console.error(`${report.package.name}@${report.package.version}: coreBundle ${report.coreBundle.moduleCount} modules/${report.coreBundle.totalLines} lines, utilsBundle ${report.utilsBundle.moduleCount} modules/${report.utilsBundle.totalLines} lines, ${report.protocol.domains.length} CDP domains`);
}
