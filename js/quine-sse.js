/**
 * quine-sse.js — quine → password-sealed S.S.E.-style URL (T9.4).
 *
 * Pipeline: verify the text really is a quine (run it, compare its output
 * to itself), seal it under a password, and carry the ciphertext in a URL
 * fragment (fragments never reach a server). The URL then renders as a QR
 * label (Avery 5160 sheet) from quine-sse.html.
 *
 * Format honesty (per docs/wiki-workspace-research-2026-10-15.md §4):
 * Paranoia Works' Secret Space Encryptor v3 — Argon2id + EAX + Base62 —
 * is implemented byte-compatibly in sse-webxdc for messages, and this
 * module does NOT claim that compatibility. The URL envelope here is the
 * repository's own, deliberately labelled `quine-sse-v1.`, reusing the
 * vetted haiku-vault parameters (PBKDF2-HMAC-SHA256, 120k iterations,
 * AES-256-GCM, version byte | salt | IV | ciphertext+tag) under a Base64url
 * armour so it survives URL transport. Different name, different bytes.
 *
 * Running a quine executes code: verify only quines you wrote or trust.
 * The runner captures console output with a scripted console and refuses
 * asynchronous output (a quine, by construction, is synchronous).
 */

const MAGIC = "quine-sse-v1.";
/** Conservative single-QR byte budget (QR byte mode tops out at 2,953). */
export const QR_URL_BUDGET = 2900;
/** The S9 stream's URL ceiling: 2 MB. */
export const SSE_URL_BUDGET = 2 * 1024 * 1024;

/** Run `source` with a captured console; return everything it printed. */
export function runCaptured(source, { maxChars = 1_000_000 } = {}) {
  const chunks = [];
  let total = 0;
  const fakeConsole = {
    log: (...args) => {
      const s = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ") + "\n";
      total += s.length;
      if (total > maxChars) throw new Error("Quine produced more output than its source budget allows");
      chunks.push(s);
    },
  };
  const fn = new Function("console", `"use strict";\n${source}`);
  fn(fakeConsole);
  return chunks.join("");
}

/** A quine is text whose run output is exactly itself (trailing newline aside). */
export function verifyQuine(source) {
  const src = String(source);
  let output;
  try {
    output = runCaptured(src);
  } catch (err) {
    return { ok: false, reason: "did not run cleanly: " + err.message };
  }
  const ok = output.replace(/\n$/, "") === src.replace(/\n$/, "");
  return ok
    ? { ok: true, reason: "output is byte-identical to the source" }
    : { ok: false, reason: `output (${output.length} chars) does not reproduce the source (${src.length} chars)` };
}

// ---- envelope (WebCrypto; parameters shared with haiku-vault-v1) ----------

const subtle = () => {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("WebCrypto subtle is unavailable in this environment");
  return c.subtle;
};
const b64urlEncode = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};
const b64urlDecode = (text) => {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error("Packed payload is not strict Base64url");
  const b64 = text.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (ch) => ch.charCodeAt(0));
};

async function deriveKey(password, salt) {
  const km = await subtle().importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
    km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

/** Seal quine source text into a `quine-sse-v1.` fragment payload. */
export async function packQuine(source, password, { salt = null, iv = null } = {}) {
  if (!password) throw new Error("An S.S.E. URL needs a password (blank defeats the point)");
  const rand = (n) => { const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b); return b; };
  salt = salt ?? rand(16);
  iv = iv ?? rand(12);
  const key = await deriveKey(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify({ kind: "quine", format: "quine-sse", version: 1, source: String(source) }));
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, plain));
  const body = new Uint8Array(1 + salt.length + iv.length + ct.length);
  body[0] = 0x01;
  body.set(salt, 1);
  body.set(iv, 1 + salt.length);
  body.set(ct, 1 + salt.length + iv.length);
  return MAGIC + b64urlEncode(body);
}

/** Open a packed payload back to the quine source; rejects tampering. */
export async function unpackQuine(packed, password) {
  const s = String(packed).trim();
  if (!s.startsWith(MAGIC)) throw new Error("Missing quine-sse-v1. magic");
  const body = b64urlDecode(s.slice(MAGIC.length));
  if (body.length < 1 + 16 + 12 + 16) throw new Error("Packed payload too short");
  if (body[0] !== 0x01) throw new Error(`Unsupported quine-sse version ${body[0]}`);
  const key = await deriveKey(password, body.subarray(1, 17));
  let plain;
  try {
    plain = await subtle().decrypt({ name: "AES-GCM", iv: body.subarray(17, 29) }, key, body.subarray(29));
  } catch {
    throw new Error("Unseal failed (wrong password or tampered URL)");
  }
  const payload = JSON.parse(new TextDecoder().decode(plain));
  if (payload.kind !== "quine" || typeof payload.source !== "string") throw new Error("Payload is not a quine envelope");
  return payload.source;
}

export function buildQuineUrl(baseUrl, packed) {
  const url = new URL(baseUrl);
  url.hash = "q=" + packed;
  return url.toString();
}

export function packedFromUrl(urlText) {
  const hash = new URL(urlText).hash;
  if (!hash.startsWith("#q=")) throw new Error("URL carries no #q= quine payload");
  return decodeURIComponent(hash.slice(3));
}

/** Size verdicts before anyone prints a label that cannot scan. */
export function assessUrl(urlText) {
  const bytes = new TextEncoder().encode(urlText).length;
  return {
    urlBytes: bytes,
    fitsQr: bytes <= QR_URL_BUDGET,
    fitsSseBudget: bytes <= SSE_URL_BUDGET,
    verdict: bytes > SSE_URL_BUDGET
      ? "exceeds the 2 MB S.S.E. URL budget — seal it as a file in the SSE app instead"
      : bytes > QR_URL_BUDGET
        ? "fits the URL budget but not one QR label — shorten the quine or split the work"
        : "fits a single QR label and the S.S.E. URL budget",
  };
}
