import * as openpgp from "openpgp";

export const MAX_KEYRING_BYTES = 1_048_576;
export const MAX_PUBLIC_KEYS = 32;
export const RSA_BITS = 3072; // Conservative default, not the import ceiling.
export const MAX_RSA_BITS = 16384;
export const RSA_GENERATION_SIZES = Object.freeze([3072, 4096, 6144, 8192, 12288, 16384]);

export function checkedRsaBits(bits) {
  if (!Number.isInteger(bits) || !RSA_GENERATION_SIZES.includes(bits)) {
    throw new Error("Choose an explicit supported RSA size: 3072, 4096, 6144, 8192, 12288 or 16384 bits.");
  }
  return bits;
}
export const DEFAULT_EXPIRY_DAYS = 730;
const utf8 = new TextEncoder();

function boundedText(value, label, maximum) {
  if (typeof value !== "string") throw new TypeError(`${label} must be text.`);
  // Check code units first to avoid allocating an unbounded UTF-8 buffer.
  if (value.length > maximum || utf8.encode(value).byteLength > maximum) {
    throw new RangeError(`${label} exceeds the ${maximum.toLocaleString()}-byte limit.`);
  }
  return value;
}

/** Only full v4 fingerprints; never silently accept a short or long key ID. */
export function normalizeFingerprint(value) {
  boundedText(value, "Fingerprint", 128);
  const fingerprint = value.replace(/[ \t\r\n]/g, "").toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(fingerprint)) throw new Error("Enter the full 40-hex-character v4 fingerprint, not a key ID.");
  return fingerprint;
}

export function formatFingerprint(value) {
  return normalizeFingerprint(value).match(/.{4}/g).join(" ");
}

/** Shared preflight before either native generation or a worker message. */
export function checkedGenerationOptions({ name = "", email = "", passphrase, expiryDays = DEFAULT_EXPIRY_DAYS, rsaBits = RSA_BITS } = {}) {
  name = boundedText(name, "Name", 128).trim();
  email = boundedText(email, "Email", 254).trim();
  const controls = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
  if (controls.test(name + email) || /[<>]/.test(name)) throw new Error("User ID fields must not contain control characters, directional overrides or angle brackets.");
  if (!name && !email) throw new Error("Supply a name or an email for the User ID; neither is inferred for you.");
  if (email && !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new Error("Enter an email address or leave the email field empty.");
  boundedText(passphrase, "Passphrase", 4096);
  if ([...passphrase].length < 12 || !passphrase.trim()) throw new Error("Use a unique passphrase of at least 12 characters; length alone does not guarantee strength.");
  if (!Number.isInteger(expiryDays) || expiryDays < 30 || expiryDays > 3650) throw new Error("Expiry must be a whole number of days between 30 and 3650.");
  checkedRsaBits(rsaBits); // Fail before any expensive key generation.
  return Object.freeze({ name, email, passphrase, expiryDays, rsaBits });
}

function assertNotAborted(signal) {
  if (signal?.aborted) {
    const error = new Error("Operation cleared; its result was discarded.");
    error.name = "AbortError";
    throw error;
  }
}

/**
 * The factory also exercises the exact shipped browser library in tests.
 * No primitive, fingerprint hash, armor decoder or secret-key parser is
 * implemented here. No network, keyserver, persistent store or trust database.
 */
export function createOpenPgpKeyTools(library) {
  if (!library?.enums || !library?.PacketList) throw new TypeError("An OpenPGP.js module is required.");
  const config = Object.freeze({
    ...library.config,
    v6Keys: false,
    aeadProtect: false,
    preferredSymmetricAlgorithm: library.enums.symmetric.aes256,
    preferredHashAlgorithm: library.enums.hash.sha256,
    preferredCompressionAlgorithm: library.enums.compression.uncompressed,
    s2kType: library.enums.s2k.iterated,
    s2kIterationCountByte: 0xff,
    ignoreUnsupportedPackets: false,
    ignoreMalformedPackets: false,
    maxUserIDLength: 2048,
    showVersion: false,
    showComment: false,
  });
  const allowedPublicPackets = Object.fromEntries([
    library.PublicKeyPacket, library.PublicSubkeyPacket,
    library.UserIDPacket, library.SignaturePacket,
  ].map((packet) => [packet.tag, packet]));

  function assertRsaV4(key) {
    if (!key.getKeys().every((part) => {
      const { algorithm, bits } = part.getAlgorithmInfo();
      return part.keyPacket.version === 4 && /^rsa/.test(algorithm) && bits >= 2048 && bits <= MAX_RSA_BITS;
    })) {
      throw new Error("This compatibility keyring accepts only v4 RSA certificates with 2048–16384-bit keys. Other algorithms need a separate compatibility review.");
    }
    normalizeFingerprint(key.getFingerprint());
  }

  // Public import is separate from the conservative RSA generator/private
  // export policy. These are legacy v4 algorithm-22/18 packets, not v6 keys.
  function publicProfile(key) {
    const parts = key.getKeys();
    const rsa = parts.every((part) => {
      const { algorithm, bits } = part.getAlgorithmInfo();
      return part.keyPacket.version === 4 && /^rsa/.test(algorithm) && bits >= 2048 && bits <= MAX_RSA_BITS;
    });
    if (rsa) return `v4 RSA-${key.getAlgorithmInfo().bits}`;
    const ed25519 = (part) => {
      const { algorithm, curve } = part.getAlgorithmInfo();
      return part.keyPacket.version === 4 && algorithm === "eddsaLegacy" && curve === "ed25519Legacy";
    };
    const curve25519 = (part) => {
      const { algorithm, curve } = part.getAlgorithmInfo();
      return part.keyPacket.version === 4 && algorithm === "ecdh" && curve === "curve25519Legacy";
    };
    if (ed25519(key) && parts.every((part) => ed25519(part) || curve25519(part))) {
      return "v4 Ed25519 / Curve25519 (legacy packets)";
    }
    throw new Error("Public imports accept only v4 RSA (2048–16384 bits) or v4 legacy Ed25519/Curve25519 certificates. Other profiles need a separate compatibility review.");
  }

  function assertProtected(key, rsaBits = RSA_BITS) {
    checkedRsaBits(rsaBits);
    assertRsaV4(key);
    if (!key.isPrivate() || key.getKeys().length !== 2 || !key.getKeys().every(({ keyPacket }) => (
      keyPacket.getAlgorithmInfo().bits === rsaBits &&
      keyPacket.isEncrypted === true && !keyPacket.isDecrypted() &&
      !keyPacket.isMissingSecretKeyMaterial() && keyPacket.privateParams === null &&
      keyPacket.s2kUsage === 254 && keyPacket.symmetric === library.enums.symmetric.aes256 &&
      keyPacket.s2k?.type === "iterated" && keyPacket.s2k.algorithm === library.enums.hash.sha256 &&
      keyPacket.s2k.c === 0xff
    ))) {
      throw new Error("Refusing a private download: both RSA key packets must match the selected size and generated AES-256 / iterated SHA-256 S2K protection.");
    }
  }

  /** User-supplied UID only. No account lookup, inferred identity or deterministic seed. */
  async function generateCompatibilityKey(options = {}) {
    const { name, email, passphrase, expiryDays, rsaBits } = checkedGenerationOptions(options);
    const userID = { ...(name ? { name } : {}), ...(email ? { email } : {}) };
    let generated;
    try {
      generated = await library.generateKey({
        type: "rsa", rsaBits, userIDs: [userID],
        passphrase, keyExpirationTime: expiryDays * 86400,
        subkeys: [{ type: "rsa", rsaBits, sign: false }],
        format: "object", config,
      });
      assertProtected(generated.privateKey, rsaBits);
      // OpenPGP.js 6.3.2 adds SHA-3 IDs to generated preference lists even
      // with SHA-256 selected. PGPy 0.6.0 independently exposed that older
      // readers can refuse the WHOLE certificate. Build a fresh, narrow UID
      // self-certification with the library's exported signature API; never
      // edit an already-signed packet or implement a signature primitive.
      const signingKey = await library.decryptKey({ privateKey: generated.privateKey, passphrase, config });
      try {
        const certification = new library.SignaturePacket();
        Object.assign(certification, {
          signatureType: library.enums.signature.certPositive,
          publicKeyAlgorithm: signingKey.keyPacket.algorithm,
          hashAlgorithm: library.enums.hash.sha256,
          keyFlags: [library.enums.keyFlags.certifyKeys | library.enums.keyFlags.signData],
          keyExpirationTime: expiryDays * 86400, keyNeverExpires: false,
          isPrimaryUserID: true,
          preferredSymmetricAlgorithms: [library.enums.symmetric.aes256, library.enums.symmetric.aes128],
          preferredHashAlgorithms: [library.enums.hash.sha256, library.enums.hash.sha384, library.enums.hash.sha512],
          preferredCompressionAlgorithms: [library.enums.compression.uncompressed],
          features: [library.enums.features.modificationDetection],
        });
        await certification.sign(signingKey.keyPacket, {
          key: signingKey.keyPacket, userID: signingKey.users[0].userID,
        }, signingKey.getCreationTime(), false, config);
        generated.privateKey.users[0].selfCertifications = [certification];
      } finally { signingKey.clearPrivateParams(); }
      const publicKey = generated.privateKey.toPublic().armor(config);
      const privateKey = generated.privateKey.armor(config);
      // Reparse to avoid the library's in-memory signature verification cache.
      generated.publicKey = await library.readKey({ armoredKey: publicKey, config });
      await generated.publicKey.verifyPrimaryKey(undefined, undefined, config);
      await generated.publicKey.getEncryptionKey(undefined, undefined, undefined, config);
      assertProtected(generated.privateKey, rsaBits);
      boundedText(publicKey, "Public certificate", MAX_KEYRING_BYTES);
      boundedText(privateKey, "Protected private key", MAX_KEYRING_BYTES);
      return Object.freeze({
        fingerprint: normalizeFingerprint(generated.publicKey.getFingerprint()),
        rsaBits, publicKey, privateKey, revocationCertificate: generated.revocationCertificate,
        created: generated.publicKey.getCreationTime().toISOString(),
        expires: new Date(generated.publicKey.getCreationTime().getTime() + expiryDays * 86400000).toISOString(),
      });
    } finally {
      // OpenPGP.js clears decrypted params after generating protected packets.
      // Also release them on a failing postcondition. JS strings/engine copies
      // cannot be reliably zeroized; this is not a secure-memory guarantee.
      generated?.privateKey?.clearPrivateParams();
    }
  }

  /** Defense in depth immediately before a generated private-key download. */
  async function checkedPrivateDownload(armored, expectedFingerprint, { rsaBits = RSA_BITS } = {}) {
    boundedText(armored, "Protected private key", MAX_KEYRING_BYTES);
    const expected = normalizeFingerprint(expectedFingerprint);
    checkedRsaBits(rsaBits);
    const begin = "-----BEGIN PGP PRIVATE KEY BLOCK-----", end = "-----END PGP PRIVATE KEY BLOCK-----";
    const block = armored.trim();
    const inner = block.slice(begin.length, -end.length);
    if (!block.startsWith(begin) || !block.endsWith(end) || inner.includes("-----BEGIN") || inner.includes("-----END")) throw new Error("Expected exactly one generated protected private-key block.");
    const { data } = await library.unarmor(block);
    const allowed = Object.fromEntries([
      library.SecretKeyPacket, library.SecretSubkeyPacket, library.UserIDPacket, library.SignaturePacket,
    ].map((packet) => [packet.tag, packet]));
    const packets = await library.PacketList.fromBinary(data, allowed, config);
    if (packets.length > 32 || packets[0]?.constructor.tag !== library.enums.packet.secretKey ||
      !packets.every((packet) => Object.hasOwn(allowed, packet.constructor.tag))) throw new Error("Invalid or unsupported generated private certificate.");
    const keys = await library.readPrivateKeys({ binaryKeys: data, config });
    if (keys.length !== 1) throw new Error("Expected exactly one private certificate, not a multi-key secret export.");
    assertProtected(keys[0], rsaBits);
    if (normalizeFingerprint(keys[0].getFingerprint()) !== expected) throw new Error("Private-key fingerprint mismatch. Nothing was downloaded.");
    return armored;
  }

  async function parsePublicKeyring(armored) {
    boundedText(armored, "Public keyring", MAX_KEYRING_BYTES);
    // readKeys understands multiple certificates IN one armor block. Split
    // concatenated blocks as well; a single readKeys call can stop at block 1.
    const begin = "-----BEGIN PGP PUBLIC KEY BLOCK-----", end = "-----END PGP PUBLIC KEY BLOCK-----";
    let cursor = 0;
    const keys = [];
    // Literal scans avoid repeated regex backtracking on many incomplete BEGIN
    // markers. No framing salvage: incomplete/nested/mixed blocks are errors.
    for (;;) {
      const start = armored.indexOf(begin, cursor);
      if (start < 0) break;
      if (armored.slice(cursor, start).trim()) throw new Error("Public keyrings only: private keys, unrelated text and mixed exports are refused.");
      const finish = armored.indexOf(end, start + begin.length);
      const nested = armored.indexOf("-----BEGIN", start + begin.length);
      if (finish < 0 || (nested >= 0 && nested < finish)) throw new Error("Incomplete or nested public armor blocks are refused.");
      cursor = finish + end.length;
      const { data, type } = await library.unarmor(armored.slice(start, cursor));
      if (type !== library.enums.armor.publicKey) throw new Error("A public key block is required.");
      // Preflight EVERY packet: a forged PUBLIC header, orphan secret subkey,
      // unsupported critical packet or message packet must not be silently
      // discarded by the high-level readKeys certificate slicer.
      const packets = await library.PacketList.fromBinary(data, allowedPublicPackets, config);
      // Unknown non-critical packets are retained as UnparseablePacket even
      // with ignoreUnsupportedPackets=false. Reject those explicitly instead
      // of letting readKeys silently discard them. Standard marker/trust/
      // padding packets are ignored by OpenPGP.js per the format, not imported
      // as trust decisions or secret material.
      if (packets.length > 2048 || packets[0]?.constructor.tag !== library.enums.packet.publicKey ||
        !packets.every((packet) => Object.hasOwn(allowedPublicPackets, packet.constructor.tag))) throw new Error("Invalid, unsupported or excessively complex public keyring.");
      const parsed = await library.readKeys({ binaryKeys: data, config });
      keys.push(...parsed);
      if (keys.length > MAX_PUBLIC_KEYS) throw new Error(`At most ${MAX_PUBLIC_KEYS} public certificates are allowed.`);
    }
    if (!keys.length || armored.slice(cursor).trim()) throw new Error("Public keyrings only: provide complete ASCII-armored public certificates without extra text.");
    const entries = [];
    for (const key of keys) {
      if (key.isPrivate()) throw new Error("Secret packets are never accepted into the public keyring.");
      const algorithm = publicProfile(key);
      if (key.getKeys().length > 16 || key.users.length > 32) throw new Error("Certificate has too many subkeys or User IDs for this workbench.");
      let selfCertification = "valid at import time; identity NOT verified";
      try { await key.verifyPrimaryKey(undefined, undefined, config); }
      catch { selfCertification = "unusable: revoked, expired or invalid self-certification; archival export only"; }
      const userIDs = key.getUserIDs().map((uid) => boundedText(uid, "User ID", 2048));
      entries.push(Object.freeze({
        fingerprint: normalizeFingerprint(key.getFingerprint()),
        userIDs: Object.freeze(userIDs),
        created: key.getCreationTime().toISOString(),
        algorithm,
        selfCertification,
        armored: key.armor(config),
      }));
    }
    return entries;
  }

  /**
   * Release encryption requires exactly one public certificate, a full primary
   * fingerprint and a currently usable bound encryption key. No first-key
   * selection from a bundle or use of archival-only entries is permitted.
   */
  async function readEncryptionRecipient(armored, expectedFingerprint) {
    const expected = normalizeFingerprint(expectedFingerprint);
    const entries = await parsePublicKeyring(armored);
    if (entries.length !== 1 || entries[0].fingerprint !== expected) {
      throw new Error("Recipient fingerprint mismatch, or multiple certificates supplied. Encryption refused.");
    }
    const key = await library.readKey({ armoredKey: entries[0].armored, config });
    await key.verifyPrimaryKey(undefined, undefined, config);
    const encryptionKey = await key.getEncryptionKey(undefined, undefined, undefined, config);
    return Object.freeze({
      key, encryptionKey,
      fingerprint: expected,
      encryptionFingerprint: normalizeFingerprint(encryptionKey.getFingerprint()),
      encryptionKeyID: encryptionKey.getKeyID().toHex().toUpperCase(),
      algorithm: entries[0].algorithm,
    });
  }

  /** Memory-only public certificates. Batch imports commit atomically. */
  function createPublicKeyring() {
    let entries = new Map();
    let revision = 0;
    const list = () => [...entries.values()].map(({ armored, ...metadata }) => ({ ...metadata, userIDs: [...metadata.userIDs] }));
    return Object.freeze({
      list,
      async importKeys(armored, { expectedFingerprint = "", signal } = {}) {
        const startRevision = revision;
        assertNotAborted(signal);
        const expected = expectedFingerprint ? normalizeFingerprint(expectedFingerprint) : null;
        const incoming = await parsePublicKeyring(armored);
        if (expected && (incoming.length !== 1 || incoming[0].fingerprint !== expected)) throw new Error("Fingerprint mismatch, or multiple certificates supplied for a single expected fingerprint. Nothing was imported.");
        const updated = new Map(entries);
        for (const entry of incoming) {
          const old = updated.get(entry.fingerprint);
          if (old && old.armored !== entry.armored) throw new Error("A certificate with this fingerprint already has different data. Review the update/revocation, explicitly remove the old entry, then reimport; no silent overwrite or merge.");
          if (!old) updated.set(entry.fingerprint, entry);
        }
        if (updated.size > MAX_PUBLIC_KEYS) throw new Error(`At most ${MAX_PUBLIC_KEYS} public certificates are allowed.`);
        const exported = [...updated.values()].map((entry) => entry.armored).join("\n");
        boundedText(exported, "Combined public keyring", MAX_KEYRING_BYTES);
        assertNotAborted(signal);
        if (revision !== startRevision) throw new Error("Keyring changed while importing; result discarded. Review and retry.");
        entries = updated;
        revision++;
        return list();
      },
      exportKeys() {
        if (!entries.size) throw new Error("The public keyring is empty.");
        return [...entries.values()].map((entry) => entry.armored).join("\n");
      },
      remove(fingerprint) { revision++; return entries.delete(normalizeFingerprint(fingerprint)); },
      clear() { revision++; entries.clear(); },
    });
  }
  return Object.freeze({ config, generateCompatibilityKey, checkedPrivateDownload, parsePublicKeyring, readEncryptionRecipient, createPublicKeyring });
}

const tools = createOpenPgpKeyTools(openpgp);
export const KEY_COMPATIBILITY_CONFIG = tools.config;
export const generateCompatibilityKey = tools.generateCompatibilityKey;
export const checkedPrivateDownload = tools.checkedPrivateDownload;
export const createPublicKeyring = tools.createPublicKeyring;
export const readEncryptionRecipient = tools.readEncryptionRecipient;
