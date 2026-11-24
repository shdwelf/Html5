/** Bounded, local assistance for an owner's protected key. No cipher/KDF implementation,
 * key search, network, persistent store, secret export or recipient-policy change. */
export const RECOVERY_LIMITS = Object.freeze({ keyBytes: 1_048_576, wordlistBytes: 32_768, entries: 256,
  candidateBytes: 256, candidateCharacters: 128, candidates: 256, secretPackets: 16, packets: 128,
  timeoutMs: 120_000, previewTimeoutMs: 15_000 });
export const RECOVERY_MESSAGES = Object.freeze({
  INPUT: "Use at most 256 wordlist entries / 32 KiB, and 128 characters / 256 UTF-8 bytes per single-line candidate or hint. Controls and invalid Unicode are not supported.",
  EMPTY: "No candidates in this plan. Add wordlist entries, adjust the hint/distance, or enable small typo variants.",
  KEY: "Select exactly one complete ASCII-armored PRIVATE key certificate, at most 1 MiB. Public keys, bundles, mixed/unsupported packets and malformed input are refused.",
  PROFILE: "Recovery accepts v4 RSA (2048–16384 bits), v4 legacy Ed25519/Curve25519, or v6 Ed25519/X25519 secret packets; at most 16, with no missing/stub secret material.",
  PROTECTION: "Every secret packet must be protected with AES and iterated salted SHA-1/SHA-2 S2K, with SHA-1 integrity or standard AEAD protection. Unprotected, dummy, simple/salted-only, legacy AEAD and 16-bit-checksum keys are refused.",
  ARGON2: "Argon2-protected keys are outside this bounded recovery profile; no attempts were made. Keep the original and review a compatible offline native client.",
  FINGERPRINT: "Enter and compare the exact full 40-hex v4 or 64-hex v6 primary fingerprint. Short IDs and fuzzy fingerprint matches are never accepted.",
  WORKER: "The isolated recovery worker is unavailable or failed. No unlock result is confirmed and nothing was exported; no main-thread fallback is used.",
  RESPONSE: "The recovery worker returned an invalid response. Its result was discarded and the worker terminated.",
  TIMEOUT: "The time limit was reached and the worker terminated. This is not an exhausted search or proof the passphrase is absent.",
  ABORTED: "Recovery stopped; the worker was terminated and late results discarded. Only the displayed completed attempts are confirmed.",
});
export class RecoveryError extends Error {
  constructor(code) {
    const safeCode = typeof code === "string" && Object.hasOwn(RECOVERY_MESSAGES, code) ? code : "WORKER";
    super(RECOVERY_MESSAGES[safeCode]); this.name = safeCode === "ABORTED" ? "AbortError" : "RecoveryError"; this.code = safeCode;
  }
}
const utf8 = new TextEncoder();
function boundedText(value, maximum, code = "INPUT") {
  if (typeof value !== "string" || value.length > maximum || utf8.encode(value).length > maximum) throw new RecoveryError(code);
  return value;
}
function candidateText(value, empty = false) {
  boundedText(value, RECOVERY_LIMITS.candidateBytes);
  const chars = Array.from(value);
  if ((!empty && !chars.length) || chars.length > RECOVERY_LIMITS.candidateCharacters ||
      /[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/u.test(value) ||
      chars.some((char) => char.codePointAt(0) >= 0xd800 && char.codePointAt(0) <= 0xdfff)) throw new RecoveryError("INPUT");
  return value;
}
export function normalizeRecoveryFingerprint(value) {
  boundedText(value, 128, "FINGERPRINT");
  const result = value.replace(/[ \t\r\n]/g, "").toUpperCase();
  if (!/^(?:[A-F0-9]{40}|[A-F0-9]{64})$/.test(result)) throw new RecoveryError("FINGERPRINT");
  return result;
}
const comparison = (text) => text.normalize("NFC").toLowerCase().normalize("NFC");
// Optimal-string-alignment edit distance: insertion/deletion/substitution and
// one adjacent transposition. Comparison only; actual passphrase bytes never change.
function distance(left, right) {
  const a = Array.from(comparison(left)), b = Array.from(comparison(right));
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previousPrevious, previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], previousPrevious[j - 2] + 1);
    }
    previousPrevious = previous; previous = row;
  }
  return Math.min(3, previous[b.length]);
}
function* smallVariants(seed) {
  yield seed; yield seed.toLowerCase(); yield seed.toUpperCase();
  const chars = Array.from(seed);
  yield (chars[0]?.toUpperCase() || "") + chars.slice(1).join("").toLowerCase();
  for (let i = 0; i < chars.length; i++) {
    yield [...chars.slice(0, i), ...chars.slice(i + 1)].join("");
    yield [...chars.slice(0, i), chars[i], ...chars.slice(i)].join("");
    if (i + 1 < chars.length) yield [...chars.slice(0, i), chars[i + 1], chars[i], ...chars.slice(i + 2)].join("");
  }
}
export function buildRecoveryPlan({ wordlist = "", hint = "", maxDistance = 2, variants = false } = {}) {
  boundedText(wordlist, RECOVERY_LIMITS.wordlistBytes); candidateText(hint, true);
  if (![0, 1, 2].includes(maxDistance) || typeof variants !== "boolean") throw new RecoveryError("INPUT");
  const lines = wordlist.replace(/\r\n/g, "\n").split("\n");
  const nonempty = lines.filter((line) => line !== "");
  if (nonempty.length > RECOVERY_LIMITS.entries) throw new RecoveryError("INPUT");
  nonempty.forEach((line) => candidateText(line));
  const unique = [...new Set(nonempty)]; // No trim, case-fold or Unicode normalization of guesses.
  const compare = (a, b) => a.distance - b.distance || a.order - b.order;
  const base = unique.map((value, order) => ({ value, order, distance: hint ? distance(hint, value) : 0, source: "wordlist" }))
    .filter((entry) => !hint || entry.distance <= maxDistance).sort(compare);
  const seen = new Set(base.map((entry) => entry.value)), extras = [];
  if (variants) {
    const seeds = [...new Set([...(hint ? [hint] : []), ...base.slice(0, 3).map((entry) => entry.value)])];
    for (const seed of seeds) for (const value of smallVariants(seed)) {
      if (!value || seen.has(value)) continue;
      try { candidateText(value); } catch { continue; } // Never generate an out-of-profile guess.
      const score = hint ? distance(hint, value) : 0;
      if (hint && score > maxDistance) continue;
      seen.add(value); extras.push({ value, order: unique.length + extras.length, distance: score, source: value === hint ? "hint" : "variant" });
    }
  }
  extras.sort(compare);
  const candidates = [...base, ...extras.slice(0, RECOVERY_LIMITS.candidates - base.length)].sort(compare)
    .map(({ value, distance, source }) => Object.freeze({ value, distance, source }));
  if (!candidates.length) throw new RecoveryError("EMPTY");
  return Object.freeze({ candidates: Object.freeze(candidates), total: candidates.length, inputEntries: nonempty.length,
    duplicateEntries: nonempty.length - unique.length, matchedEntries: base.length, excludedEntries: unique.length - base.length, generatedVariants: extras.length,
    includedVariants: candidates.length - base.length, omittedVariants: Math.max(0, extras.length + base.length - candidates.length) });
}
export function checkedRecoveryCandidates(candidates) {
  if (!Array.isArray(candidates) || !candidates.length || candidates.length > RECOVERY_LIMITS.candidates) throw new RecoveryError("INPUT");
  candidates.forEach((candidate) => candidateText(candidate));
  if (new Set(candidates).size !== candidates.length) throw new RecoveryError("INPUT");
  return [...candidates];
}
export function checkedRecoveryArmor(armored) {
  boundedText(armored, RECOVERY_LIMITS.keyBytes, "KEY");
  const text = armored.trim(), begin = "-----BEGIN PGP PRIVATE KEY BLOCK-----", end = "-----END PGP PRIVATE KEY BLOCK-----";
  if (!text.startsWith(begin) || !text.endsWith(end) || text.split("-----BEGIN").length !== 2 || text.split("-----END").length !== 2) throw new RecoveryError("KEY");
  return text;
}
export function createPrivateKeyRecoveryTools(library) {
  const config = Object.freeze({ ...library.config, ignoreUnsupportedPackets: false, ignoreMalformedPackets: false,
    enableParsingV5Entities: false, parseAEADEncryptedV4KeysAsLegacy: false, maxUserIDLength: 2048, maxArgon2MemoryExponent: 16 });
  const allowed = Object.fromEntries([library.SecretKeyPacket, library.SecretSubkeyPacket, library.UserIDPacket, library.SignaturePacket].map((type) => [type.tag, type]));
  function profile(parts) {
    const rsa = parts.every((part) => { const info = part.getAlgorithmInfo(); return part.keyPacket.version === 4 && /^rsa/.test(info.algorithm) && info.bits >= 2048 && info.bits <= 16384; });
    if (rsa) return "v4-rsa";
    const primary = parts[0].getAlgorithmInfo();
    if (parts[0].keyPacket.version === 4 && primary.algorithm === "eddsaLegacy" && primary.curve === "ed25519Legacy" && parts.every((part) => {
      const info = part.getAlgorithmInfo(); return part.keyPacket.version === 4 && ((info.algorithm === "eddsaLegacy" && info.curve === "ed25519Legacy") || (info.algorithm === "ecdh" && info.curve === "curve25519Legacy"));
    })) return "v4-25519";
    if (parts[0].keyPacket.version === 6 && primary.algorithm === "ed25519" && parts.every((part) => part.keyPacket.version === 6 && ["ed25519", "x25519"].includes(part.getAlgorithmInfo().algorithm))) return "v6-25519";
    throw new RecoveryError("PROFILE");
  }
  async function read(armored, expected) {
    const text = checkedRecoveryArmor(armored);
    let packets, keys;
    try {
      const { type, data } = await library.unarmor(text);
      if (type !== library.enums.armor.privateKey || !(data instanceof Uint8Array) || data.length > RECOVERY_LIMITS.keyBytes) throw new RecoveryError("KEY");
      packets = await library.PacketList.fromBinary(data, allowed, config);
      if (packets.length > RECOVERY_LIMITS.packets || packets[0]?.constructor.tag !== library.enums.packet.secretKey ||
          !packets.every((packet) => Object.hasOwn(allowed, packet.constructor.tag)) ||
          packets.filter((packet) => packet.constructor.tag === library.enums.packet.secretKey).length !== 1) throw new RecoveryError("KEY");
      const rawSecrets = packets.filter((packet) => [library.enums.packet.secretKey, library.enums.packet.secretSubkey].includes(packet.constructor.tag));
      if (!rawSecrets.length || rawSecrets.length > RECOVERY_LIMITS.secretPackets) throw new RecoveryError("PROFILE");
      for (const packet of rawSecrets) {
        if (packet.s2k?.type === "argon2") throw new RecoveryError("ARGON2");
        if (packet.isEncrypted !== true || packet.isDecrypted() || packet.isMissingSecretKeyMaterial() || packet.isDummy() || packet.unparseableKeyMaterial ||
            ![253, 254].includes(packet.s2kUsage) || packet.isLegacyAEAD || ![7, 8, 9].includes(packet.symmetric) ||
            packet.s2k?.type !== "iterated" || ![2, 8, 9, 10, 11].includes(packet.s2k.algorithm) ||
            !Number.isInteger(packet.s2k.c) || packet.s2k.c < 0 || packet.s2k.c > 255 ||
            (packet.s2kUsage === 253 && ![1, 2, 3].includes(packet.aead))) throw new RecoveryError("PROTECTION");
      }
      keys = await library.readPrivateKeys({ binaryKeys: data, config });
      if (keys.length !== 1 || !keys[0].isPrivate()) throw new RecoveryError("KEY");
      const key = keys[0], parts = key.getKeys();
      if (parts.length !== rawSecrets.length || parts.some((part, index) => part.getFingerprint() !== rawSecrets[index].getFingerprint())) throw new RecoveryError("KEY");
      const identity = Object.freeze({ fingerprint: normalizeRecoveryFingerprint(key.getFingerprint()), version: key.keyPacket.version,
        secretPackets: parts.length, profile: profile(parts) });
      if (expected !== undefined && identity.fingerprint !== normalizeRecoveryFingerprint(expected)) throw new RecoveryError("FINGERPRINT");
      return { key, identity };
    } catch (error) {
      keys?.forEach((key) => key.clearPrivateParams());
      throw error instanceof RecoveryError ? error : new RecoveryError("KEY");
    } finally {
      // Even refused unprotected input must not leave parsed private params alive.
      packets?.forEach((packet) => { if (typeof packet.clearPrivateParams === "function" && packet.isDecrypted()) packet.clearPrivateParams(); });
    }
  }
  async function inspectProtectedKey(armored) {
    const { key, identity } = await read(armored);
    try { return identity; } finally { key.clearPrivateParams(); }
  }
  async function recoverProtectedKey(armored, expectedFingerprint, candidates, { signal, onProgress = () => {} } = {}) {
    const expected = normalizeRecoveryFingerprint(expectedFingerprint), checked = checkedRecoveryCandidates(candidates);
    const abort = () => { if (signal?.aborted) throw new RecoveryError("ABORTED"); };
    let key;
    try {
      abort();
      const parsed = await read(armored, expected);
      key = parsed.key;
      const { identity } = parsed;
      for (let index = 0; index < checked.length; index++) {
        abort(); let trial, matched = false;
        try {
          trial = key.clone(true);
          // Sequential packets and guesses: no Promise.all early-rejection race
          // can leave another packet's decrypt running past cleanup.
          for (const { keyPacket } of trial.getKeys()) {
            await keyPacket.decrypt(checked[index], config); abort();
            if (!keyPacket.isDecrypted()) throw new Error("Not unlocked");
            await keyPacket.validate(); abort(); // Validate EVERY secret/public parameter pair.
          }
          matched = true;
        } catch (error) { if (signal?.aborted || error?.code === "ABORTED") throw new RecoveryError("ABORTED"); }
        finally { trial?.clearPrivateParams(); }
        abort(); onProgress(Object.freeze({ attempted: index + 1, total: checked.length })); abort();
        if (matched) return Object.freeze({ status: "matched", index, attempted: index + 1, total: checked.length, fingerprint: identity.fingerprint, secretPackets: identity.secretPackets });
      }
      return Object.freeze({ status: "not-found", attempted: checked.length, total: checked.length, fingerprint: identity.fingerprint, secretPackets: identity.secretPackets });
    } finally { key?.clearPrivateParams(); checked.fill(""); }
  }
  return Object.freeze({ inspectProtectedKey, recoverProtectedKey });
}
