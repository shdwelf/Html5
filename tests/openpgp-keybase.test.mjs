import assert from "node:assert/strict";
import { before, test } from "node:test";
import * as pgp from "openpgp";
import { KEYBASE_ORIGIN, KEYBASE_TIMEOUT_MS, KeybaseLookupError, lookupKeybasePublicKeys as lookup, normalizeKeybaseUsername as normalize } from "../apps/openpgp-workbench/keybase.mjs";
import { MAX_KEYRING_BYTES, createPublicKeyring, parsePublicKeyring } from "../apps/openpgp-workbench/keyring.mjs";

const utf8 = new TextEncoder();
const response = (text, options = {}) => new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" }, ...options });
const code = (expected) => (error) => error instanceof KeybaseLookupError && error.code === expected;
let alice, bob, modern;
before(async () => {
  [alice, bob, modern] = await Promise.all([
    pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic Keybase A — never use" }], passphrase: "synthetic Keybase passphrase only", config: { v6Keys: false } }),
    pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic Keybase B — never use" }], config: { v6Keys: false } }),
    pgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic modern Keybase control only" }], config: { v6Keys: true } }),
  ]);
});

test("Keybase usernames are exact, bounded ASCII paths, not URLs, email, fuzzy queries or IDs", () => {
  assert.equal(normalize(" Alice_7 "), "alice_7");
  assert.equal(normalize("a_"), "a_"); // Keybase kbun permits a trailing underscore.
  assert.equal(normalize("12"), "12");
  for (const value of [null, {}, "", "a", "a".repeat(17), " ".repeat(65), "_alice", "a__b", "alice/bob", "../alice", "a%2fb", "@alice", "alice@example.org", "alice,bob", "alice bob", "a?b", "a#b", "a&b", "https://keybase.io/alice", "álîce", "Ａlice", "al\u202eice", "a\0b", "a\nb"]) {
    assert.throws(() => normalize(value), code("USERNAME"), String(value));
  }
});

test("invalid input, pre-abort, unavailable transport and invalid time limits fail before any request", async () => {
  let calls = 0;
  const fetchImpl = () => { calls++; assert.fail("must not request"); };
  for (const value of ["@alice", "https://evil.invalid", "alice,bob"]) await assert.rejects(lookup(value, { fetchImpl }), code("USERNAME"));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(lookup("alice", { fetchImpl, signal: controller.signal }), code("ABORTED"));
  await assert.rejects(lookup("alice", { fetchImpl: null }), code("UNAVAILABLE"));
  for (const timeoutMs of [0, -1, Infinity, NaN, 1.5, KEYBASE_TIMEOUT_MS + 1]) await assert.rejects(lookup("alice", { fetchImpl, timeoutMs }), RangeError);
  assert.equal(calls, 0);
});

test("lookup makes one direct credentialless, referrerless, non-cached GET and calculates public fingerprints locally", async () => {
  const calls = [];
  const result = await lookup(" ALICE ", { fetchImpl: async (...args) => { calls.push(args); return response(alice.publicKey); } });
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, `${KEYBASE_ORIGIN}/alice/pgp_keys.asc`);
  assert.deepEqual(Object.keys(options).sort(), ["cache", "credentials", "headers", "method", "mode", "redirect", "referrerPolicy", "signal"].sort());
  assert.deepEqual({ ...options, signal: null }, {
    method: "GET", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", redirect: "error",
    headers: { Accept: "application/pgp-keys, text/plain;q=0.9" }, signal: null,
  });
  assert.equal(result.username, "alice"); assert.equal(result.source, url);
  const actual = (await pgp.readKey({ armoredKey: alice.publicKey })).getFingerprint().toUpperCase();
  assert.equal(result.entries[0].fingerprint, actual);
  assert.match(result.entries[0].selfCertification, /identity NOT verified/);
  assert.equal(result.entries[0].armored, (await parsePublicKeyring(alice.publicKey))[0].armored);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.entries) && Object.isFrozen(result.entries[0]));
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE KEY|synthetic Keybase passphrase only/);
  const unrelated = createPublicKeyring(); assert.deepEqual(unrelated.list(), [], "discovery has no live keyring authority");
});

test("all certificates are previewed, including v6, rather than silently selecting the first key", async () => {
  const armors = [alice.publicKey, bob.publicKey, modern.publicKey];
  const joined = armors.join("\n");
  const bytes = await Promise.all(armors.map(async (armor) => (await pgp.readKey({ armoredKey: armor })).write()));
  const all = new Uint8Array(bytes.reduce((sum, part) => sum + part.length, 0));
  let offset = 0; for (const part of bytes) { all.set(part, offset); offset += part.length; }
  for (const text of [joined, pgp.armor(pgp.enums.armor.publicKey, all)]) {
    const result = await lookup("alice", { fetchImpl: async () => response(text) });
    assert.equal(result.entries.length, 3);
    assert.deepEqual(result.entries.map((entry) => entry.fingerprint.length), [40, 40, 64]);
    assert.match(result.entries[2].algorithm, /v6 Ed25519/);
  }
});

test("HTTP errors, partial results and unexpected redirects are not key material and are never retried", async () => {
  for (const [status, expected] of [[404, "NOT_FOUND"], [429, "RATE_LIMIT"], [500, "RESPONSE"], [206, "RESPONSE"]]) {
    let calls = 0;
    await assert.rejects(lookup("alice", { fetchImpl: async () => { calls++; return response("untrusted server detail <script>secret</script>", { status }); } }), (error) => {
      assert.ok(code(expected)(error)); assert.doesNotMatch(error.message, /untrusted|<script>|secret/); return true;
    });
    assert.equal(calls, 1);
  }
  for (const patch of [{ redirected: true }, { url: "https://other.invalid/alice/pgp_keys.asc" }, { url: `${KEYBASE_ORIGIN}/bob/pgp_keys.asc` }]) {
    const remote = response(alice.publicKey); for (const [key, value] of Object.entries(patch)) Object.defineProperty(remote, key, { value });
    await assert.rejects(lookup("alice", { fetchImpl: async () => remote }), code("RESPONSE"));
  }
  await assert.rejects(lookup("alice", { fetchImpl: async () => { throw new TypeError("Failed to fetch untrusted URL"); } }), code("NETWORK"));
});

test("the whole response is refused for private, disguised-secret, mixed, junk or truncated armor", async () => {
  for (const text of ["", "<html>not a key</html>", alice.privateKey, alice.privateKey.replaceAll("PRIVATE KEY BLOCK", "PUBLIC KEY BLOCK"), alice.publicKey + alice.privateKey, alice.publicKey + "trailer", alice.publicKey + "\n-----BEGIN PGP PUBLIC KEY BLOCK-----\n"]) {
    await assert.rejects(lookup("alice", { fetchImpl: async () => response(text) }), code("CERTIFICATE"));
  }
});

test("the existing 32-certificate and packet-policy limits apply to the entire remote file", async () => {
  const maximum = Array(32).fill(alice.publicKey).join("\n");
  assert.equal((await lookup("alice", { fetchImpl: async () => response(maximum) })).entries.length, 32);
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(maximum + alice.publicKey) }), code("CERTIFICATE"));
  class UnknownPacket { static tag = 61; write() { return new Uint8Array(); } }
  const packets = (await pgp.readKey({ armoredKey: alice.publicKey })).toPacketList(); packets.push(new UnknownPacket());
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(pgp.armor(pgp.enums.armor.publicKey, packets.write())) }), code("CERTIFICATE"));
});

test("expired remote certificates remain explicitly archival-only without an encryption recipient", async () => {
  const old = await pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic expired Keybase control" }], date: new Date("2000-01-01T00:00:00Z"), keyExpirationTime: 60, config: { v6Keys: false } });
  const preview = await lookup("alice", { fetchImpl: async () => response(old.publicKey) });
  assert.match(preview.entries[0].selfCertification, /unusable:.*archival export only/);
  assert.equal(preview.entries[0].encryptionFingerprint, null);
});

test("streaming byte limits do not trust Content-Length or use unbounded text reads", async () => {
  let reads = 0;
  await assert.rejects(lookup("alice", { fetchImpl: async () => ({ status: 200, headers: new Headers({ "content-length": String(MAX_KEYRING_BYTES + 1) }), body: { getReader() { reads++; assert.fail("oversized header must fail before reading"); } } }) }), code("SIZE"));
  assert.equal(reads, 0);
  let canceled = 0;
  const body = new ReadableStream({ start(controller) { controller.enqueue(utf8.encode(alice.publicKey)); controller.enqueue(new Uint8Array(MAX_KEYRING_BYTES)); }, cancel() { canceled++; } });
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(body, { headers: { "content-length": "1" } }) }), code("SIZE"));
  assert.equal(canceled, 1);
  const exactly = alice.publicKey.padEnd(MAX_KEYRING_BYTES, " ");
  assert.equal((await lookup("alice", { fetchImpl: async () => response(exactly) })).entries.length, 1);
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(exactly + " ") }), code("SIZE"));
  const multibyte = "é".repeat(MAX_KEYRING_BYTES / 2 + 1);
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(multibyte) }), code("SIZE"));
  await assert.rejects(lookup("alice", { fetchImpl: async () => ({ status: 200, headers: new Headers(), text: () => assert.fail("no unbounded fallback") }) }), code("UNAVAILABLE"));
});

test("invalid UTF-8, failed streams and stalled requests fail safely", async () => {
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(Uint8Array.of(0xc3, 0x28)) }), code("ENCODING"));
  await assert.rejects(lookup("alice", { fetchImpl: async () => response(new ReadableStream({ start(controller) { controller.error(new Error("synthetic transport failure")); } })) }), code("NETWORK"));
  let signal, calls = 0;
  await assert.rejects(lookup("alice", { timeoutMs: 10, fetchImpl: (_url, options) => { calls++; signal = options.signal; return new Promise(() => {}); } }), code("TIMEOUT"));
  assert.equal(signal.aborted, true); assert.equal(calls, 1);
  let canceled = 0;
  await assert.rejects(lookup("alice", { timeoutMs: 10, fetchImpl: async () => response(new ReadableStream({ cancel() { canceled++; } })) }), code("TIMEOUT"));
  assert.equal(canceled, 1);
});

test("cancellation aborts transport and suppresses late responses, including a transport ignoring AbortSignal", async () => {
  const controller = new AbortController(); let finish, signal;
  const result = lookup("alice", { signal: controller.signal, fetchImpl: (_url, options) => { signal = options.signal; return new Promise((resolve) => { finish = resolve; }); } });
  controller.abort(); await assert.rejects(result, code("ABORTED")); assert.equal(signal.aborted, true);
  finish(response(alice.publicKey));
  const synchronous = new AbortController();
  await assert.rejects(lookup("alice", { signal: synchronous.signal, fetchImpl: () => { synchronous.abort(); return Promise.reject(new Error("late synthetic transport error")); } }), code("ABORTED"));
});
