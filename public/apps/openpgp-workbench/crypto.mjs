import * as openpgp from "openpgp";

export const MAX_PLAINTEXT_BYTES = 1_048_576;
export const MAX_ARMORED_BYTES = 2_097_152;
export const MAX_PASSPHRASE_BYTES = 4_096;

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

  /** Decrypt a passphrase-protected ASCII-armored OpenPGP text message. */
  async function decryptOpenPgpText(armored, passphrase) {
    assertBoundedString(armored, "Armored message", MAX_ARMORED_BYTES);
    assertPassphrase(passphrase);

    const message = await library.readMessage({ armoredMessage: armored });
    const { data } = await library.decrypt({
      message,
      passwords: [passphrase],
      format: "binary",
      config,
    });
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("This workbench only returns UTF-8 text messages.");
    }
    if (data.byteLength > MAX_PLAINTEXT_BYTES) {
      throw new RangeError(`Decrypted plaintext must be no more than ${MAX_PLAINTEXT_BYTES.toLocaleString()} UTF-8 bytes.`);
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(data);
    } catch {
      throw new TypeError("The decrypted message is not valid UTF-8 text.");
    }
  }

  return Object.freeze({ config, encryptClassicText, decryptOpenPgpText });
}

const defaultTools = createOpenPgpTextTools(openpgp);
export const CLASSIC_OPENPGP_CONFIG = defaultTools.config;
export const encryptClassicText = defaultTools.encryptClassicText;
export const decryptOpenPgpText = defaultTools.decryptOpenPgpText;
