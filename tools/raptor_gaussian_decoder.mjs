/**
 * tools/raptor_gaussian_decoder.mjs
 *
 * Full Gaussian Elimination solver over GF(2) and GF(2^8) for Raptor / Parity Erasure Coding.
 */

import { gfMulFast, gfInv, gfAdd } from "./gf256.mjs";

export function solveGF2(equations, K, blockSize) {
  const M = equations.length;
  if (M < K) return null;

  const rows = equations.map(eq => ({
    mask: eq.mask,
    data: new Uint8Array(eq.data)
  }));

  const pivotRowForCol = new Array(K).fill(-1);
  let currentRow = 0;

  for (let col = 0; col < K && currentRow < M; col++) {
    const colBit = 1n << BigInt(col);

    let pivot = -1;
    for (let r = currentRow; r < M; r++) {
      if ((rows[r].mask & colBit) !== 0n) {
        pivot = r;
        break;
      }
    }

    if (pivot === -1) {
      continue;
    }

    const tmp = rows[currentRow];
    rows[currentRow] = rows[pivot];
    rows[pivot] = tmp;

    pivotRowForCol[col] = currentRow;

    for (let r = 0; r < M; r++) {
      if (r !== currentRow && (rows[r].mask & colBit) !== 0n) {
        rows[r].mask ^= rows[currentRow].mask;
        for (let b = 0; b < blockSize; b++) {
          rows[r].data[b] ^= rows[currentRow].data[b];
        }
      }
    }

    currentRow++;
  }

  const solved = new Array(K);
  for (let col = 0; col < K; col++) {
    const r = pivotRowForCol[col];
    if (r === -1) {
      return null;
    }
    const expected = 1n << BigInt(col);
    if (rows[r].mask !== expected) {
      return null;
    }
    solved[col] = rows[r].data;
  }

  return solved;
}

export function hybridRaptorDecode(packets, numBlocks, blockSize) {
  const recovered = new Array(numBlocks).fill(null);
  let recoveredCount = 0;

  const pool = packets.map(p => {
    let mask = 0n;
    for (const idx of p.sourceIndices) {
      mask |= (1n << BigInt(idx));
    }
    return {
      mask,
      data: new Uint8Array(p.data),
      degree: p.sourceIndices.length
    };
  });

  // Phase 1: Fast Peeling
  let changed = true;
  while (changed && recoveredCount < numBlocks) {
    changed = false;
    for (const pkt of pool) {
      if (pkt.degree === 1) {
        let idx = -1;
        for (let i = 0; i < numBlocks; i++) {
          if ((pkt.mask & (1n << BigInt(i))) !== 0n) {
            idx = i;
            break;
          }
        }

        if (idx !== -1 && !recovered[idx]) {
          recovered[idx] = new Uint8Array(pkt.data);
          recoveredCount++;
          changed = true;

          const bit = 1n << BigInt(idx);
          for (const other of pool) {
            if ((other.mask & bit) !== 0n) {
              other.mask ^= bit;
              other.degree--;
              for (let b = 0; b < blockSize; b++) {
                other.data[b] ^= recovered[idx][b];
              }
            }
          }
        }
      }
    }
  }

  if (recoveredCount === numBlocks) {
    return { success: true, blocks: recovered, method: "peeling" };
  }

  // Phase 2: Inactivation / Gaussian Elimination on Residual Graph
  const unsolvedIndices = [];
  for (let i = 0; i < numBlocks; i++) {
    if (!recovered[i]) unsolvedIndices.push(i);
  }

  const subK = unsolvedIndices.length;
  const subEquations = [];

  for (const pkt of pool) {
    if (pkt.mask !== 0n) {
      let subMask = 0n;
      for (let i = 0; i < subK; i++) {
        const origIdx = unsolvedIndices[i];
        if ((pkt.mask & (1n << BigInt(origIdx))) !== 0n) {
          subMask |= (1n << BigInt(i));
        }
      }
      if (subMask !== 0n) {
        subEquations.push({ mask: subMask, data: pkt.data });
      }
    }
  }

  const subSolved = solveGF2(subEquations, subK, blockSize);
  if (!subSolved) {
    return { success: false, blocks: recovered, recoveredCount, method: "stalled" };
  }

  for (let i = 0; i < subK; i++) {
    recovered[unsolvedIndices[i]] = subSolved[i];
    recoveredCount++;
  }

  return { success: true, blocks: recovered, method: "hybrid-gaussian" };
}
