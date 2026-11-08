#!/usr/bin/env node
/**
 * tools/cryptofountain_core.mjs
 *
 * Standalone Node.js ES Module extracting the mathematical primitives from
 * CryptoFountain BBS (`apps/cryptofountain-bbs.html` / `resources/src-39-cryptofountain-bbs.md`):
 *  1. Adler-32 checksum (modulo 65521)
 *  2. Fletcher-16 checksum (modulo 255)
 *  3. Double FNV-1a 64-bit hash
 *  4. Galois GF(2^8) integrity codes (AES polynomial 0x11d / 29)
 *  5. Linear Congruential PRNG (LCG, glibc parameters)
 *  6. Luby Transform (LT) Rateless Erasure Coding with Robust Soliton Distribution
 *  7. Belief Propagation (Peeling Decoder) for LT Packets
 *  8. Raptor / PAR Recovery Volume generator (combining Source + Recovery XOR blocks)
 *  9. Rolling Hash & Block Matching (Rsync-style delta encoding & reconstruction)
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBytes(strOrBytes) {
  if (typeof strOrBytes === 'string') return encoder.encode(strOrBytes);
  if (strOrBytes instanceof Uint8Array) return strOrBytes;
  return new Uint8Array(strOrBytes);
}

export function toText(bytes) {
  return decoder.decode(bytes);
}

export function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex) {
  const clean = hex.replace(/\s+/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return out;
}

/** 1. Adler-32 */
export function adler32(buf) {
  const bytes = toBytes(buf);
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** 2. Fletcher-16 */
export function fletcher16(buf) {
  const bytes = toBytes(buf);
  let c0 = 0, c1 = 0;
  for (let i = 0; i < bytes.length; i++) {
    c0 = (c0 + bytes[i]) % 255;
    c1 = (c1 + c0) % 255;
  }
  return ((c1 << 8) | c0) & 0xffff;
}

/** 3. 64-bit Dual FNV-1a */
export function fnv1a64(buf) {
  const bytes = toBytes(buf);
  let h1 = 2166136261, h2 = 3238371032;
  for (let i = 0; i < bytes.length; i++) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 16777619);
    h2 ^= bytes[i];
    h2 = Math.imul(h2, 16777619) ^ (h1 >>> 16);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/** 4. Galois GF(2^8) multiplication with reduction mod x^8 + x^4 + x^3 + x + 1 (0x11d) */
export function gfMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1d; // 29 decimal
    b >>= 1;
  }
  return p;
}

export function galoisIntegrity(buf) {
  const bytes = toBytes(buf);
  let h = 0;
  for (let i = 0; i < bytes.length; i++) {
    h = gfMul(h ^ bytes[i], 3);
  }
  return h;
}

/** 5. Linear Congruential PRNG (glibc / Numerical Recipes) */
export class LcgPRNG {
  constructor(seed = 42) {
    this.s = seed | 0;
  }
  next() {
    this.s = (Math.imul(this.s, 1103515245) + 12345) & 0x7fffffff;
    return this.s / 2147483647;
  }
  nextInt(max) {
    return Math.floor(this.next() * max);
  }
}

/** 6. Robust Soliton CDF for Luby Transform */
export function robustSolitonCDF(K, c = 0.1, delta = 0.5) {
  if (K <= 0) return [1];
  const R = Math.max(1, c * Math.log(K / delta) * Math.sqrt(K));
  const pivot = Math.max(1, Math.floor(K / R));

  // Ideal Soliton
  const rho = new Array(K);
  rho[0] = 1 / K;
  for (let i = 1; i < K; i++) {
    rho[i] = 1 / ((i + 1) * i);
  }

  // Tau
  const tau = new Array(K).fill(0);
  for (let i = 0; i < Math.min(pivot - 1, K); i++) {
    tau[i] = R / ((i + 1) * K);
  }
  if (pivot - 1 < K) {
    tau[pivot - 1] = (R * Math.log(R / delta)) / K;
  }

  // Mu = rho + tau, normalized
  let sum = 0;
  for (let i = 0; i < K; i++) {
    rho[i] += tau[i];
    sum += rho[i];
  }

  const cdf = [];
  let cum = 0;
  for (let i = 0; i < K; i++) {
    cum += rho[i] / sum;
    cdf.push(Math.min(cum, 1.0));
  }
  return cdf;
}

export function sampleDegree(cdf, prng) {
  const u = prng.next();
  for (let i = 0; i < cdf.length; i++) {
    if (u <= cdf[i]) return i + 1;
  }
  return cdf.length;
}

/** 6. LT Fountain Encoder */
export function ltEncode(data, blockSize = 32, numPackets = 20, seed = 42) {
  const bytes = toBytes(data);
  const K = Math.max(1, Math.ceil(bytes.length / blockSize));
  const blocks = [];

  for (let i = 0; i < K; i++) {
    const b = new Uint8Array(blockSize);
    const offset = i * blockSize;
    b.set(bytes.slice(offset, Math.min(offset + blockSize, bytes.length)));
    blocks.push(b);
  }

  const cdf = robustSolitonCDF(K);
  const prng = new LcgPRNG(seed);
  const packets = [];

  for (let p = 0; p < numPackets; p++) {
    const deg = Math.min(sampleDegree(cdf, prng), K);
    const chosen = new Set();
    while (chosen.size < deg) {
      chosen.add(prng.nextInt(K));
    }
    const sourceIndices = Array.from(chosen).sort((a, b) => a - b);
    const payload = new Uint8Array(blockSize);
    for (const idx of sourceIndices) {
      for (let b = 0; b < blockSize; b++) {
        payload[b] ^= blocks[idx][b];
      }
    }
    packets.push({
      id: p,
      degree: deg,
      sourceIndices,
      data: Array.from(payload),
      blockSize
    });
  }

  return { packets, numBlocks: K, blockSize };
}

/** 7. LT Fountain Decoder (Peeling / Belief Propagation) */
export function ltDecode(packets, numBlocks, blockSize) {
  const recovered = new Array(numBlocks).fill(null);
  let count = 0;

  const queue = packets.map(p => ({
    ...p,
    sourceIndices: [...p.sourceIndices],
    data: new Uint8Array(p.data)
  }));

  let changed = true;
  while (changed && count < numBlocks) {
    changed = false;
    for (const pkt of queue) {
      if (pkt.sourceIndices.length !== 1) continue;
      const srcIdx = pkt.sourceIndices[0];
      if (!recovered[srcIdx]) {
        recovered[srcIdx] = new Uint8Array(pkt.data);
        count++;
        changed = true;

        // Peel this block from all remaining packets
        for (const other of queue) {
          if (other === pkt) continue;
          const pos = other.sourceIndices.indexOf(srcIdx);
          if (pos !== -1) {
            other.sourceIndices.splice(pos, 1);
            for (let b = 0; b < blockSize; b++) {
              other.data[b] ^= recovered[srcIdx][b];
            }
          }
        }
      }
    }
  }

  if (count === numBlocks) {
    const full = new Uint8Array(numBlocks * blockSize);
    for (let i = 0; i < numBlocks; i++) {
      full.set(recovered[i], i * blockSize);
    }
    let end = full.length;
    while (end > 0 && full[end - 1] === 0) end--;
    return {
      success: true,
      data: full.slice(0, end),
      text: toText(full.slice(0, end)),
      recoveredCount: count
    };
  }

  return {
    success: false,
    data: null,
    text: null,
    recoveredCount: count
  };
}

/** 8. Raptor / PAR Recovery Volume Stream Generator */
export function generateRaptorRecovery(data, blockSize = 32, recoveryCount = 6, seed = 54321) {
  const bytes = toBytes(data);
  const K = Math.max(1, Math.ceil(bytes.length / blockSize));
  const blocks = [];

  for (let i = 0; i < K; i++) {
    const b = new Uint8Array(blockSize);
    const offset = i * blockSize;
    b.set(bytes.slice(offset, Math.min(offset + blockSize, bytes.length)));
    blocks.push(b);
  }

  const result = [];
  // 1. Source packets
  for (let i = 0; i < K; i++) {
    result.push({
      id: i,
      blockIndex: i,
      data: Array.from(blocks[i]),
      fletcher16: fletcher16(blocks[i]),
      galoisIntegrity: galoisIntegrity(blocks[i]),
      isRecovery: false
    });
  }

  // 2. Recovery volumes
  const prng = new LcgPRNG(seed);
  for (let r = 0; r < recoveryCount; r++) {
    const rec = new Uint8Array(blockSize);
    const deg = 2 + prng.nextInt(Math.max(1, K - 1));
    const chosen = new Set();
    while (chosen.size < Math.min(deg, K)) {
      chosen.add(prng.nextInt(K));
    }
    for (const idx of chosen) {
      for (let b = 0; b < blockSize; b++) {
        rec[b] ^= blocks[idx][b];
      }
    }
    result.push({
      id: K + r,
      blockIndex: -1,
      data: Array.from(rec),
      fletcher16: fletcher16(rec),
      galoisIntegrity: galoisIntegrity(rec),
      isRecovery: true
    });
  }

  return result;
}

/** 9. Rsync-style Rolling Hash & Delta Sync */
export function computeBlockSignatures(data, blockSize = 64) {
  const bytes = toBytes(data);
  const blocks = [];
  for (let offset = 0; offset < bytes.length; offset += blockSize) {
    const chunk = bytes.slice(offset, Math.min(offset + blockSize, bytes.length));
    blocks.push({
      index: Math.floor(offset / blockSize),
      offset,
      length: chunk.length,
      weakHash: adler32(chunk),
      strongHash: fnv1a64(chunk)
    });
  }
  return { blockSize, totalLength: bytes.length, blocks };
}

export function computeDelta(newData, baseSignatures) {
  const bytes = toBytes(newData);
  const blockSize = baseSignatures.blockSize;
  const deltas = [];

  const sigMap = new Map();
  for (const blk of baseSignatures.blocks) {
    const list = sigMap.get(blk.weakHash) || [];
    list.push(blk);
    sigMap.set(blk.weakHash, list);
  }

  let offset = 0;
  let literalBuffer = [];

  const flushLiteral = () => {
    if (literalBuffer.length > 0) {
      deltas.push({ type: 'insert', data: toHex(new Uint8Array(literalBuffer)) });
      literalBuffer = [];
    }
  };

  while (offset < bytes.length) {
    const remain = bytes.length - offset;
    const len = Math.min(blockSize, remain);
    const window = bytes.slice(offset, offset + len);
    let matched = false;

    if (len === blockSize) {
      const weak = adler32(window);
      const candidates = sigMap.get(weak);
      if (candidates) {
        const strong = fnv1a64(window);
        for (const cand of candidates) {
          if (cand.strongHash === strong) {
            flushLiteral();
            deltas.push({ type: 'copy', blockIndex: cand.index });
            offset += blockSize;
            matched = true;
            break;
          }
        }
      }
    }

    if (!matched) {
      literalBuffer.push(bytes[offset]);
      offset++;
    }
  }

  flushLiteral();
  return deltas;
}

export function applyDelta(baseData, deltas, blockSize) {
  const baseBytes = toBytes(baseData);
  const chunks = [];

  for (const op of deltas) {
    if (op.type === 'copy') {
      const start = op.blockIndex * blockSize;
      const end = Math.min(start + blockSize, baseBytes.length);
      chunks.push(baseBytes.slice(start, end));
    } else if (op.type === 'insert') {
      chunks.push(fromHex(op.data));
    }
  }

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLen);
  let cursor = 0;
  for (const c of chunks) {
    result.set(c, cursor);
    cursor += c.length;
  }
  return toText(result);
}
