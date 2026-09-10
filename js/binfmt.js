/**
 * Binary plumbing shared by the archive writers: CRC-32, Adler-32, a
 * stored-block zlib stream (valid DEFLATE without a compressor) and a
 * minimal PNG encoder.  Pure module: no DOM.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes, seed = 0) {
  let c = (seed ^ 0xffffffff) >>> 0;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function adler32(bytes) {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** zlib wrapper around stored DEFLATE blocks (CMF/FLG + BTYPE=00 blocks). */
export function zlibStore(data) {
  const maxBlock = 65535;
  const blocks = Math.max(1, Math.ceil(data.length / maxBlock));
  const out = new Uint8Array(2 + data.length + blocks * 5 + 4);
  const view = new DataView(out.buffer);
  let o = 0;
  out[o++] = 0x78; // CM=8, CINFO=7
  out[o++] = 0x01; // FLEVEL=0, FCHECK so (CMF*256+FLG) % 31 === 0
  for (let i = 0; i < blocks; i++) {
    const start = i * maxBlock;
    const len = Math.min(maxBlock, data.length - start);
    const last = i === blocks - 1 ? 1 : 0;
    out[o++] = last;
    view.setUint16(o, len, true);
    o += 2;
    view.setUint16(o, (~len) & 0xffff, true);
    o += 2;
    out.set(data.subarray(start, start + len), o);
    o += len;
  }
  view.setUint32(o, adler32(data), false);
  return out;
}

/** Encode an RGB (color type 2, 8-bit) PNG from an RGBA byte array. */
export function pngEncodeRGB(width, height, rgba) {
  const rowLen = 1 + width * 3;
  const raw = new Uint8Array(rowLen * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      raw[o++] = rgba[s];
      raw[o++] = rgba[s + 1];
      raw[o++] = rgba[s + 2];
    }
  }
  const chunks = [];
  const push = (type, data) => {
    const len = new Uint8Array(4);
    new DataView(len.buffer).setUint32(0, data.length, false);
    const typeBytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) typeBytes[i] = type.charCodeAt(i);
    const crcBuf = new Uint8Array(4);
    const body = new Uint8Array(4 + data.length);
    body.set(typeBytes, 0);
    body.set(data, 4);
    new DataView(crcBuf.buffer).setUint32(0, crc32(body), false);
    chunks.push(len, typeBytes, data, crcBuf);
  };
  const ihdr = new Uint8Array(13);
  const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, width, false);
  iv.setUint32(4, height, false);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  push("IHDR", ihdr);
  push("IDAT", zlibStore(raw));
  push("IEND", new Uint8Array(0));

  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let total = sig.length;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  out.set(sig, 0);
  let p = sig.length;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
