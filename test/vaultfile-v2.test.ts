import { createCipheriv, createDecipheriv, pbkdf2Sync } from "node:crypto";
import SevenZip from "7z-wasm";
import { describe, expect, it } from "vitest";
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
