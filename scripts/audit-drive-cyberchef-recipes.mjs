#!/usr/bin/env node
/**
 * Recheck a LOCAL (gitignored) Drive recipe export against a PINNED upstream
 * CyberChef source tree. No raw Drive export, recipe URLs or authentic inputs
 * are bundled; row names and deliberately synthetic test vectors are public.
 *
 * Node >=24, with CyberChef dependencies/config generated (see the companion
 * docs/cyberchef-drive-recipe-audit-2026-11-13.md). Example:
 *
 * node scripts/audit-drive-cyberchef-recipes.mjs \
 *   --input google_drive/cyberchef_recipes_31_verified.json \
 *   --runtime google_drive/cyberchef-runtime-d4d96c6 --fixtures --json
 *
 * The URI test uses upstream Utils.parseURIParams/parseRecipeConfig, exactly as
 * App.getURIParams/loadURIParams does at the named commit. The schema test uses
 * upstream operation constructors. Synthetic Recipe/Dish tests, when enabled,
 * deliberately BYPASS browser import, browser control defaults, and real inputs.
 */
import { readFile } from "node:fs/promises";
import { createHash, X509Certificate } from "node:crypto";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const EXPECTED_INPUT_SHA256 = "6f6319cf2321767f2ad2e2264095c6e1784b668652793dca9d928e2a591feacd";
const EXPECTED_UPSTREAM_COMMIT = "d4d96c6c3d2597fef836d81bfc04617d97c681a5";
// A checksum of one pinned, non-generated source file, not of the build output.
const EXPECTED_UTILS_SHA256 = "dea80841f43ea45af28e9346f479ca829651841192e480364833ae4b2e1ff028";

function arg(name) {
    const i = process.argv.indexOf(name);
    return i < 0 ? null : process.argv[i + 1];
}
if (process.argv.includes("--help") || !arg("--input") || !arg("--runtime")) {
    console.log("Usage: node scripts/audit-drive-cyberchef-recipes.mjs --input <private JSON> --runtime <pinned CyberChef checkout> [--fixtures] [--json]");
    process.exit(process.argv.includes("--help") ? 0 : 2);
}
const inputPath = path.resolve(arg("--input"));
const runtime = path.resolve(arg("--runtime"));
const sha = data => createHash("sha256").update(data).digest("hex");
const inputBytes = await readFile(inputPath);
const inputSha256 = sha(inputBytes);
if (inputSha256 !== EXPECTED_INPUT_SHA256) {
    throw new Error(`Wrong local input SHA-256: ${inputSha256}; this audit expects the 31-entry copy, not the 21-entry copy.`);
}
const rows = JSON.parse(inputBytes);
assert.equal(rows.length, 31);
const file = rel => path.join(runtime, rel);
const importFile = async rel => import(pathToFileURL(file(rel)).href);
const utilsSha256 = sha(await readFile(file("src/core/Utils.mjs")));
if (utilsSha256 !== EXPECTED_UTILS_SHA256) {
    throw new Error(`Wrong CyberChef Utils.mjs checksum: ${utilsSha256}; use pinned upstream commit ${EXPECTED_UPSTREAM_COMMIT}.`);
}
const { default: Utils } = await importFile("src/core/Utils.mjs");
const { default: modules } = await importFile("src/core/config/modules/OpModules.mjs");
const operationConfig = JSON.parse(await readFile(file("src/core/config/OperationConfig.json")));
const requireFromRuntime = createRequire(pathToFileURL(file("package.json")));
requireFromRuntime("loglevel").setLevel("silent");
const expected = r => r.ops.map(([op, args]) => ({ op, args }));
const getParams = r => Utils.parseURIParams(new URL(r.url).hash.slice(1));
const auditRows = [];
for (const [i, r] of rows.entries()) {
    const params = getParams(r);
    const result = { number: i + 1, slug: r.slug, uri: {}, schema: { issues: [] } };
    result.uri.lexicallyMatchesPretty = params.recipe === r.pretty;
    result.uri.hasInput = Object.hasOwn(params, "input");
    try {
        const parsed = Utils.parseRecipeConfig(params.recipe);
        result.uri.parsedOps = parsed.map(x => x.op);
        result.uri.status = JSON.stringify(parsed.map(x => ({ op: x.op, args: x.args }))) === JSON.stringify(expected(r))
            ? "exact" : "mismatch";
    } catch (e) {
        result.uri.status = "parse-error";
        result.uri.error = String(e.message).slice(0, 180);
    }
    for (const [opName, values] of r.ops) {
        const cfg = operationConfig[opName];
        if (!cfg) {
            result.schema.issues.push(`${opName}: missing upstream operation`);
            continue;
        }
        try {
            const op = new modules[cfg.module][opName]();
            for (const [j, v] of values.entries()) {
                const ing = op._ingList[j];
                if (!ing) continue;
                if (ing.type === "toggleString" &&
                    (v === null || typeof v !== "object" || typeof v.option !== "string" || typeof v.string !== "string")) {
                    result.schema.issues.push(`${opName} #${j + 1} (${ing.name}): toggleString needs {option,string} for browser import`);
                }
                if (ing.type === "boolean" && typeof v !== "boolean") {
                    result.schema.issues.push(`${opName} #${j + 1} (${ing.name}): expected boolean, got ${typeof v}`);
                }
            }
            op.ingValues = values; // the Node engine does NOT fill omitted args with UI defaults
            op.validateIngredients(op.ingValues);
        } catch (e) {
            result.schema.issues.push(`${opName}: Node ingredient assignment/validation: ${String(e.message).slice(0, 190)}`);
        }
    }
    auditRows.push(result);
}

const report = {
    method: "pinned upstream URI parser + operation schemas; optional synthetic Node Recipe/Dish fixtures (not browser UI)",
    upstreamCommit: EXPECTED_UPSTREAM_COMMIT,
    upstreamUtilsSha256: utilsSha256,
    inputSha256,
    total: rows.length,
    uriCounts: Object.fromEntries(["exact", "parse-error", "mismatch"].map(s => [s, auditRows.filter(r => r.uri.status === s).length])),
    allUriFragmentsMatchPretty: auditRows.every(r => r.uri.lexicallyMatchesPretty),
    urlsWithInput: auditRows.filter(r => r.uri.hasInput).length,
    operationNamesKnown: [...new Set(rows.flatMap(r => r.ops.map(([name]) => name)))].every(name => Object.hasOwn(operationConfig, name)),
    distinctOperationNames: new Set(rows.flatMap(r => r.ops.map(([name]) => name))).size,
    rowsWithSchemaIssues: auditRows.filter(r => r.schema.issues.length).length,
    toggleStringsWithWrongShape: auditRows.flatMap(r => r.schema.issues).filter(s => s.includes("toggleString needs")).length,
    rows: auditRows
};

if (process.argv.includes("--fixtures")) {
    const { default: Recipe } = await importFile("src/core/Recipe.mjs");
    const { default: Dish } = await importFile("src/core/Dish.mjs");
    const byNumber = n => rows[n - 1];
    // This is a synthetic, direct engine call. It intentionally does not repair
    // supplied arguments; only the explicitly named corrected cases below do.
    async function run(config, input) {
        const dish = input instanceof Uint8Array
            ? new Dish(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength), "ArrayBuffer")
            : new Dish(input);
        const recipe = new Recipe(config);
        const progress = await recipe.execute(dish);
        const stopped = progress !== config.length || !recipe.lastRunOp;
        if (!stopped) await recipe.present(dish);
        return { output: await dish.get("string"), stopped, progress };
    }
    const direct = (n, input) => run(expected(byNumber(n)), input);
    const fixtures = [];
    function record(name, layer, observation) {
        fixtures.push({ name, layer, observation });
    }

    for (const [n, cipher] of [[6, "FBKECXDLDLPS"], [20, "IPAIBXNSLNEF"]]) {
        assert.equal(auditRows[n - 1].uri.status, "exact");
        const result = await run(Utils.parseRecipeConfig(getParams(byNumber(n)).recipe), cipher);
        assert.equal(result.stopped, false);
        assert.equal(result.output, "ATTACKATDAWN");
        record(byNumber(n).slug, "literal URL parsed, then Node/Dish with synthetic ciphertext", result.output);
    }
    {
        // An encoded byte 0x0F is ASCII '9' in yEnc (15+42=57).
        // XOR(42) is not subtraction modulo 256 except by coincidence.
        const r = await run([{ op: "XOR", args: byNumber(2).ops.at(-1)[1] }], "9");
        assert.equal(r.stopped, false);
        assert.equal(r.output.charCodeAt(0), 19);
        record("yenc-decode-manual", "isolated supplier XOR operation, NOT supplier chain, Node synthetic byte", "encoded '9' -> 19 with XOR(42); yEnc's subtract-42 requires 15");
    }
    {
        const r = await direct(8, "1 2 3");
        // A1Z26 already outputs letters; feeding them to From Charcode (base 10)
        // cannot be presented as a successful two-stage letter decoder.
        assert.equal(r.stopped, false);
        assert.notEqual(r.output, "abc");
        record("a1z26-then-charcode", "supplier tuple, Node synthetic", `final=${JSON.stringify(r.output)}; first op alone=abc`);
    }
    {
        const b64 = value => Buffer.from(JSON.stringify(value)).toString("base64url");
        const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "synthetic", admin: true })}.invalid-signature`;
        const r = await direct(10, token);
        assert.equal(r.stopped, false);
        assert.match(r.output, /synthetic/);
        record("jwt-inspect", "supplier tuple, Node synthetic INVALID signature", "payload displayed without signature verification");
    }
    {
        const xml = '<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb"><file poster="Test"><segments><segment bytes="5" number="1">one@news.example</segment><segment bytes="5" number="2">two@news.example</segment></segments></file></nzb>';
        const config = [{ op: "XPath expression", args: [byNumber(3).ops[0][1][0], "\\n"] }];
        const r = await run(config, xml);
        assert.equal(r.stopped, false);
        assert.match(r.output, /one@news\.example/);
        assert.match(r.output, /two@news\.example/);
        record("nzb-messageid-harvest", "CORRECTED XPath ingredient only, Node synthetic XML", r.output.replaceAll("\n", " | "));
    }
    {
        // RFC 5322 folding: CRLF plus whitespace. These are deliberately
        // corrected arguments/patterns, not a run of the supplied URL/tuple.
        const r = await run([
            { op: "Find / Replace", args: [{ option: "Regex", string: "\\r\\n[ \\t]+" }, " ", true, false, false, false] },
            { op: "Find / Replace", args: [{ option: "Regex", string: "\\r" }, "", true, false, false, false] }
        ], "Subject: one\r\n two\r\nFrom: synthetic@example.invalid");
        assert.equal(r.stopped, false);
        assert.equal(r.output, "Subject: one two\nFrom: synthetic@example.invalid");
        record("usenet-header-normalise", "CORRECTED ingredient shapes and CRLF pattern, Node synthetic", "folded Subject joined without altering separate From field");
    }
    {
        const xml = '<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb"><file><segments><segment number="1" bytes="5">id@news.example</segment></segments></file></nzb>';
        const r = await direct(16, gzipSync(Buffer.from(xml)));
        assert.equal(r.stopped, false);
        assert.match(r.output, /id@news\.example/);
        record("gzip-nzb", "supplier tuple, Node synthetic gzip", "gzip decompressed and XML formatted");
    }
    {
        const bytes = Buffer.from("99000304010203", "hex"); // intentionally NOT a valid public-key packet
        const hash = createHash("sha1").update(bytes).digest("hex");
        assert.equal(hash, "451a354f6ab2e0d5d66aa8b716bc07c80f3ef442");
        const firstTwo = await run(expected(byNumber(12)).slice(0, 2), bytes.toString("hex"));
        assert.equal(firstTwo.output, hash);
        const r = await direct(12, bytes.toString("hex"));
        assert.equal(r.stopped, false);
        assert.ok(r.output.startsWith("34 35 31 61"), `got ${r.output.slice(0, 30)}`);
        record("pgp-v4-fingerprint", "supplier tuple, Node synthetic NON-key bytes", `SHA1=${hash}; full chain starts ${r.output.slice(0, 11)} (ASCII hex of digest text)`);
    }
    {
        const source = await readFile(file("tests/operations/tests/ParseX509CertificateBundles.mjs"), "utf8");
        const pem = /const RSA_CERT = `([\s\S]*?)`;/u.exec(source)?.[1];
        assert.ok(pem, "upstream RSA_CERT test fixture missing");
        const cert = new X509Certificate(pem);
        const derSha = createHash("sha256").update(cert.raw).digest("hex").toUpperCase();
        assert.equal(derSha, "CD9125E6E7CAA729C766E4D9ED84EF44E6BC57D00614C5F051AF661E9CE3E436");
        const parsedAndHashed = await run(expected(byNumber(11)).slice(0, 2), pem);
        assert.equal(parsedAndHashed.stopped, false);
        assert.equal(parsedAndHashed.output, "5136f4dab811113de34c522e9cf9af5638128e18c82b723efb0ee615d0568d7d");
        const r = await direct(11, pem);
        assert.equal(r.stopped, false);
        assert.ok(r.output.startsWith("35 31 33 36"));
        record("x509-fingerprint", "supplier tuple, pinned upstream synthetic certificate", `DER SHA256=${derSha}; recipe hashes displayed certificate text; final starts ${r.output.slice(0, 11)}`);
    }
    {
        // The URL's third ROT13 argument targets the "Rotate numbers" checkbox.
        // Node leaves the fourth ingredient null; App.setRecipeConfig instead
        // leaves its browser control at the default Amount=13. This is only an
        // explicit simulation of those defaults, NOT a browser execution.
        const directResult = await direct(22, "ABC123");
        const simulatedUI = await run([{ op: "ROT13", args: [false, true, true, 13] }], "ABC123");
        assert.equal(directResult.output, "ABC123");
        assert.equal(simulatedUI.output, "NOP456");
        record("lwa-cipher-wheel", "literal tuple Node vs EXPLICIT simulated browser defaults", `${directResult.output} vs ${simulatedUI.output}; no wheel alphabet supplied`);
    }
    {
        const r = await direct(21, "ABC abc");
        assert.equal(r.stopped, false);
        assert.equal(r.output, "qwe qwe");
        record("replace-substitute-pairs", "supplier tuple, Node synthetic", `ABC abc -> ${r.output}`);
    }
    {
        // Traditional uuencode uses 6-bit character groups with line length,
        // unlike MIME Base64. Encode a synthetic five-byte sample independently.
        const b = Buffer.from("hello");
        let line = String.fromCharCode(b.length + 32);
        for (let i = 0; i < b.length; i += 3) {
            const a = b[i], c = b[i + 1] || 0, d = b[i + 2] || 0;
            for (const n of [a >> 2, (a << 4 | c >> 4) & 63, (c << 2 | d >> 6) & 63, d & 63]) line += String.fromCharCode(32 + n);
        }
        const traditional = `begin 644 sample.txt\n${line}\n \nend\n`;
        const r = await direct(19, traditional);
        assert.notEqual(r.output, "hello");
        record("uucp-uudecode", "supplier tuple, Node synthetic traditional uuencode", `final=${JSON.stringify(r.output.slice(0, 100))}, not decoded "hello"`);
    }
    {
        for (const n of [25, 29]) {
            assert.throws(() => new RegExp(byNumber(n).ops.find(([op]) => op === "Subsection")[1][0]), SyntaxError);
            record(byNumber(n).slug, "upstream native RegExp constructor, supplied Subsection pattern", "invalid inline (?s) flag under Node 24");
        }
    }
    report.fixtures = fixtures;
}

if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
} else {
    console.log(`Input SHA-256 ${report.inputSha256}; upstream ${report.upstreamCommit} (Utils ${report.upstreamUtilsSha256})`);
    console.log(`${report.total} entries; URL status: ${JSON.stringify(report.uriCounts)}; ${report.rowsWithSchemaIssues} supplier tuples have schema warnings; ${report.toggleStringsWithWrongShape} malformed toggleStrings`);
    for (const r of report.rows) {
        console.log(`${String(r.number).padStart(2)} ${r.slug}: ${r.uri.status}; ${r.schema.issues.length} schema issue(s)`);
    }
    for (const f of report.fixtures || []) console.log(`fixture ${f.name} [${f.layer}]: ${f.observation}`);
}
