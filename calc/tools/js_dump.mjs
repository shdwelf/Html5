/* Mirror of `sitek-host dump <dev>` using the transpiled core.
   tools/difftest.py diffs this against the C build, which is how we know the
   browser is running the same maths as the calculators and not a re-implementation.
   Usage: node tools/js_dump.mjs <path-to-core.mjs> <dev>
*/
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [corePath, devName] = process.argv.slice(2);
const C = await import(pathToFileURL(corePath).href);

const DIMS = {
  ti83: [0, 96, 64],
  ti85: [1, 128, 64],
  ti89: [2, 160, 100],
  ti90: [3, 96, 64],
  ti92: [4, 240, 128],
  host: [5, 160, 100],
};
const DEV_NAMES = ["ti83", "ti85", "ti89", "ti90", "ti92", "host"];

const [id, w, h] = DIMS[devName];

function fbHash() {
  let hash = 0x811c9dc5;
  for (let i = 0; i < C.SK_FBB; i++) {
    hash = (hash ^ C.SK_FB[i]) >>> 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

C.sitek_init(id, w, h);

const out = [];
out.push(`dev\t${DEV_NAMES[id]}`);
out.push(`w\t${C.SK_W}\th\t${C.SK_H}\trowb\t${C.SK_ROWB}\tfb\t${C.SK_FBB}`);
out.push(`words\t${C.ks_words()}\tentbits\t${C.ks_ent_bits()}\tcsbits\t${C.ks_cs_bits()}`);
for (let i = 0; i < C.ks_words(); i++) out.push(`idx\t${i}\t${C.ks_word(i)}`);
out.push(`ones\t${C.ks_ones()}\th8\t${C.ks_h8()}`);
out.push(`gray\t${C.ks_gray(1234)}\tmorton\t${C.ks_morton(1234, 5)}\thilbert\t${C.ks_hilbert(1234, 5)}`);
for (let i = 0; i < 8; i++) out.push(`nodes\t${i}\t${C.grid_nodes(i)}`);
for (let s = 0; s < 5; s++) {
  C.sitek_set_screen(s);
  C.sitek_render();
  out.push(`screen\t${s}\thash\t${fbHash().toString(16).padStart(8, "0")}`);
}
process.stdout.write(out.join("\n") + "\n");
