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

/** Public v4/v6 identities only; secret RSA export still uses normalizeFingerprint. */
export function normalizePublicFingerprint(value) {
  boundedText(value, "Fingerprint", 128);
  const fingerprint = value.replace(/[ \t\r\n]/g, "").toUpperCase();
  if (!/^(?:[0-9A-F]{40}|[0-9A-F]{64})$/.test(fingerprint)) throw new Error("Enter the full 40-hex v4 or 64-hex v6 fingerprint, not a key ID.");
  return fingerprint;
}
export function formatFingerprint(value) {
  return normalizePublicFingerprint(value).match(/.{4}/g).join(" ");
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

  // Public import is separate from conservative v4 RSA generation/private
  // export. The modern v6 profile is Ed25519/X25519 only, never a downgrade.
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
    if (key.keyPacket.version === 6 && key.getAlgorithmInfo().algorithm === "ed25519" &&
        parts.every((part) => part.keyPacket.version === 6 && ["ed25519", "x25519"].includes(part.getAlgorithmInfo().algorithm))) {
      return "v6 Ed25519 / X25519 (modern clients required)";
    }
    throw new Error("Public imports accept only v4 RSA (2048–16384 bits), v4 legacy Ed25519/Curve25519, or v6 Ed25519/X25519 certificates. Other profiles need a separate compatibility review.");
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

  async function readPublicBlocks(armored) {
    boundedText(armored, "Public keyring", MAX_KEYRING_BYTES);
    // readKeys understands multiple certificates IN one armor block. Split
    // concatenated blocks as well; a single readKeys call can stop at block 1.
    const begin = "-----BEGIN PGP PUBLIC KEY BLOCK-----", end = "-----END PGP PUBLIC KEY BLOCK-----";
    let cursor = 0;
    const blocks = [];
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
      blocks.push({ data, armored: armored.slice(start, cursor) });
      if (blocks.length > MAX_PUBLIC_KEYS) throw new Error(`At most ${MAX_PUBLIC_KEYS} public certificates are allowed.`);
    }
    if (!blocks.length || armored.slice(cursor).trim()) throw new Error("Public keyrings only: provide complete ASCII-armored public certificates without extra text.");
    return blocks;
  }

  async function parsePublicKeyring(armored) {
    const keys = [];
    for (const { data } of await readPublicBlocks(armored)) {
      // Preflight EVERY packet, not just the high-level readKeys slicer.
      // No automatic stripping of unsupported algorithms, secrets or messages.
      let packets;
      try { packets = await library.PacketList.fromBinary(data, allowedPublicPackets, config); }
      catch (error) {
        if (error.name === "UnsupportedError") throw new Error("Unsupported public packet or subkey algorithm. Nothing was imported. For a v6 certificate, an explicit public subset export can omit unsupported subkeys after you check the full primary fingerprint; the original must be kept.");
        throw error;
      }
      // Unknown non-critical packets are retained even with strict parsing.
      if (packets.length > 2048 || packets[0]?.constructor.tag !== library.enums.packet.publicKey ||
        !packets.every((packet) => Object.hasOwn(allowedPublicPackets, packet.constructor.tag))) throw new Error("Invalid, unsupported or excessively complex public keyring.");
      keys.push(...await library.readKeys({ binaryKeys: data, config }));
      if (keys.length > MAX_PUBLIC_KEYS) throw new Error(`At most ${MAX_PUBLIC_KEYS} public certificates are allowed.`);
    }
    const entries = [];
    for (const key of keys) {
      if (key.isPrivate()) throw new Error("Secret packets are never accepted into the public keyring.");
      const algorithm = publicProfile(key);
      if (key.getKeys().length > 16 || key.users.length > 32) throw new Error("Certificate has too many subkeys or User IDs for this workbench.");
      let selfCertification = "valid at import time; identity NOT verified";
      try { await key.verifyPrimaryKey(undefined, undefined, config); }
      catch { selfCertification = "unusable: revoked, expired or invalid self-certification; archival export only"; }
      let encryptionFingerprint = null;
      if (!selfCertification.startsWith("unusable:")) {
        try { encryptionFingerprint = normalizePublicFingerprint((await key.getEncryptionKey(undefined, undefined, undefined, config)).getFingerprint()); }
        catch { /* A signing/authentication-only key is not an encryption key. */ }
      }
      const userIDs = key.getUserIDs().map((uid) => boundedText(uid, "User ID", 2048));
      entries.push(Object.freeze({
        fingerprint: normalizePublicFingerprint(key.getFingerprint()),
        keyVersion: key.keyPacket.version,
        subkeyCount: key.subkeys.length,
        encryptionFingerprint,
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
  async function readEncryptionRecipient(armored, expectedFingerprint, { profile = "classic-v4", encryptionFingerprint = "" } = {}) {
    if (!["classic-v4", "modern-v6"].includes(profile)) throw new Error("Choose an explicit classic-v4 or modern-v6 recipient profile.");
    const expected = normalizePublicFingerprint(expectedFingerprint);
    const entries = await parsePublicKeyring(armored);
    if (entries.length !== 1 || entries[0].fingerprint !== expected) {
      throw new Error("Recipient fingerprint mismatch, or multiple certificates supplied. Encryption refused.");
    }
    const key = await library.readKey({ armoredKey: entries[0].armored, config });
    if (key.keyPacket.version !== (profile === "modern-v6" ? 6 : 4)) throw new Error("Recipient version does not match the explicit backup profile; v6 needs modern-v6, not a v4 downgrade.");
    await key.verifyPrimaryKey(undefined, undefined, config);
    const selectedFingerprint = encryptionFingerprint ? normalizePublicFingerprint(encryptionFingerprint) : null;
    const selected = selectedFingerprint ? key.getKeys().find((part) => normalizePublicFingerprint(part.getFingerprint()) === selectedFingerprint) : null;
    if (selectedFingerprint && !selected) throw new Error("Selected encryption fingerprint is not in this certificate.");
    const encryptionKey = await key.getEncryptionKey(selected?.getKeyID(), undefined, undefined, config);
    const actualEncryptionFingerprint = normalizePublicFingerprint(encryptionKey.getFingerprint());
    if (selectedFingerprint && actualEncryptionFingerprint !== selectedFingerprint) throw new Error("Selected subkey is not a currently usable bound encryption key.");
    return Object.freeze({
      key, encryptionKey, profile,
      fingerprint: expected,
      encryptionFingerprint: actualEncryptionFingerprint,
      encryptionKeyID: encryptionKey.getKeyID().toHex().toUpperCase(),
      algorithm: entries[0].algorithm,
    });
  }

  /**
   * Explicit public-only troubleshooting export. Unlike imports, this may
   * omit unsupported v6 PUBLIC subkey blocks (and only their signatures).
   * The original armor is retained byte-for-byte; nothing is silently fixed,
   * signed, revoked, converted to v4, or called cryptographically invalid.
   */
  async function publicCertificateVariants(armored, expectedFingerprint, options = {}) {
    const expected = normalizePublicFingerprint(expectedFingerprint);
    const blocks = await readPublicBlocks(armored);
    if (blocks.length !== 1) throw new Error("Exactly one public certificate is required for an explicit subset export.");
    // This one explicit reduction path may retain UnsupportedError packets as
    // raw PUBLIC packets for inspection, but malformed packets still fail.
    const packets = await library.PacketList.fromBinary(blocks[0].data, allowedPublicPackets, { ...config, ignoreUnsupportedPackets: true });
    if (packets.length > 2048 || packets[0]?.constructor.tag !== library.enums.packet.publicKey ||
        packets.filter((packet) => packet.constructor.tag === library.enums.packet.publicKey).length !== 1) throw new Error("Expected one bounded public certificate, not a bundle.");
    const supported = new library.PacketList(), unsupportedSubkeys = [];
    let omitting = false, sawSubkey = false, subkeys = 0, users = 0;
    for (const [index, packet] of packets.entries()) {
      const tag = packet.constructor.tag ?? packet.tag;
      if (!Object.hasOwn(allowedPublicPackets, tag)) throw new Error("Only public key, public subkey, User ID and signature packets can be exported.");
      if (tag === library.enums.packet.publicSubkey) {
        sawSubkey = true;
        if (++subkeys > 15) throw new Error("Certificate has too many subkeys for an explicit subset export.");
        omitting = packet.constructor.tag === undefined;
        if (omitting) {
          // Unknown v6 algorithm packets can be omitted, never salvaged as
          // encryption keys. Other versions/structures need separate review.
          if (packets[0].version !== 6 || packet.rawContent?.[0] !== 6) throw new Error("Only unsupported v6 public subkeys may be omitted explicitly.");
          unsupportedSubkeys.push(Object.freeze({ packet: index, version: 6, algorithm: packet.rawContent[5] }));
        }
      } else if (tag === library.enums.packet.userID) {
        if (sawSubkey || ++users > 32) throw new Error("Unsupported public certificate ordering or too many User IDs.");
      } else if (tag === library.enums.packet.publicKey && index !== 0) {
        throw new Error("Multiple public certificates cannot be reduced together.");
      }
      if (omitting && tag === library.enums.packet.publicSubkey) continue;
      if (omitting && tag === library.enums.packet.signature) {
        const signatureType = packet.signatureType ?? (packet.rawContent?.[0] === 6 ? packet.rawContent[1] : undefined);
        if ([library.enums.signature.subkeyBinding, library.enums.signature.subkeyRevocation].includes(signatureType)) continue;
        // A primary revocation/direct signature is global even if placed
        // after an omitted subkey. NEVER discard it based on position. An
        // unparseable global or ambiguous User ID signature must fail closed.
        if (packet.constructor.tag === undefined || ![library.enums.signature.keyRevocation, library.enums.signature.key].includes(signatureType)) {
          throw new Error("Cannot omit an unsupported or ambiguously placed global/User ID signature.");
        }
      }
      if (packet.constructor.tag === undefined) throw new Error("An unsupported packet outside an omitted public subkey block cannot be exported as a subset.");
      supported.push(packet);
    }
    // Reparse the supported-only packet serialization with ALL strict gates
    // on, checking the exact primary and a current bound encryption key.
    const recipient = await readEncryptionRecipient(library.armor(library.enums.armor.publicKey, supported.write()), expected, options);
    const reducedKey = recipient.key;
    const removedSubkeyFingerprints = reducedKey.subkeys
      .filter((part) => normalizePublicFingerprint(part.getFingerprint()) !== recipient.encryptionFingerprint)
      .map((part) => normalizePublicFingerprint(part.getFingerprint()));
    reducedKey.subkeys = reducedKey.subkeys.filter((part) => normalizePublicFingerprint(part.getFingerprint()) === recipient.encryptionFingerprint);
    const reduced = reducedKey.armor(config);
    const checked = await readEncryptionRecipient(reduced, recipient.fingerprint, {
      profile: recipient.profile, encryptionFingerprint: recipient.encryptionFingerprint,
    });
    if (checked.key.keyPacket.version !== recipient.key.keyPacket.version ||
        checked.key.subkeys.length !== (recipient.encryptionFingerprint === recipient.fingerprint ? 0 : 1)) throw new Error("Reduced certificate postcondition failed.");
    return Object.freeze({ full: armored, reduced, fingerprint: recipient.fingerprint,
      encryptionFingerprint: recipient.encryptionFingerprint, keyVersion: recipient.key.keyPacket.version,
      profile: recipient.profile, removedSubkeyFingerprints: Object.freeze(removedSubkeyFingerprints),
      unsupportedSubkeys: Object.freeze(unsupportedSubkeys) });
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
        const expected = expectedFingerprint ? normalizePublicFingerprint(expectedFingerprint) : null;
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
      exportCertificate(fingerprint) {
        const entry = entries.get(normalizePublicFingerprint(fingerprint));
        if (!entry) throw new Error("Public certificate is not in this keyring.");
        return entry.armored;
      },
      remove(fingerprint) { revision++; return entries.delete(normalizePublicFingerprint(fingerprint)); },
      clear() { revision++; entries.clear(); },
    });
  }
  return Object.freeze({ config, generateCompatibilityKey, checkedPrivateDownload, parsePublicKeyring, readEncryptionRecipient, publicCertificateVariants, createPublicKeyring });
}

const tools = createOpenPgpKeyTools(openpgp);
export const KEY_COMPATIBILITY_CONFIG = tools.config;
export const generateCompatibilityKey = tools.generateCompatibilityKey;
export const checkedPrivateDownload = tools.checkedPrivateDownload;
export const createPublicKeyring = tools.createPublicKeyring;
export const parsePublicKeyring = tools.parsePublicKeyring; // Read-only public preview; never assigns trust or changes a ring.
export const readEncryptionRecipient = tools.readEncryptionRecipient;

export const publicCertificateVariants = tools.publicCertificateVariants;
