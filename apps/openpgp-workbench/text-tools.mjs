export const MAX_PLAINTEXT_BYTES = 1_048_576;
export const MAX_ARMORED_BYTES = 2_097_152;
export const MAX_PASSPHRASE_BYTES = 4_096;
export const MAX_ENCRYPTED_BYTES = 2_097_152;
export const MESSAGE_TIMEOUT_MS = 30_000;

const utf8 = new TextEncoder();

function assertBoundedString(value, name, maximumBytes) {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be text.`);
  }
  const byteLength = utf8.encode(value).byteLength;
  if (byteLength > maximumBytes) {
    throw new RangeError(`${name} must be no more than ${maximumBytes.toLocaleString()} UTF-8 bytes.`);
  }
  return byteLength;
}

function assertPassphrase(passphrase) {
  const byteLength = assertBoundedString(passphrase, "Passphrase", MAX_PASSPHRASE_BYTES);
  if (byteLength === 0) {
    throw new Error("Passphrase must not be empty.");
  }
}

/** Strict one-message input boundary. No URL, base64 guess or secret-key fallback. */
export function checkedMessageInput(input) {
  if (input instanceof ArrayBuffer) input = new Uint8Array(input);
  if (input instanceof Uint8Array) {
    if (!input.byteLength || input.byteLength > MAX_ENCRYPTED_BYTES) throw new RangeError('Encrypted file must contain 1–2,097,152 bytes.');
    const prefix = new TextDecoder().decode(input.subarray(0, 96));
    if (/^\uFEFF?\s*-----BEGIN /u.test(prefix)) {
      try { input = new TextDecoder('utf-8', { fatal: true }).decode(input); }
      catch { throw new TypeError('Armored message file is not valid UTF-8.'); }
    } else {
      if (!(input[0] & 0x80)) throw new TypeError('Expected an armored or binary OpenPGP encrypted message, not arbitrary text or a URL.');
      return { binaryMessage: input };
    }
  }
  assertBoundedString(input, 'Armored message', MAX_ARMORED_BYTES);
  input = input.replace(/^\uFEFF/u, '').trim();
  if (!/^-----BEGIN PGP MESSAGE-----[\s\S]*-----END PGP MESSAGE-----$/u.test(input) ||
      (input.match(/-----BEGIN PGP /gu) || []).length !== 1 || (input.match(/-----END PGP /gu) || []).length !== 1) {
    throw new TypeError('Paste one complete armored PGP MESSAGE or choose a binary .pgp/.gpg file. Public/private keys, signatures, URLs and encoded guesses are not encrypted-message inputs.');
  }
  return { armoredMessage: input };
}

/**
 * Create the narrow v1 API against an OpenPGP.js module. The factory is also
 * exercised with the actual browser bundle by the interoperability tests.
 */
export function createOpenPgpTextTools(library) {
  if (!library?.enums || !library?.config) {
    throw new TypeError("An OpenPGP.js module is required.");
  }

  /**
   * Classic passphrase-only profile aligned with the PGPonyCore classic writer
   * review. This is OpenPGP.js, not a port or wrapper around the Swift package.
   */
  const config = Object.freeze({
    ...library.config,
    preferredSymmetricAlgorithm: library.enums.symmetric.aes256,
    preferredHashAlgorithm: library.enums.hash.sha256,
    preferredCompressionAlgorithm: library.enums.compression.uncompressed,
    s2kType: library.enums.s2k.iterated,
    // OpenPGP's coded count 0xFF expands to 65,011,712 octets.
    s2kIterationCountByte: 0xff,
    aeadProtect: false,
    allowUnauthenticatedMessages: false,
    maxArgon2MemoryExponent: 16, // At most 64 MiB; UI decryption also has a terminating worker deadline.
    maxDecompressedMessageSize: MAX_PLAINTEXT_BYTES,
    showVersion: false,
    showComment: false,
  });

  /** Encrypt UTF-8 text as an ASCII-armored, classic symmetric OpenPGP message. */
  async function encryptClassicText(plaintext, passphrase) {
    assertBoundedString(plaintext, "Plaintext", MAX_PLAINTEXT_BYTES);
    assertPassphrase(passphrase);

    // The high-level OpenPGP.js encrypt() writer wraps a random session key in
    // the v4 SKESK packet. This profile intentionally uses RFC 4880 §5.3's
    // direct-S2K form (no encrypted session-key field), matching the classic
    // passphrase-only profile already understood by the local CyberChef reader.
    // Packet parsing, S2K derivation, CFB/MDC encryption, and armor are still
    // performed by OpenPGP.js; this code does not implement a cipher primitive.
    const skeskHeader = Uint8Array.of(
      4,
      library.enums.symmetric.aes256,
      library.enums.s2k.iterated,
      library.enums.hash.sha256,
      0, 0, 0, 0, 0, 0, 0, 0,
      config.s2kIterationCountByte,
    );
    const skesk = new library.SymEncryptedSessionKeyPacket(config);
    skesk.read(skeskHeader);
    skesk.s2k.generateSalt();
    skesk.encrypted = null;
    skesk.sessionKeyEncryptionAlgorithm = null;

    const sessionKey = await skesk.s2k.produceKey(passphrase, 32, config);
    try {
      const literalMessage = await library.createMessage({ binary: utf8.encode(plaintext) });
      const seipd = library.SymEncryptedIntegrityProtectedDataPacket.fromObject({ version: 1 });
      seipd.packets = literalMessage.packets;
      await seipd.encrypt(library.enums.symmetric.aes256, sessionKey, config);
      seipd.packets = new library.PacketList();
      literalMessage.packets = new library.PacketList();

      const packets = new library.PacketList();
      packets.push(skesk, seipd);
      const armored = await new library.Message(packets).armor(config);
      assertBoundedString(armored, "Armored message", MAX_ARMORED_BYTES);
      return armored;
    } finally {
      sessionKey.fill(0);
    }
  }

  /** Armored or binary, integrity-protected password messages; no private-key input. */
  async function decryptOpenPgpBytes(input, passphrase) {
    const options = checkedMessageInput(input);
    assertPassphrase(passphrase);
    const message = await library.readMessage({ ...options, config });
    const tags = message.packets.map((packet) => packet.constructor.tag);
    const skesk = tags.filter((tag) => tag === library.enums.packet.symEncryptedSessionKey).length;
    if (!skesk) {
      if (tags.includes(library.enums.packet.publicKeyEncryptedSessionKey)) {
        const error = new Error("This message is encrypted only to a public key. A passphrase or public certificate alone cannot decrypt it. Use a trusted client with the matching private key or authorized hardware key; this tool does not request a private key.");
        error.code = "PRIVATE_KEY_REQUIRED";
        throw error;
      }
      throw new Error("Choose a passphrase-protected encrypted OpenPGP message, not a key, signature or unencrypted literal packet.");
    }
    const dataTag = library.enums.packet.symEncryptedIntegrityProtectedData;
    if (skesk > 4 || tags.length > 16 || tags.filter((tag) => tag === dataTag).length !== 1 || tags.at(-1) !== dataTag ||
        tags.slice(0, -1).some((tag) => ![library.enums.packet.publicKeyEncryptedSessionKey, library.enums.packet.symEncryptedSessionKey].includes(tag))) {
      throw new Error("Unsupported encrypted message profile. Integrity protection and at most four passphrase recipients are required.");
    }
    const { data } = await library.decrypt({ message, passwords: [passphrase], format: "binary", config });
    if (!(data instanceof Uint8Array) || data.byteLength > MAX_PLAINTEXT_BYTES) {
      throw new RangeError(`Decrypted payload must be no more than ${MAX_PLAINTEXT_BYTES.toLocaleString()} bytes.`);
    }
    // Embedded filenames are untrusted. Deliberately return only authenticated
    // payload bytes, never a path to execute/extract or a sender-authentication claim.
    return data;
  }

  /** Backwards-compatible text API; binary payloads use the explicit file workflow. */
  async function decryptOpenPgpText(input, passphrase) {
    const data = await decryptOpenPgpBytes(input, passphrase);
    try { return new TextDecoder("utf-8", { fatal: true }).decode(data); }
    catch { throw new TypeError("The decrypted message is not valid UTF-8 text. Use the explicit binary-file save workflow."); }
  }

  return Object.freeze({ config, encryptClassicText, decryptOpenPgpText, decryptOpenPgpBytes });
}
