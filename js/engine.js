const OFFSETS = {
  words: 0,
  indices: 65536,
  path: 69632,
  field: 131072,
  seed: 200000,
};

export async function loadEngine(url = "./wasm/entropy.wasm") {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(buf);
  return wrap(instance.exports);
}

function wrap(ex) {
  const mem = () => ex.memory.buffer;

  function scatterWords(n = 2048) {
    ex.scatterWords(n);
    return new Float32Array(mem(), OFFSETS.words, n * 3).slice();
  }

  function phrasePath(indices) {
    const view = new Int32Array(mem(), OFFSETS.indices, indices.length);
    indices.forEach((v, i) => {
      view[i] = v < 0 ? 0 : v;
    });
    const ptr = ex.phrasePath(indices.length);
    return new Float32Array(mem(), ptr, indices.length * 3).slice();
  }

  function entropyField(seedBytes, count = 4096) {
    const seed = new Uint8Array(mem(), OFFSETS.seed, seedBytes.length);
    seed.set(seedBytes);
    const ptr = ex.entropyField(OFFSETS.seed, seedBytes.length, count);
    return new Float32Array(mem(), ptr, count * 3).slice();
  }

  function mix(a, b) {
    return ex.mix(a >>> 0, b >>> 0) >>> 0;
  }

  return { scatterWords, phrasePath, entropyField, mix, raw: ex };
}
