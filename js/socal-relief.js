/**
 * SOCAL SUBSURFACE — relief map.
 *
 * A shaded-relief plan view of the same elevation field the 3D theater uses,
 * drawn into a 2D canvas: hypsometric tint, Lambertian hillshade, marching-
 * squares contours, and whatever vector furniture the caller passes in
 * (coastline, towers, coverage rings, the camera target).
 *
 * This is the cartographic read of the surface. The 3D stage shows you the
 * shape; the relief map shows you the contour interval, which is the thing
 * you actually measure terrain with — and it is the panel that will show the
 * difference immediately when a real USGS 3DEP grid is installed under
 * elevationAt(), because a synthetic gaussian field has smooth, round,
 * obviously fake contours and a 10 m DEM does not.
 *
 * Pure canvas 2D. No THREE, no DOM beyond the canvas handed in.
 */

/** Hypsometric ramp, metres → [r,g,b] 0–255. Matches the 3D terrain tint. */
export function hypsometric(e) {
  if (e < -400) return [6, 20, 38];
  if (e < 0) return [10, 34, 58];
  if (e < 150) return [42, 74, 58];
  if (e < 400) return [74, 96, 56];
  if (e < 800) return [112, 108, 62];
  if (e < 1400) return [140, 115, 74];
  if (e < 2000) return [150, 124, 100];
  if (e < 2700) return [162, 148, 140];
  if (e < 3400) return [196, 196, 196];
  return [238, 242, 248];
}

/** Grey ramp for the "shaded relief only" read. */
export function greyRamp(e) {
  const t = Math.max(0, Math.min(1, (e + 500) / 4000));
  const v = 40 + t * 170;
  return [v, v, v];
}

/** Slope ramp, degrees → colour. Cool = flat, hot = steep. */
export function slopeRamp(slopeDeg) {
  const t = Math.max(0, Math.min(1, slopeDeg / 45));
  return [40 + 200 * t, 80 + 90 * (1 - t), 150 * (1 - t) + 40];
}

/**
 * Sample an elevation field onto a regular pixel grid.
 * @returns {{w:number,h:number,data:Float32Array,bbox:object}}
 */
export function sampleGrid(elevAt, bbox, w, h) {
  const data = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const lat = bbox.lat1 - ((bbox.lat1 - bbox.lat0) * (y + 0.5)) / h;
    for (let x = 0; x < w; x++) {
      const lon = bbox.lon0 + ((bbox.lon1 - bbox.lon0) * (x + 0.5)) / w;
      data[y * w + x] = elevAt(lon, lat);
    }
  }
  return { w, h, data, bbox };
}

/**
 * Lambertian hillshade from a sampled grid.
 *
 * @param grid sampleGrid() result
 * @param sunAzDeg azimuth the light comes FROM, degrees clockwise from north
 * @param sunAltDeg sun altitude above the horizon, degrees
 * @param zFactor vertical exaggeration applied to the shading only
 */
export function hillshade(grid, { sunAzDeg = 315, sunAltDeg = 45, zFactor = 3 } = {}) {
  const { w, h, data, bbox } = grid;
  const out = new Float32Array(w * h);
  const latMid = ((bbox.lat0 + bbox.lat1) / 2) * (Math.PI / 180);
  const cellXm = (((bbox.lon1 - bbox.lon0) / w) * 111320 * Math.cos(latMid));
  const cellYm = ((bbox.lat1 - bbox.lat0) / h) * 111320;
  const az = ((360 - sunAzDeg + 90) % 360) * (Math.PI / 180);
  const alt = sunAltDeg * (Math.PI / 180);
  const zenith = Math.PI / 2 - alt;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const xm = Math.max(1, Math.min(w - 2, x));
      const ym = Math.max(1, Math.min(h - 2, y));
      const i = ym * w + xm;
      const dzdx = ((data[i + 1] - data[i - 1]) / (2 * cellXm)) * zFactor;
      const dzdy = ((data[i - w] - data[i + w]) / (2 * cellYm)) * zFactor;
      const slope = Math.atan(Math.hypot(dzdx, dzdy));
      const aspect = Math.atan2(dzdy, -dzdx);
      let v =
        Math.cos(zenith) * Math.cos(slope) + Math.sin(zenith) * Math.sin(slope) * Math.cos(az - aspect);
      v = Math.max(0, Math.min(1, v));
      out[y * w + x] = v;
    }
  }
  return out;
}

/** Slope in degrees for every cell of a sampled grid. */
export function slopeGrid(grid) {
  const { w, h, data, bbox } = grid;
  const out = new Float32Array(w * h);
  const latMid = ((bbox.lat0 + bbox.lat1) / 2) * (Math.PI / 180);
  const cellXm = (((bbox.lon1 - bbox.lon0) / w) * 111320 * Math.cos(latMid));
  const cellYm = ((bbox.lat1 - bbox.lat0) / h) * 111320;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const dzdx = (data[i + 1] - data[i - 1]) / (2 * cellXm);
      const dzdy = (data[i - w] - data[i + w]) / (2 * cellYm);
      out[i] = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
    }
  }
  return out;
}

/**
 * Marching squares contour segments at one level.
 * @returns array of [x0,y0,x1,y1] in grid coordinates.
 */
export function contourSegments(grid, level) {
  const { w, h, data } = grid;
  const segs = [];
  const interp = (va, vb, a, b) => {
    const t = (level - va) / (vb - va || 1e-9);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const tl = data[y * w + x];
      const tr = data[y * w + x + 1];
      const br = data[(y + 1) * w + x + 1];
      const bl = data[(y + 1) * w + x];
      let idx = 0;
      if (tl > level) idx |= 8;
      if (tr > level) idx |= 4;
      if (br > level) idx |= 2;
      if (bl > level) idx |= 1;
      if (idx === 0 || idx === 15) continue;
      const pTop = interp(tl, tr, [x, y], [x + 1, y]);
      const pRight = interp(tr, br, [x + 1, y], [x + 1, y + 1]);
      const pBottom = interp(bl, br, [x, y + 1], [x + 1, y + 1]);
      const pLeft = interp(tl, bl, [x, y], [x, y + 1]);
      const push = (a, b) => segs.push([a[0], a[1], b[0], b[1]]);
      switch (idx) {
        case 1: case 14: push(pLeft, pBottom); break;
        case 2: case 13: push(pBottom, pRight); break;
        case 3: case 12: push(pLeft, pRight); break;
        case 4: case 11: push(pTop, pRight); break;
        case 5: push(pLeft, pTop); push(pBottom, pRight); break;
        case 6: case 9: push(pTop, pBottom); break;
        case 7: case 8: push(pLeft, pTop); break;
        case 10: push(pTop, pRight); push(pLeft, pBottom); break;
        default: break;
      }
    }
  }
  return segs;
}

/**
 * Relief map renderer bound to a canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} o
 * @param {object} o.bbox {lon0,lat0,lon1,lat1}
 * @param {(lon:number,lat:number)=>number} o.elevAt
 * @param {number} [o.cell] target sampling cell in device pixels
 */
export function makeReliefMap(canvas, { bbox, elevAt, cell = 2 }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const gw = Math.max(32, Math.floor(W / cell));
  const gh = Math.max(32, Math.floor(H / cell));

  let grid = null;
  let shade = null;
  let slope = null;
  let image = null;

  const toPx = (lon, lat) => [
    ((lon - bbox.lon0) / (bbox.lon1 - bbox.lon0)) * W,
    ((bbox.lat1 - lat) / (bbox.lat1 - bbox.lat0)) * H,
  ];

  function resample() {
    grid = sampleGrid(elevAt, bbox, gw, gh);
    shade = hillshade(grid, { sunAzDeg: state.sunAz, sunAltDeg: state.sunAlt, zFactor: state.zFactor });
    slope = slopeGrid(grid);
    image = null;
  }

  const state = {
    mode: "hypso", // hypso | grey | slope
    sunAz: 315,
    sunAlt: 45,
    zFactor: 3,
    contourStepM: 500,
  };

  function paintBase() {
    const img = ctx.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) {
      const e = grid.data[i];
      const base =
        state.mode === "grey" ? greyRamp(e) : state.mode === "slope" ? slopeRamp(slope[i]) : hypsometric(e);
      const s = 0.35 + 0.95 * shade[i];
      img.data[i * 4] = Math.min(255, base[0] * s);
      img.data[i * 4 + 1] = Math.min(255, base[1] * s);
      img.data[i * 4 + 2] = Math.min(255, base[2] * s);
      img.data[i * 4 + 3] = 255;
    }
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    off.getContext("2d").putImageData(img, 0, 0);
    image = off;
  }

  /**
   * @param {object} o
   * @param {[number,number][]} [o.coast] coastline lon/lat
   * @param {Array} [o.points] [{lon,lat,color,r,label}]
   * @param {Array} [o.rings] [{ring:[[lon,lat]...], color, width, dash}]
   * @param {{lon:number,lat:number}} [o.cursor]
   */
  function draw({ coast = [], points = [], rings = [], cursor = null } = {}) {
    if (!grid) resample();
    if (!image) paintBase();
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, 0, 0, W, H);

    // Contours
    if (state.contourStepM > 0) {
      const sx = W / gw;
      const sy = H / gh;
      let min = Infinity;
      let max = -Infinity;
      for (const v of grid.data) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      ctx.lineWidth = 0.6;
      for (let lvl = Math.ceil(min / state.contourStepM) * state.contourStepM; lvl <= max; lvl += state.contourStepM) {
        const index = Math.round(lvl / state.contourStepM);
        ctx.strokeStyle = index % 2 === 0 ? "rgba(10,16,22,0.55)" : "rgba(10,16,22,0.28)";
        ctx.beginPath();
        for (const [x0, y0, x1, y1] of contourSegments(grid, lvl)) {
          ctx.moveTo(x0 * sx, y0 * sy);
          ctx.lineTo(x1 * sx, y1 * sy);
        }
        ctx.stroke();
      }
    }

    // Coastline
    if (coast.length) {
      ctx.strokeStyle = "rgba(96,208,255,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      coast.forEach(([lon, lat], i) => {
        const [x, y] = toPx(lon, lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Vector rings (coverage contours, perimeters…)
    for (const r of rings) {
      if (!r.ring || r.ring.length < 2) continue;
      ctx.strokeStyle = r.color || "#ffffff";
      ctx.lineWidth = r.width || 1;
      if (r.dash) ctx.setLineDash(r.dash);
      ctx.beginPath();
      r.ring.forEach(([lon, lat], i) => {
        const [x, y] = toPx(lon, lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      if (r.fill) {
        ctx.fillStyle = r.fill;
        ctx.fill();
      }
    }

    // Point furniture
    for (const p of points) {
      const [x, y] = toPx(p.lon, p.lat);
      ctx.fillStyle = p.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, p.r || 2, 0, Math.PI * 2);
      ctx.fill();
      if (p.label) {
        ctx.fillStyle = "rgba(230,240,250,0.9)";
        ctx.font = "8px ui-monospace, monospace";
        ctx.fillText(p.label, x + 4, y - 3);
      }
    }

    if (cursor) {
      const [x, y] = toPx(cursor.lon, cursor.lat);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
    }
  }

  function pxToLonLat(px, py) {
    return [
      bbox.lon0 + (px / W) * (bbox.lon1 - bbox.lon0),
      bbox.lat1 - (py / H) * (bbox.lat1 - bbox.lat0),
    ];
  }

  function setMode(mode) {
    state.mode = mode;
    image = null;
  }

  function setSun(az, alt) {
    state.sunAz = az;
    state.sunAlt = alt;
    if (grid) shade = hillshade(grid, { sunAzDeg: az, sunAltDeg: alt, zFactor: state.zFactor });
    image = null;
  }

  function setContourStep(m) {
    state.contourStepM = m;
  }

  return { resample, draw, state, setMode, setSun, setContourStep, toPx, pxToLonLat, get grid() { return grid; } };
}
