/** Terraink — high-definition map → line-art routines.
 *  Contours, Swiss hachures, drainage, ridges, weather isobars.
 */

function idx(dem, i, j) {
  return dem.elev[j * dem.nx + i];
}

function lonlat(dem, bbox, i, j) {
  const lon = bbox.minLon + (i / (dem.nx - 1)) * (bbox.maxLon - bbox.minLon);
  const lat = bbox.maxLat - (j / (dem.ny - 1)) * (bbox.maxLat - bbox.minLat);
  return [lon, lat];
}

function projectSvg(bbox, lon, lat, w, h, pad = 18) {
  const x = pad + ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * (w - pad * 2);
  const y = pad + ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) * (h - pad * 2);
  return [x, y];
}

function contours(dem, bbox, levels) {
  const { nx, ny } = dem;
  const out = [];
  const world = (i, j) => lonlat(dem, bbox, i, j);
  for (const level of levels) {
    const segs = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const e0 = idx(dem, i, j);
        const e1 = idx(dem, i + 1, j);
        const e2 = idx(dem, i + 1, j + 1);
        const e3 = idx(dem, i, j + 1);
        let bits = 0;
        if (e0 >= level) bits |= 1;
        if (e1 >= level) bits |= 2;
        if (e2 >= level) bits |= 4;
        if (e3 >= level) bits |= 8;
        if (!bits || bits === 15) continue;
        const p = (ia, ja, ea, ib, jb, eb) => {
          const t = (level - ea) / (eb - ea + 1e-9);
          const [lon, lat] = world(ia + (ib - ia) * t, ja + (jb - ja) * t);
          return [lon, lat];
        };
        const e = [
          p(i, j, e0, i + 1, j, e1),
          p(i + 1, j, e1, i + 1, j + 1, e2),
          p(i + 1, j + 1, e2, i, j + 1, e3),
          p(i, j + 1, e3, i, j, e0),
        ];
        const pairs = {
          1: [0, 3], 2: [0, 1], 3: [3, 1], 4: [1, 2], 5: [0, 1, 3, 2],
          6: [0, 2], 7: [3, 2], 8: [3, 2], 9: [0, 2], 10: [0, 3, 1, 2],
          11: [1, 2], 12: [3, 1], 13: [0, 1], 14: [0, 3],
        }[bits];
        if (!pairs) continue;
        for (let k = 0; k < pairs.length; k += 2) segs.push(e[pairs[k]], e[pairs[k + 1]]);
      }
    }
    out.push({ level, segs });
  }
  return out;
}

function autoLevels(dem, n = 14) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < dem.elev.length; i++) {
    const z = dem.elev[i];
    if (z < lo) lo = z;
    if (z > hi) hi = z;
  }
  const span = Math.max(8, hi - lo);
  const step = niceStep(span / n);
  const levels = [];
  const start = Math.ceil(lo / step) * step;
  for (let z = start; z < hi; z += step) levels.push(z);
  return { lo, hi, step, levels };
}

function niceStep(x) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(0.5, x))));
  const n = x / p;
  if (n < 1.5) return p;
  if (n < 3.5) return 2 * p;
  if (n < 7.5) return 5 * p;
  return 10 * p;
}

function hachures(dem, bbox, every = 3) {
  const segs = [];
  const { nx, ny } = dem;
  for (let j = 1; j < ny - 1; j += every) {
    for (let i = 1; i < nx - 1; i += every) {
      const z = idx(dem, i, j);
      const zx = (idx(dem, i + 1, j) - idx(dem, i - 1, j)) * 0.5;
      const zy = (idx(dem, i, j + 1) - idx(dem, i, j - 1)) * 0.5;
      const slope = Math.hypot(zx, zy);
      if (slope < 4) continue;
      const [lon, lat] = lonlat(dem, bbox, i, j);
      const len = Math.min(0.012, slope * 0.00035);
      const n = Math.hypot(zx, zy) || 1;
      segs.push([lon, lat], [lon + (zx / n) * len, lat + (zy / n) * len]);
    }
  }
  return segs;
}

function drainage(dem, bbox, seeds = 80) {
  const segs = [];
  const { nx, ny } = dem;
  for (let s = 0; s < seeds; s++) {
    let i = 2 + Math.floor((s * 17) % (nx - 4));
    let j = 2 + Math.floor((s * 29) % (ny - 4));
    for (let step = 0; step < 40; step++) {
      const [lon0, lat0] = lonlat(dem, bbox, i, j);
      let bi = i;
      let bj = j;
      let bz = idx(dem, i, j);
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = i + di;
          const nj = j + dj;
          if (ni < 1 || nj < 1 || ni >= nx - 1 || nj >= ny - 1) continue;
          const z = idx(dem, ni, nj);
          if (z < bz) {
            bz = z;
            bi = ni;
            bj = nj;
          }
        }
      }
      if (bi === i && bj === j) break;
      const [lon1, lat1] = lonlat(dem, bbox, bi, bj);
      segs.push([lon0, lat0], [lon1, lat1]);
      i = bi;
      j = bj;
    }
  }
  return segs;
}

function svgPath(pairs, bbox, w, h) {
  let d = "";
  for (let i = 0; i < pairs.length; i += 2) {
    const a = projectSvg(bbox, pairs[i][0], pairs[i][1], w, h);
    const b = projectSvg(bbox, pairs[i + 1][0], pairs[i + 1][1], w, h);
    d += `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  }
  return d;
}

export function extractTerrainkLayers(dem, bbox, opts = {}) {
  const { lo, hi, step, levels } = autoLevels(dem, opts.levels || 16);
  return {
    lo,
    hi,
    step,
    levels,
    contours: contours(dem, bbox, levels),
    hachures: hachures(dem, bbox, opts.hachureEvery || 3),
    drainage: drainage(dem, bbox, opts.drainSeeds || 90),
  };
}

export function renderTerraink(dem, bbox, opts = {}) {
  const w = opts.width || 1600;
  const h = opts.height || 1000;
  const wx = opts.wx || null;
  const { lo, hi, step, levels } = autoLevels(dem, opts.levels || 16);
  const ctr = contours(dem, bbox, levels);
  const hac = hachures(dem, bbox, opts.hachureEvery || 3);
  const drain = drainage(dem, bbox, opts.drainSeeds || 90);
  const outline = opts.outline || [];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;
  svg += `<rect width="100%" height="100%" fill="#f4efe4"/>`;
  svg += `<g fill="none" stroke="#2a2118" stroke-linecap="round" stroke-linejoin="round">`;
  svg += `<path d="${svgPath(hac, bbox, w, h)}" stroke="#b9a48a" stroke-width="0.35" opacity="0.7"/>`;
  svg += `<path d="${svgPath(drain, bbox, w, h)}" stroke="#3a6a88" stroke-width="0.7" opacity="0.8"/>`;
  ctr.forEach((c, i) => {
    const major = Math.abs(c.level / step) % 5 < 0.01;
    const d = svgPath(c.segs, bbox, w, h);
    svg += `<path d="${d}" stroke="${c.level < 0 ? "#1a4a58" : "#2c241c"}" stroke-width="${major ? 1.15 : 0.45}" opacity="${major ? 0.9 : 0.55}"/>`;
  });
  if (outline.length > 1) {
    let d = "";
    outline.forEach((p, i) => {
      const [x, y] = projectSvg(bbox, p[0], p[1], w, h);
      d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    svg += `<path d="${d}" stroke="#8a2018" stroke-width="1.6"/>`;
  }
  if (wx?.pressureMb) {
    const ring = [];
    const k = 0.018;
    for (let a = 0; a <= 32; a++) {
      const t = (a / 32) * Math.PI * 2;
      ring.push([wx.lon + Math.cos(t) * k, wx.lat + Math.sin(t) * k]);
    }
    let d = "";
    ring.forEach((p, i) => {
      const [x, y] = projectSvg(bbox, p[0], p[1], w, h);
      d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    svg += `<path d="${d}" stroke="#c45a18" stroke-width="1.1" stroke-dasharray="4 3"/>`;
  }
  svg += `</g>`;
  svg += `<text x="20" y="${h - 16}" font-family="ui-monospace,monospace" font-size="13" fill="#3a3028">TERRAINK HD  ${lo.toFixed(0)}–${hi.toFixed(0)} m  Δ${step}  ${wx ? wx.source + "  " + (wx.tempF?.toFixed(0) || "—") + "°F" : ""}</text>`;
  svg += `</svg>`;
  return { svg, lo, hi, step, levels: levels.length };
}

export function paintTerraink(canvas, dem, bbox, opts = {}) {
  const art = renderTerraink(dem, bbox, { ...opts, width: canvas.width, height: canvas.height });
  const img = new Image();
  const blob = new Blob([art.svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f4efe4";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(art);
    };
    img.src = url;
  });
}
