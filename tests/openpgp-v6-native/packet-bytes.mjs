/** Test-only materialization. OpenPGP.js Message.write() can return a lazy
 * ArrayStream with length zero; iterating it as a plain array loses the data.
 * Drain its reader completely so negative crypto controls get the intended
 * packet mutation, not an accidentally empty/truncated fixture.
 */
import assert from "node:assert/strict";

export async function serializeMessage(message) {
  const source = message.write();
  if (source instanceof Uint8Array) {
    assert.ok(source.length > 0 && source.length <= 4 * 1024 * 1024, "synthetic packet serialization is nonempty and bounded");
    return source;
  }
  assert.equal(typeof source.getReader, "function", "serialized packets need a byte stream reader");
  const reader = source.getReader(), chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      assert.ok(value instanceof Uint8Array, "each serialized packet chunk must be bytes");
      bytes += value.length;
      assert.ok(bytes <= 4 * 1024 * 1024, "synthetic packet serialization is bounded");
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock?.(); }
  assert.ok(bytes > 0, "a negative control must not accidentally become an empty fixture");
  return Uint8Array.from(Buffer.concat(chunks));
}
