/**
 * Reproducible, worker-only dispatch patch for the locked OpenPGP.js browser
 * distribution. No prime test, RNG, signature or protection code is changed.
 * The normal browser/Node distributions are NEVER modified.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build, version as esbuildVersion } from "esbuild";

export const UPSTREAM_RSA_SOURCE_SHA256 = "c6dcff139be7d67a65fabbc3a38437e94bfe8afbf1b06d6217b8c11b42d02778";
const root = new URL("../", import.meta.url);
const originalDispatch = `async function generate$4(bits, e) {
    e = BigInt(e);
    // Native RSA keygen using Web Crypto
    if (util.getWebCrypto()) {`;
const workerDispatch = originalDispatch.replace("if (util.getWebCrypto())", "if (bits <= 8192 && util.getWebCrypto())");
const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

export function patchLargeRsaDispatch(source) {
  if (sha256(source) !== UPSTREAM_RSA_SOURCE_SHA256 || source.split(originalDispatch).length !== 2) {
    throw new Error("Unreviewed OpenPGP RSA source; refusing to apply the worker dispatch patch.");
  }
  // In a browser worker getNodeCrypto() is undefined, so larger sizes reach
  // the existing randomProbablePrime(..., 40) implementation below this branch.
  // Leave Web Crypto for every other operation and crypto.getRandomValues intact.
  return source.replace(originalDispatch, workerDispatch);
}

export async function buildLargeRsaWorker() {
  if (esbuildVersion !== "0.28.2") throw new Error("Large-RSA worker build requires locked esbuild 0.28.2.");
  const source = await readFile(new URL("node_modules/openpgp/dist/openpgp.mjs", root), "utf8");
  const patched = patchLargeRsaDispatch(source);
  const options = {
    entryPoints: [fileURLToPath(new URL("apps/openpgp-workbench/large-rsa-worker.mjs", root))],
    bundle: true, write: false, platform: "browser", format: "esm", target: "es2022",
    legalComments: "inline", logLevel: "silent", charset: "utf8",
    plugins: [{ name: "pinned-openpgp-worker-only", setup(builder) {
      builder.onResolve({ filter: /^openpgp$/ }, () => ({ path: "openpgp-6.3.3-worker-dispatch", namespace: "pinned-openpgp" }));
      builder.onLoad({ filter: /.*/, namespace: "pinned-openpgp" }, () => ({ contents: patched, loader: "js" }));
    } }],
  };
  // esbuild retains one whitespace-only line in this upstream JSDoc. Clean
  // that exact comment only; never trim arbitrary JavaScript/string contents.
  const readable = (await build({ ...options, minify: false })).outputFiles[0].text.replace(
    "defaults to openpgp.config\n  \n     * @throws", "defaults to openpgp.config\n\n     * @throws",
  );
  const compact = (await build({ ...options, minify: true, banner: {
    js: "/* OpenPGP.js 6.3.3 LOCAL worker-only RSA dispatch patch. Corresponding readable source: ./vendor/openpgp-large-rsa-worker.source.mjs . See THIRD_PARTY_NOTICES.md. */",
  } })).outputFiles[0].text;
  return {
    compact, readable,
    metadata: {
      schema: "html5-openpgp-large-rsa-worker-build-v1", upstreamVersion: "6.3.3",
      upstreamCommit: "804cf464668fa088e20f7d3fe4501e39aa4cd4e1",
      upstreamInput: "openpgp/dist/openpgp.mjs", upstreamInputSha256: sha256(source),
      patch: "Only the RSA keygen Web Crypto dispatch condition adds bits <= 8192; above this, the existing upstream 40-round prime search is used in a browser worker.",
      patchedInputSha256: sha256(patched), esbuildVersion,
      compactSha256: sha256(compact), readableSha256: sha256(readable),
      compactBytes: Buffer.byteLength(compact), readableBytes: Buffer.byteLength(readable),
    },
  };
}
