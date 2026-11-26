#!/usr/bin/env node
// Routing/shape preflight only. encrypt-openpgp-backup.mjs remains responsible
// for cryptographic parsing, exact certificate identity and envelope checks.
import { pathToFileURL } from "node:url";

export function validateRecipientInputs(env = process.env) {
  const key = env.RECIPIENT_PUBLIC_KEY || "";
  const fingerprint = env.RECIPIENT_FINGERPRINT || "";
  const profile = env.RECIPIENT_PROFILE || "classic-v4";
  const upload = env.UPLOAD_TO_DRIVE || "false";
  if (!["classic-v4", "modern-v6"].includes(profile)) {
    throw new Error("Choose recipient_profile classic-v4 or modern-v6. No encryption profile is inferred or downgraded.");
  }
  if (!["false", "true"].includes(upload)) {
    throw new Error("upload_to_drive must be the explicit true/false workflow option.");
  }
  if (!key && !fingerprint) {
    if (upload === "true") {
      throw new Error("Drive handoff requires both recipient_public_key and recipient_fingerprint. Disable upload_to_drive for a normal build; private APK plaintext is never uploaded.");
    }
    return { recipient: false, profile, uploadToDrive: false };
  }
  if (!key || !fingerprint) {
    throw new Error("Supply BOTH recipient_public_key and recipient_fingerprint, or leave BOTH empty for a normal build. Never supply a private key or passphrase.");
  }
  if (!/^(?:[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})$/.test(fingerprint)) {
    throw new Error("recipient_fingerprint must be the independently verified full primary fingerprint: 40 hex characters for v4 or 64 for v6, without spaces, a prefix or a short/subkey ID.");
  }
  const expected = profile === "classic-v4" ? 40 : 64;
  if (fingerprint.length !== expected) {
    throw new Error(fingerprint.length === 64
      ? "A 64-hex fingerprint requires recipient_profile modern-v6. Select it explicitly; classic-v4 is the default and v6 is never downgraded."
      : "A 40-hex fingerprint requires recipient_profile classic-v4. Do not pad or truncate a fingerprint to select a different certificate version.");
  }
  if (Buffer.byteLength(key, "utf8") > 1024 * 1024 ||
      !/^-----BEGIN PGP PUBLIC KEY BLOCK-----\r?\n[\s\S]+\r?\n-----END PGP PUBLIC KEY BLOCK-----$/.test(key.trim()) ||
      (key.match(/-----BEGIN PGP /g) || []).length !== 1 ||
      (key.match(/-----END PGP /g) || []).length !== 1) {
    throw new Error("recipient_public_key must contain exactly one ASCII-armored PUBLIC KEY BLOCK, at most 1 MiB. Secret/private keys, multiple armor blocks and extra material are not accepted by this preflight.");
  }
  return { recipient: true, profile, uploadToDrive: upload === "true" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = validateRecipientInputs();
    console.log(result.recipient
      ? "Recipient input routing accepted. Exact public certificate, encryption key and ciphertext checks remain mandatory before export."
      : "No recipient requested: compiling all three APK profiles; private plaintext is never uploaded.");
  } catch (error) {
    // All messages above are fixed application text, never recipient values.
    const safe = error.message.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
    console.error(`::error title=Android-recipient-inputs::${safe}`);
    process.exitCode = 1;
  }
}
