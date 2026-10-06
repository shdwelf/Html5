/* Mirror of `fcorner-host dump <dev>` using the transpiled core.
   calc/tools/difftest.py diffs this against the gcc build of the very same
   core/*.c, which is how we know the browser preview is running the port's
   arithmetic and not a JavaScript re-implementation of it.

   Usage: node four-corners-calc/tools/js_dump.mjs <path-to-four-corners-core.mjs> <dev>

   Every line here must match the C printf in host/main.c byte for byte,
   including the tab positions and the zero-padded hex.
*/
import { pathToFileURL } from "node:url";

const [corePath, devName] = process.argv.slice(2);
const C = await import(pathToFileURL(corePath).href);

/* device id, width, height — DEV_* ids come from calc/core/sitek.h */
const DIMS = {
  ti83: [0, 96, 64],
  ti89: [2, 160, 100],
  ti92: [4, 240, 128],
};

if (!DIMS[devName]) {
  process.stderr.write(`unknown device ${devName}\n`);
  process.exit(2);
}
const [id, w, h] = DIMS[devName];

function fbHash() {
  let hash = 0x811c9dc5;
  for (let i = 0; i < C.SK_FBB; i++) {
    hash = (hash ^ C.SK_FB[i]) >>> 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const hex8 = (v) => (v >>> 0).toString(16).padStart(8, "0");

C.fcorner_init(id, w, h);

const out = [];
out.push(`dev\t${devName}`);
out.push(`w\t${C.SK_W}\th\t${C.SK_H}\trowb\t${C.SK_ROWB}\tfb\t${C.SK_FBB}`);
out.push(`feat\t${C.fcorner_feat_count()}\tvis\t${C.fcorner_visible()}\tlayers\t${C.FC_NLAYER}`);

for (let i = 0; i < 12; i++) {
  out.push(`elev\t${i}\t${C.fc_elev_q(i * 400, C.FC_SPAN_LAT - i * 300)}`);
}
for (let i = 0; i < C.FC_NTER; i++) {
  out.push(`snap\t${i}\t${C.fc_elev_q(C.FC_TER[i * 3], C.FC_TER[i * 3 + 1])}`);
}
for (let i = 0; i < 8; i++) {
  out.push(`depth\t${i}\t${C.fc_depth_mag_q8(1 << (i * 2))}`);
}
for (let i = 0; i < 10; i++) {
  const f = i * 7;
  out.push(
    `feat\t${i}\tlon\t${C.fcorner_feat_qlon(f)}\tlat\t${C.fcorner_feat_qlat(f)}` +
      `\tlayer\t${C.fcorner_feat_layer(f)}\ttier\t${C.fcorner_feat_tier(f)}`
  );
}

C.fcorner_set_sel(2);
out.push(`prof\tn\t${C.fc_prof_n()}\tkm\t${C.fc_prof_km()}`);
for (let i = 0; i < 8; i++) out.push(`prof\t${i}\t${C.fc_prof_elev(i * 7)}`);

for (let s = 0; s < C.FC_NSCREEN; s++) {
  C.fcorner_set_screen(s);
  C.fcorner_render();
  out.push(`screen\t${s}\thash\t${hex8(fbHash())}`);
}

C.fcorner_set_sel(2);
C.fcorner_set_zoom(2);
C.fcorner_set_screen(C.FC_SCR_MAP);
C.fcorner_render();
out.push(`screen\tzoom\thash\t${hex8(fbHash())}`);

process.stdout.write(out.join("\n") + "\n");
