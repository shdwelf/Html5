import { createCipheriv, createDecipheriv, pbkdf2Sync } from "node:crypto";
import SevenZip from "7z-wasm";
import { describe, expect, it } from "vitest";
import { ltEncode, ltDecode } from "../tools/cryptofountain_core.mjs";
import {
  decryptVaultFileV2,
  encryptVaultFileV2,
  PBKDF2_ITERATIONS,
  VAULT_FILE_V2_MAGIC,
} from "../src/lib/vaultfile";

const VECTOR_PASSWORD = "vector-password";
const VECTOR_VALUE = { format: "hv2", ok: true };
const VECTOR_SALT = Uint8Array.from({ length: 16 }, (_, index) => index);
const VECTOR_IV = Uint8Array.from({ length: 12 }, (_, index) => index + 16);
const EXPECTED_VECTOR =
  "haiku-vault-v2.AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaG2iB6kC4Iv1ecq/ziTjLBflQQ7L68N1RWM3QLczGB33cVGwNP05wcsddxrAB+4oudnSx8vgrpwjE3ch/2w==";

function independentEncryptVector(): string {
  const json = Buffer.from(JSON.stringify(VECTOR_VALUE, null, 2), "utf8");
  const frame = Buffer.alloc(9 + json.length);
  frame.set([0x48, 0x56, 0x32, 0x00], 0);
  frame[4] = 0;
  frame.writeUInt32BE(json.length, 5);
  json.copy(frame, 9);
  const key = pbkdf2Sync(VECTOR_PASSWORD, VECTOR_SALT, PBKDF2_ITERATIONS, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, VECTOR_IV);
  const ciphertext = Buffer.concat([cipher.update(frame), cipher.final(), cipher.getAuthTag()]);
  return VAULT_FILE_V2_MAGIC + Buffer.concat([VECTOR_SALT, VECTOR_IV, ciphertext]).toString("base64");
}

function independentDecryptFrame(blob: string, password: string) {
  if (!blob.startsWith(VAULT_FILE_V2_MAGIC)) throw new Error("Not a v2 test file");
  const packed = Buffer.from(blob.slice(VAULT_FILE_V2_MAGIC.length), "base64");
  const salt = packed.subarray(0, 16);
  const iv = packed.subarray(16, 28);
  const ciphertextAndTag = packed.subarray(28);
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha256");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(ciphertextAndTag.subarray(-16));
  const frame = Buffer.concat([
    decipher.update(ciphertextAndTag.subarray(0, -16)),
    decipher.final(),
  ]);
  return {
    frame,
    codec: frame[4],
    originalLength: frame.readUInt32BE(5),
    payload: frame.subarray(9),
  };
}

function independentEncryptFrame(frame: Uint8Array, password: string): string {
  const salt = Buffer.from(Array.from({ length: 16 }, (_, index) => 0x40 + index));
  const iv = Buffer.from(Array.from({ length: 12 }, (_, index) => 0x60 + index));
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(frame), cipher.final(), cipher.getAuthTag()]);
  return VAULT_FILE_V2_MAGIC + Buffer.concat([salt, iv, ciphertext]).toString("base64");
}

describe("Haiku Vault v2 authenticated frame", () => {
  it("matches an independent Node crypto expected-output vector", async () => {
    expect(independentEncryptVector()).toBe(EXPECTED_VECTOR);
    const blob = await encryptVaultFileV2(VECTOR_VALUE, VECTOR_PASSWORD, {
      compression: "none",
      salt: VECTOR_SALT,
      iv: VECTOR_IV,
    });
    expect(blob).toBe(EXPECTED_VECTOR);
    expect(await decryptVaultFileV2(blob, VECTOR_PASSWORD)).toEqual(VECTOR_VALUE);

    const { frame, codec, originalLength, payload } = independentDecryptFrame(blob, VECTOR_PASSWORD);
    expect(frame.subarray(0, 4)).toEqual(Buffer.from([0x48, 0x56, 0x32, 0x00]));
    expect(codec).toBe(0);
    expect(originalLength).toBe(payload.length);
    expect(payload.toString("utf8")).toBe(JSON.stringify(VECTOR_VALUE, null, 2));
  });

  it("rejects a wrong password and authenticated-data tampering", async () => {
    const blob = await encryptVaultFileV2([{ entry: "secret" }], "correct", { compression: "none" });
    await expect(decryptVaultFileV2(blob, "incorrect")).rejects.toThrow(/authentication failed/i);

    const packed = blob.slice(VAULT_FILE_V2_MAGIC.length);
    const position = Math.floor(packed.length / 2);
    const changed = packed.slice(0, position) + (packed[position] === "A" ? "B" : "A") + packed.slice(position + 1);
    await expect(decryptVaultFileV2(VAULT_FILE_V2_MAGIC + changed, "correct")).rejects.toThrow(/authentication failed/i);
  });

  it("keeps small payloads raw in auto mode", async () => {
    const blob = await encryptVaultFileV2({ small: true }, "pw", { compression: "auto" });
    const frame = independentDecryptFrame(blob, "pw");
    expect(frame.codec).toBe(0);
    expect(await decryptVaultFileV2(blob, "pw")).toEqual({ small: true });
  });

  it("round-trips a single-member 7z/LZMA2 payload and authenticates its length", async () => {
    const value = [{ mnemonic: "abandon ability able".repeat(300) }];
    const blob = await encryptVaultFileV2(value, "pw", { compression: "lzma2" });
    const frame = independentDecryptFrame(blob, "pw");
    expect(frame.codec).toBe(1);
    expect(frame.originalLength).toBeGreaterThan(0);
    expect(frame.payload.subarray(0, 6)).toEqual(Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]));
    expect(await decryptVaultFileV2(blob, "pw")).toEqual(value);

    const autoBlob = await encryptVaultFileV2(value, "pw", { compression: "auto" });
    expect(independentDecryptFrame(autoBlob, "pw").codec).toBe(1);
    expect(await decryptVaultFileV2(autoBlob, "pw")).toEqual(value);
  });

  it("accepts 7z/LZMA2 effort levels 0 through 9 without changing the v2 codec ID", async () => {
    const value = { rows: Array.from({ length: 160 }, (_, index) => ({
      index, sample: `reading-${index % 12}`, value: index * 17,
    })) };
    for (let level = 0; level <= 9; level++) {
      const blob = await encryptVaultFileV2(value, "pw", {
        compression: "lzma2", lzma2Level: level,
      });
      const frame = independentDecryptFrame(blob, "pw");
      expect(frame.codec).toBe(1);
      expect(frame.originalLength).toBe(Buffer.byteLength(JSON.stringify(value, null, 2)));
      expect(frame.payload.subarray(0, 6)).toEqual(Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]));
      expect(await decryptVaultFileV2(blob, "pw")).toEqual(value);
    }
  }, 15_000);

  it("uses a standard optional Delta filter before LZMA2; an independent 7z reader restores the JSON", async () => {
    const value = { readings: Array.from({ length: 256 }, (_, index) => index * 11) };
    const expectedJson = Buffer.from(JSON.stringify(value, null, 2));
    const listing: string[] = [];
    const sevenZip = await SevenZip({ print: (line) => listing.push(line), printErr: () => {} });
    sevenZip.FS.mkdir("/v2-delta");
    for (const distance of [1, 4, 256]) {
      const blob = await encryptVaultFileV2(value, "pw", {
        compression: "lzma2", lzma2Level: 9, deltaDistance: distance,
      });
      const frame = independentDecryptFrame(blob, "pw");
      expect(frame.codec).toBe(1);
      expect(frame.originalLength).toBe(expectedJson.length);
      expect(await decryptVaultFileV2(blob, "pw")).toEqual(value);
      const archivePath = `/v2-delta/d${distance}.7z`;
      const outputDir = `/v2-delta/out${distance}`;
      sevenZip.FS.mkdir(outputDir);
      sevenZip.FS.writeFile(archivePath, frame.payload);
      listing.length = 0;
      sevenZip.callMain(["l", "-slt", "-ba", archivePath]);
      expect(listing.find((line) => line.startsWith("Method = "))).toMatch(
        new RegExp(`^Method = LZMA2(?::[^ ]+)? Delta:${distance}$`),
      );
      sevenZip.callMain(["x", "-y", `-o${outputDir}`, archivePath]);
      expect(Buffer.from(sevenZip.FS.readFile(`${outputDir}/payload.json`))).toEqual(expectedJson);
    }
  });

  it("rejects invalid v2 LZMA2 and Delta settings before touching the codec", async () => {
    for (const level of [-1, 10, 2.5, NaN]) {
      await expect(encryptVaultFileV2({}, "pw", { compression: "lzma2", lzma2Level: level }))
        .rejects.toThrow(/level must be an integer from 0 through 9/);
    }
    for (const distance of [0, 257, 1.25, NaN]) {
      await expect(encryptVaultFileV2({}, "pw", { compression: "lzma2", deltaDistance: distance }))
        .rejects.toThrow(/Delta distance must be an integer from 1 through 256/);
    }
    for (const options of [{ compression: "none" as const, deltaDistance: 1 },
      { compression: "none" as const, lzma2Level: 0 }]) {
      await expect(encryptVaultFileV2({}, "pw", options))
        .rejects.toThrow(/raw JSON mode cannot use LZMA2 or Delta options/);
    }
    const autoSmall = await encryptVaultFileV2({ small: true }, "pw", {
      compression: "auto", lzma2Level: 9, deltaDistance: 4,
    });
    expect(independentDecryptFrame(autoSmall, "pw").codec).toBe(0);
    expect(await decryptVaultFileV2(autoSmall, "pw")).toEqual({ small: true });
  });

  it("can recover an encrypted v2 file with existing LT packets outside the frame", async () => {
    const value = { notes: "synthetic vault transport sample".repeat(120) };
    const blob = await encryptVaultFileV2(value, "pw", {
      compression: "lzma2", lzma2Level: 9, deltaDistance: 4,
    });
    const blockSize = 128;
    const sourceBlocks = Math.ceil(Buffer.byteLength(blob) / blockSize);
    const encoded = ltEncode(blob, blockSize, sourceBlocks * 8, 20261113);
    const delivered = encoded.packets.filter((_, index) => index % 4 !== 0); // lose 25% in transit
    const recovered = ltDecode(delivered, encoded.numBlocks, blockSize);
    expect(recovered.success).toBe(true);
    expect(recovered.text).toBe(blob);
    expect(await decryptVaultFileV2(recovered.text, "pw")).toEqual(value);
    // LT is an outer erasure-recovery step; GCM still authenticates the vault.
    const changed = recovered.text.replace(/.$/, (last: string) => last === "A" ? "B" : "A");
    await expect(decryptVaultFileV2(changed, "pw")).rejects.toThrow();
  });

  it("rejects a validly authenticated 7z archive with a different method under codec 1", async () => {
    const sevenZip = await SevenZip({ print: () => {}, printErr: () => {} });
    sevenZip.FS.mkdir("/v2-wrong-method");
    const json = Buffer.from(JSON.stringify({ safe: true }), "utf8");
    sevenZip.FS.writeFile("/v2-wrong-method/payload.json", json);
    sevenZip.callMain(["a", "-t7z", "-m0=Copy", "-mx=0", "-mmt=1",
      "-bd", "/v2-wrong-method/payload.7z", "/v2-wrong-method/payload.json"]);
    const archive = sevenZip.FS.readFile("/v2-wrong-method/payload.7z");
    const frame = Buffer.alloc(9 + archive.length);
    frame.set([0x48, 0x56, 0x32, 0x00], 0);
    frame[4] = 1;
    frame.writeUInt32BE(json.length, 5);
    Buffer.from(archive).copy(frame, 9);
    await expect(decryptVaultFileV2(independentEncryptFrame(frame, "pw"), "pw"))
      .rejects.toThrow(/Invalid 7z\/LZMA2 payload/);
  });

  it("rejects a validly authenticated multi-member 7z archive before extraction", async () => {
    const sevenZip = await SevenZip({ print: () => {}, printErr: () => {} });
    sevenZip.FS.mkdir("/v2-adversarial");
    const payloadJson = Buffer.from(JSON.stringify({ safe: true }), "utf8");
    sevenZip.FS.writeFile("/v2-adversarial/payload.json", payloadJson);
    sevenZip.FS.writeFile("/v2-adversarial/extra.txt", Buffer.from("not allowed"));
    sevenZip.callMain([
      "a", "-t7z", "-m0=LZMA2", "-mx=1", "-mtc=off", "-mta=off", "-mtm=off",
      "-mmt=1", "/v2-adversarial/payload.7z", "/v2-adversarial/payload.json", "/v2-adversarial/extra.txt",
    ]);
    const archive = sevenZip.FS.readFile("/v2-adversarial/payload.7z");
    const jsonLength = payloadJson.length;
    const frame = Buffer.alloc(9 + archive.length);
    frame.set([0x48, 0x56, 0x32, 0x00], 0);
    frame[4] = 1;
    frame.writeUInt32BE(jsonLength, 5);
    Buffer.from(archive).copy(frame, 9);
    const blob = independentEncryptFrame(frame, "pw");
    await expect(decryptVaultFileV2(blob, "pw")).rejects.toThrow(/exactly one member/);
  });

  it("does not dispatch v1 input as v2", async () => {
    await expect(decryptVaultFileV2("haiku-vault-v1.not-v2", "pw")).rejects.toThrow(/haiku-vault-v2/i);
  });
});
