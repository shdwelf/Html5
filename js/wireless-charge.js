/**
 * js/wireless-charge.js — design engine for the Charge Pad Lab
 * (`wireless-charge-pad.html`).
 *
 * Everything here is pure: no DOM, no fetch. The page and the Node checks
 * (`tools/verify_wireless_charge.mjs`, `tests/wireless-charge.test.mjs`) both
 * import this same module, so what the page displays is what gets tested.
 *
 * Units: SI everywhere (metres, henries, ohms, hertz, watts, kelvin) unless a
 * parameter is explicitly named `…Mm`, `…Mah`, `…Mhz` or `…Ma`.
 *
 * The four load-bearing models, and where each one comes from:
 *
 *  1. Mutual inductance of two coaxial circular filaments — Grover's closed
 *     form in complete elliptic integrals. Cross-checked against a brute-force
 *     Neumann double integral in the verify tool (they agree to ~1e-9).
 *  2. Self inductance of a multi-turn planar coil — the filament method: sum
 *     every pairwise mutual, and use the round-wire loop formula on the
 *     diagonal. Cross-checked against the Mohan current-sheet spiral formula.
 *  3. Series-series resonant link — exact 2x2 phasor solve of the coupled
 *     circuit at the drive frequency. Cross-checked against the textbook
 *     closed-form efficiency k²Q1Q2/(1+sqrt(1+k²Q1Q2))² at the optimum load.
 *  4. CC/CV lithium charge — numeric integration over a published-shaped
 *     OCV(SOC) curve plus internal resistance. Energy in, energy stored and
 *     heat are bookkept, and they must balance.
 *
 * Deliberately NOT modelled (and the page says so): ferrite field shaping
 * (handled by one measured multiplier), proximity effect between adjacent
 * turns, FOD/ASK communication margin, and acoustic output of the driver.
 */

/* ------------------------------------------------------------------ *
 * constants
 * ------------------------------------------------------------------ */

export const MU0 = 4 * Math.PI * 1e-7;      // H/m, vacuum permeability
export const RHO_CU = 1.68e-8;              // Ω·m, copper at 20 °C
export const ALPHA_CU = 0.00393;            // 1/K, copper resistivity tempco
export const MM = 1e-3;                     // mm → m
export const IN_TO_MM = 25.4;
export const C_SOUND = 343;                 // m/s at 20 °C
export const SQ = Math.SQRT2;

/**
 * WPC / Qi figures used as hard limits by `compliance()`. Each one carries the
 * source it came from so the page can show it rather than assert it.
 */
const WPC_Q_RX_MIN = 77;

export const QI = {
  fMinHz: 110e3,
  fMaxHz: 205e3,
  /** TI bq5105xB datasheet (WPC v1.2): the receiver coil Q must exceed 77. */
  qRxMin: 77,
  /** Qi BPP ceiling for a single 5 W base station. */
  bppW: 5,
  /** TDK's A11 unit, WT505090-10F2-A11-G1: 6.3 µH at 100 kHz, 60 mΩ, 51.4 mm. */
  a11: { odMm: 51.4, turns: 11, lUh: 6.3, dcrOhm: 0.06, fTestHz: 100e3 },
  /** TI SLYT570: typical coupling for a WPC coupled-inductor system. */
  kTypicalRange: [0.5, 0.7],
  /**
   * TI bq5105xB application example: Ls = 11 µH free space, Ls' = 16 µH on the
   * specified ferrite shield. That ratio is the default `ferriteFactor` below.
   */
  ferriteFactorTypical: 16 / 11,
  fsHz: 100e3,   // RX series-resonance target, 100 kHz +5/-10 %
  fdHz: 1e6,     // RX parallel (moving-coil-detect) anti-resonance, 1 MHz ±10 %
};

/**
 * Li-ion OCV vs state of charge. Standard graphite/LCO-shaped curve; used only
 * to place the CC→CV knee, which is what the charge-time number depends on.
 */
export const OCV_LIION = [
  [0.00, 3.00], [0.05, 3.40], [0.10, 3.55], [0.20, 3.65], [0.30, 3.70],
  [0.40, 3.75], [0.50, 3.80], [0.60, 3.85], [0.70, 3.92], [0.80, 3.98],
  [0.90, 4.08], [1.00, 4.18],
];

/* ------------------------------------------------------------------ *
 * complex helpers (kept tiny and explicit — no dependencies)
 * ------------------------------------------------------------------ */

export const cx = (re, im = 0) => ({ re, im });
export const cAdd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
export const cSub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
export const cMul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const cDiv = (a, b) => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const cConj = (a) => ({ re: a.re, im: -a.im });
export const cAbs = (a) => Math.hypot(a.re, a.im);

/* ------------------------------------------------------------------ *
 * special functions
 * ------------------------------------------------------------------ */

/** Complete elliptic integral of the first kind, K(k), by the AGM. */
export function ellipticK(k) {
  const kk = Math.abs(k);
  if (kk >= 1 - 1e-12) return Infinity;
  let a = 1;
  let b = Math.sqrt(1 - kk * kk);
  while (Math.abs(a - b) > 1e-15 * a) {
    const an = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = an;
  }
  return Math.PI / (2 * a);
}

/**
 * Complete elliptic integral of the second kind, E(k), from the same AGM
 * sequence: E = K·(1 − Σ 2^(n−1)·c_n²).
 */
export function ellipticE(k) {
  const kk = Math.abs(k);
  if (kk >= 1 - 1e-12) return 1;
  let a = 1;
  let b = Math.sqrt(1 - kk * kk);
  let c = kk;
  let pow2 = 0.5;
  let sum = 0.5 * c * c;
  while (Math.abs(a - b) > 1e-15 * a) {
    const an = (a + b) / 2;
    const bn = Math.sqrt(a * b);
    c = (a - b) / 2;
    pow2 *= 2;
    sum += pow2 * c * c;
    a = an;
    b = bn;
  }
  return (Math.PI / (2 * a)) * (1 - sum);
}

/**
 * Complex Bessel J0(z) and J1(z) by their power series; used only for the
 * round-wire AC-resistance ratio, where |z| <= 30.
 *   J0(z) = Σ (-1)^m (z/2)^(2m) / (m!)²
 *   J1(z) = (z/2) · Σ (-1)^m (z/2)^(2m) / (m!·(m+1)!)
 */
function besselJ01(zRe, zIm, terms = 60) {
  const h = { re: zRe / 2, im: zIm / 2 };
  const h2 = cMul(h, h);
  let p = { re: 1, im: 0 };      // (z/2)^(2m)
  let fact = 1;                  // m!
  let j0 = { re: 0, im: 0 };
  let j1 = { re: 0, im: 0 };
  for (let m = 0; m < terms; m++) {
    if (m > 0) { p = cMul(p, h2); fact *= m; }
    const sign = m % 2 === 0 ? 1 : -1;
    const a0 = sign / (fact * fact);
    j0 = cAdd(j0, { re: a0 * p.re, im: a0 * p.im });
    const a1 = sign / (fact * fact * (m + 1));
    j1 = cAdd(j1, cMul({ re: a1 * p.re, im: a1 * p.im }, h));
  }
  return { j0, j1 };
}

/**
 * Rac/Rdc for an isolated round conductor, x = d/δ.
 * Exact Bessel form; falls back to the x/4 asymptote far out, where the
 * alternating series would lose precision.
 */
export function roundWireAcRatio(x) {
  const ax = Math.abs(x);
  if (ax < 1e-9) return 1;
  if (ax > 30) return ax / 4;   // asymptote: R_ac/R_dc → d/(4δ)
  const ang = (3 * Math.PI) / 4;
  const z = { re: ax * Math.cos(ang), im: ax * Math.sin(ang) };
  const { j0, j1 } = besselJ01(z.re, z.im);
  // ber + i·bei = J0(x·e^{i3π/4});  ber' + i·bei' = −e^{i3π/4}·J1(z)
  const ber = j0.re, bei = j0.im;
  const eRe = Math.cos(ang), eIm = Math.sin(ang);
  const dp = cMul({ re: -eRe, im: -eIm }, j1);
  const num = ber * dp.im - bei * dp.re;
  const den = dp.re * dp.re + dp.im * dp.im;
  const r = (ax / 2) * (num / den);
  return r > 1 ? r : 1;
}

/** Skin depth in metres. */
export function skinDepth(fHz, rho = RHO_CU, mu = MU0) {
  return Math.sqrt((2 * rho) / (2 * Math.PI * fHz * mu));
}

/** AWG → bare copper diameter in mm (the standard geometric series). */
export function awgDiameterMm(awg) {
  return 0.127 * Math.pow(92, (36 - awg) / 39);
}

/* ------------------------------------------------------------------ *
 * filaments: mutual and self inductance
 * ------------------------------------------------------------------ */

/**
 * Mutual inductance of two coaxial circular filaments (radii a, A; axial
 * separation d). Grover, "Inductance Calculations", eq. 73.
 */
export function mutualCoaxial(a, A, d) {
  const s = (a + A) * (a + A) + d * d;
  const k2 = (4 * a * A) / s;
  if (!(k2 > 0)) return 0;
  const k = Math.sqrt(k2);
  const K = ellipticK(k);
  const E = ellipticE(k);
  return MU0 * Math.sqrt(a * A) * (((2 / k) - k) * K - (2 / k) * E);
}

/**
 * Neumann double integral for two circular filaments, optionally offset
 * sideways. O(n²); this is the independent reference the closed form above is
 * checked against, and it is also what handles a misaligned receiver.
 */
export function mutualNeumann(a, A, d, offset = 0, n = 96) {
  const h = (2 * Math.PI) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * h;
    const ct = Math.cos(th), st = Math.sin(th);
    const x1 = a * ct, y1 = a * st;
    for (let j = 0; j < n; j++) {
      const ph = (j + 0.5) * h;
      const dx = x1 - (offset + A * Math.cos(ph));
      const dy = y1 - A * Math.sin(ph);
      const r = Math.sqrt(dx * dx + dy * dy + d * d);
      sum += Math.cos(th - ph) / r;
    }
  }
  return (MU0 / (4 * Math.PI)) * a * A * h * h * sum;
}

/**
 * Self inductance of one circular turn of round wire (radius rw).
 * L = μ0·R·(ln(8R/rw) − 2 + 1/(4n)) — the last term is internal flux and is
 * divided by the strand count for litz, whose strands carry separate internal
 * fields. Non-magnetic wire only.
 */
export function loopSelfInductance(R, wireRadius, strands = 1) {
  const lw = Math.log((8 * R) / wireRadius);
  return MU0 * R * (lw - 2 + 1 / (4 * Math.max(1, strands)));
}

/* ------------------------------------------------------------------ *
 * the coil model
 * ------------------------------------------------------------------ */

/**
 * Build a planar (pancake) coil from a winding spec.
 *
 * spec:
 *   odMm, idMm    outer / inner diameter of the winding window
 *   turns         total turns
 *   layers        winding layers (stacked axially); default 1
 *   wireMm        build diameter of one insulated conductor, used for the fit
 *                 check and for the radial/axial pitch
 *   strands       litz strand count (1 = solid)
 *   strandMm      copper diameter of one strand; defaults to wireMm
 *   insulationMm  per-strand insulation, only used for the fit check
 *
 * Returns filaments (metres), the winding length, copper area and whether the
 * requested turn count physically fits in the window.
 */
export function planarCoil(spec) {
  const {
    odMm, idMm, turns, layers = 1, wireMm = 0.2,
    strands = 1, strandMm = null, insulationMm = 0.01,
  } = spec;
  if (odMm <= idMm) throw new Error(`coil: od ${odMm} must exceed id ${idMm}`);
  if (turns < 1) throw new Error(`coil: turns must be >= 1`);

  const od = odMm * MM, id = idMm * MM, w = wireMm * MM;
  const radialBuild = (od - id) / 2;
  const perLayer = Math.max(1, Math.floor(radialBuild / w + 1e-9));
  const layersNeeded = Math.ceil(turns / perLayer);

  const filaments = [];
  for (let t = 0; t < turns; t++) {
    const layer = Math.floor(t / perLayer);
    const idx = t - layer * perLayer;
    const r = id / 2 + w / 2 + idx * w;
    filaments.push({ r, z: layer * w });
  }

  const wireLength = filaments.reduce((s, f) => s + 2 * Math.PI * f.r, 0);
  const strandDia = (strandMm ?? (strands > 1 ? wireMm / Math.sqrt(strands) : wireMm)) * MM;
  const copperArea = strands * Math.PI * Math.pow(strandDia / 2, 2);
  const bundleRadius = strands > 1 ? (wireMm / 2) * MM : strandDia / 2;

  return {
    spec: { ...spec, strandMm: strandDia / MM, insulationMm },
    filaments,
    turns,
    layers: layersNeeded,
    turnsPerLayer: perLayer,
    /** Does the requested turn count fit in the requested number of layers? */
    fits: turns <= layers * perLayer,
    layersNeeded,
    radialBuildM: radialBuild,
    axialBuildM: layersNeeded * w,
    wireLength,
    copperArea,
    strandDiameterM: strandDia,
    bundleRadiusM: bundleRadius,
    dcr: (RHO_CU * wireLength) / copperArea,
    /** Turns that fit in one layer of this window. */
    maxTurnsOneLayer: perLayer,
  };
}

/** Self inductance of a built coil: filament sum + the round-wire diagonal. */
export function coilInductance(coil, { ferriteFactor = 1 } = {}) {
  const f = coil.filaments;
  let L = 0;
  for (let i = 0; i < f.length; i++) {
    L += loopSelfInductance(f[i].r, coil.bundleRadiusM, coil.spec.strands || 1);
    for (let j = i + 1; j < f.length; j++) {
      L += 2 * mutualCoaxial(f[i].r, f[j].r, Math.abs(f[i].z - f[j].z));
    }
  }
  return L * ferriteFactor;
}

/**
 * AC resistance of the winding at f. Skin effect is applied per strand, which
 * is the whole point of litz; proximity between adjacent turns is NOT modelled
 * and typically adds 10-40 % in a real winding.
 */
/**
 * @param proximity  multiplier for the proximity effect between adjacent
 *   turns, which this model does NOT solve. It is the dominant error at MHz
 *   frequencies in a tightly wound small coil: 1.0 is optimistic, 2-3 is a
 *   realistic derate, and it is exposed in the UI so you can see how much of
 *   the answer depends on it.
 */
export function coilAcResistance(coil, fHz, tempC = 25, proximity = 1) {
  const delta = skinDepth(fHz);
  const x = coil.strandDiameterM / delta;
  const ratio = roundWireAcRatio(x);
  const tempFactor = 1 + ALPHA_CU * (tempC - 20);
  return coil.dcr * ratio * tempFactor * proximity;
}

export function coilQ(coil, fHz, { ferriteFactor = 1, tempC = 25, proximity = 1, inductance = null } = {}) {
  const L = inductance ?? coilInductance(coil, { ferriteFactor });
  return (2 * Math.PI * fHz * L) / coilAcResistance(coil, fHz, tempC, proximity);
}

/**
 * Mohan et al. current-sheet formula for a circular spiral inductor. Not used
 * by the design path. It models a thin sheet current, so it only agrees with
 * the filament sum for fine wire; for a thick-wire coil it over-reads. Kept
 * here because it is the honest answer for an etched PCB spiral.
 */
export function mohanSpiralInductance({ odMm, idMm, turns }) {
  const od = odMm * MM, id = idMm * MM;
  const davg = (od + id) / 2;
  const phi = (od - id) / (od + id);
  // circle: K1 = 2.46, K2 = 0 (Mohan, Lee, Melgaard-Jensen, Wong, JSSC 1999)
  return (2.46 * MU0 * davg * turns * turns) / (1 + 0 * phi);
}

/**
 * Electrical values for a coil at one frequency, with catalogue data preferred
 * over the model.
 *
 * `spec.catalog` may give `lH`, `rOhm`, or `q` (from which R = ωL/Q). Where a
 * published part exists — the A11 pad coil, a WPC-compliant receiver — using
 * its numbers beats using this model's reconstruction of them, and the resolver
 * reports both so the page can show what was overridden and why.
 */
export function coilElectrical(coil, spec, fHz, { ferriteFactor = 1, proximity = 1 } = {}) {
  const modeledL = coilInductance(coil, { ferriteFactor });
  const modeledR = coilAcResistance(coil, fHz, 40, proximity);
  const c = (spec && spec.catalog) || null;
  if (!c) {
    return { L: modeledL, R: modeledR, modeledL, modeledR, q: (2 * Math.PI * fHz * modeledL) / modeledR, source: 'model' };
  }
  // Catalogue data is measured at one frequency. Sweeping 64× away from it and
  // still quoting the datasheet number would be fiction, so it is only trusted
  // within a factor of two of `fTestHz`; outside that window the model takes
  // over and says so.
  const inWindow = !c.fTestHz || Math.abs(Math.log(fHz / c.fTestHz)) < Math.LN2;
  if (!inWindow) {
    return { L: modeledL, R: modeledR, modeledL, modeledR, q: (2 * Math.PI * fHz * modeledL) / modeledR, source: 'model (outside catalogue test window)' };
  }
  const L = c.lH ?? modeledL;
  const R = c.rOhm ?? (c.q ? (2 * Math.PI * fHz * L) / c.q : modeledR);
  return { L, R, modeledL, modeledR, q: (2 * Math.PI * fHz * L) / R, source: c.source ?? 'catalogue' };
}

/* ------------------------------------------------------------------ *
 * coupling between the pad coil and the speaker coil
 * ------------------------------------------------------------------ */

/**
 * Mutual inductance and coupling coefficient between two built coils, coaxial
 * (`offsetMm = 0`) or misaligned. `gapM` is coil-plane to coil-plane.
 *
 * Coaxial pairs use Grover (fast, exact); anything offset uses the Neumann
 * integral with a reduced sample count.
 */
export function coupleCoils(tx, rx, gapM, offsetM = 0, neumannSamples = 96) {
  let M = 0;
  const offset = Math.abs(offsetM);
  if (offset < 1e-9) {
    for (const a of tx.filaments) {
      for (const b of rx.filaments) {
        M += mutualCoaxial(a.r, b.r, Math.abs(gapM + a.z - b.z));
      }
    }
  } else {
    for (const a of tx.filaments) {
      for (const b of rx.filaments) {
        M += mutualNeumann(a.r, b.r, gapM + a.z - b.z, offset, neumannSamples);
      }
    }
  }
  const Ltx = coilInductance(tx);
  const Lrx = coilInductance(rx);
  return { M, k: M / Math.sqrt(Ltx * Lrx) };
}

/* ------------------------------------------------------------------ *
 * the resonant link
 * ------------------------------------------------------------------ */

/**
 * Series-series resonant link, solved exactly at one frequency.
 *
 *   [ Z1     -jωM ] [I1]   [Vs]
 *   [ -jωM    Z2  ] [I2] = [ 0]
 *
 *   Z1 = (R1 + Rs) + j(ωL1 − 1/ωCs1)
 *   Z2s = (R2 + RL) + j(ωL2 − 1/ωCs2)      the RX series branch
 *   Z2  = Z2s / (1 + jωCd2·Z2s)            with the parallel cap across it
 *
 * I2 is the current the coupled source drives into the RX network; the load
 * current is I2 through the Z2/Z2s current divider. A capacitor value of 0
 * means "absent" (open circuit), not "short".
 *
 * Voltages and currents are peaks; powers are time averages.
 * Returns currents, voltages, input power, power into RL and efficiency.
 */
export function seriesSeriesLink(p) {
  const {
    fHz, L1, R1, cs1 = 0, L2, R2, cs2 = 0, cd2 = 0, M, vSourcePeak, rSource = 0, rLoad,
  } = p;
  if (rLoad <= 0) throw new Error('link: rLoad must be > 0');
  const w = 2 * Math.PI * fHz;
  const xCs1 = cs1 > 0 ? 1 / (w * cs1) : 0;
  const xCs2 = cs2 > 0 ? 1 / (w * cs2) : 0;
  const Z1 = cx(R1 + rSource, w * L1 - xCs1);
  const Z2s = cx(R2 + rLoad, w * L2 - xCs2);
  const Z2 = cd2 > 0 ? cDiv(Z2s, cAdd(cx(1), cMul(cx(0, w * cd2), Z2s))) : Z2s;
  const jwM = cx(0, w * M);
  // det = Z1·Z2 − (−jωM)(−jωM) = Z1·Z2 + ω²M²
  const det = cAdd(cMul(Z1, Z2), cx(w * w * M * M, 0));
  const I1 = cDiv(cMul(cx(vSourcePeak), Z2), det);
  const I2 = cDiv(cMul(jwM, cx(vSourcePeak)), det);
  // current divider: the share of I2 that actually reaches the load
  const divider = cd2 > 0 ? cDiv(cx(1), cAdd(cx(1), cMul(cx(0, w * cd2), Z2s))) : cx(1);
  const iLoadC = cMul(I2, divider);
  const vS = cx(vSourcePeak);
  // Every voltage and current returned here is a PEAK; every power is the
  // time average, which is why each one carries the ½.
  const pIn = 0.5 * cMul(vS, cConj(I1)).re;
  const i1 = cAbs(I1), i2 = cAbs(I2), iLoad = cAbs(iLoadC);
  // R2 sits inside the series branch, so it carries the load current, not the
  // total current into the RX network. With no parallel cap the two are equal.
  const pLoad = 0.5 * iLoad * iLoad * rLoad;
  const pCoil1 = 0.5 * i1 * i1 * R1;
  const pCoil2 = 0.5 * iLoad * iLoad * R2;
  const pSource = 0.5 * i1 * i1 * rSource;
  return {
    w, i1, i2, iLoad,
    vCoil1Peak: i1 * w * L1,
    vCoil2Peak: iLoad * w * L2,
    vCs1Peak: cs1 > 0 ? i1 * xCs1 : 0,
    vCs2Peak: cs2 > 0 ? iLoad * xCs2 : 0,
    vCd2Peak: cd2 > 0 ? cAbs(cMul(I2, Z2)) : 0,
    pIn, pLoad, pCoil1, pCoil2, pSource,
    efficiency: pLoad / pIn,
    /** ω²M²/(R1'·R2) — the figure of merit the closed-form η is built from. */
    kQProduct: (w * M) * (w * M) / ((R1 + rSource) * R2),
    z1: Z1, z2s: Z2s, z2: Z2,
  };
}

/**
 * Optimum-load efficiency of a series-series link at resonance:
 *   η_max = k²Q1Q2 / (1 + sqrt(1 + k²Q1Q2))²
 * Included so the exact solve can be checked against the closed form.
 */
export function optimumLoadEfficiency(k, q1, q2) {
  const p = k * k * q1 * q2;
  const root = Math.sqrt(1 + p);
  return p / ((1 + root) * (1 + root));
}

/** Load resistance that maximises power delivered to the load. */
export function maxPowerLoad({ fHz, L1, R1, L2, R2, M, rSource = 0 }) {
  const w = 2 * Math.PI * fHz;
  const q1 = (w * L1) / (R1 + rSource);
  const q2 = (w * L2) / R2;
  const p = (w * M) * (w * M) / ((R1 + rSource) * R2);
  return { rLoad: R2 * Math.sqrt(1 + p), q1, q2, kQ2: p };
}

/**
 * Qi receiver tuning capacitors, per the bq5105xB datasheet equations.
 *   C1 = 1/((2π·fs)²·Ls')        series resonance at fs = 100 kHz
 *   C2 = C1/((2π·fd)²·Ls'·C1 − 1)  parallel resonance at fd = 1 MHz
 * `lsPrime` is the inductance measured on the specified ferrite shield, which
 * is what the datasheet formulas use — not the free-space value.
 */
export function qiTuningCapacitors(lsPrimeH, { fsHz = QI.fsHz, fdHz = QI.fdHz } = {}) {
  const c1 = 1 / (Math.pow(2 * Math.PI * fsHz, 2) * lsPrimeH);
  const wd = 2 * Math.PI * fdHz;
  const c2 = c1 / (wd * wd * lsPrimeH * c1 - 1);
  return { c1, c2 };
}

/* ------------------------------------------------------------------ *
 * receiver chain: rectifier → charger → cell
 * ------------------------------------------------------------------ */

/**
 * Equivalent AC load resistance a full-bridge rectifier with a capacitive
 * filter presents to the resonant circuit: R_ac = (8/π²)·R_dc.
 */
export function rectifierAcLoad(vRectDc, iDcA) {
  return (8 / (Math.PI * Math.PI)) * (vRectDc / iDcA);
}

/**
 * Receiver-side power chain from the resonant circuit to the cell.
 *
 *   V_RECT  = (π/4)·V_coil_peak − bridge drop
 *   I_DC    = (2/π)·I_coil_peak
 *   P_cell  = η_charger · V_RECT · I_DC
 *
 * `bridgeDrop` is 2·Vf for a Schottky bridge, or I·Rds(on) for the synchronous
 * rectifier inside a Qi receiver IC.
 */
/**
 * Receiver-side power chain from the resonant circuit to the cell.
 *
 * The bridge input sees a square wave while the series-resonant current is
 * sinusoidal, so on the fundamental (V1 = peak fundamental across the bridge
 * input, i.e. across the equivalent AC load):
 *   V_RECT = (π/4)·V1 − bridge drop
 *   I_DC   = (2/π)·I_peak
 *   P_AC   = P_DC + bridge loss = ½·V1·I_peak   (exact, and equal to the
 *                                                 link's pLoad by construction)
 *   P_cell = η_charger · (P_DC − quiescent·V_RECT)
 *
 * `bridgeMode` is 'schottky' (2·Vf drop, current-independent) or 'sync' (the
 * synchronous rectifier inside a Qi receiver IC: I²·Rds(on)).
 */
export function receiverChain({ bridgeInputPeakVoltage, coilPeakCurrent, bridgeMode = 'schottky', vf = 0.35, rdsOn = 0.05, chargerEff = 0.92, vCell = 3.9, quiescentA = 0.005 }) {
  const iDc = (2 / Math.PI) * coilPeakCurrent;
  const vRectIdeal = (Math.PI / 4) * bridgeInputPeakVoltage;
  const bridgeLoss = bridgeMode === 'schottky' ? 2 * vf * iDc : iDc * iDc * rdsOn;
  const vRect = Math.max(0, vRectIdeal - (bridgeMode === 'schottky' ? 2 * vf : iDc * rdsOn));
  const pDc = vRect * iDc;
  const pAc = pDc + bridgeLoss;
  const pCell = Math.max(0, chargerEff * (pDc - quiescentA * vRect));
  return {
    vRect, vRectIdeal, iDc, pDc, pAc, pCell, bridgeLoss,
    chargeCurrentA: pCell / vCell,
    chainEfficiency: pAc > 0 ? pCell / pAc : 0,
  };
}

/* ------------------------------------------------------------------ *
 * the cell: CC/CV charge and playback runtime
 * ------------------------------------------------------------------ */

/** Piecewise-linear OCV(SOC). */
export function ocvAt(soc, table = OCV_LIION) {
  const s = Math.min(1, Math.max(0, soc));
  for (let i = 1; i < table.length; i++) {
    if (s <= table[i][0]) {
      const [s0, v0] = table[i - 1];
      const [s1, v1] = table[i];
      return v0 + ((s - s0) / (s1 - s0)) * (v1 - v0);
    }
  }
  return table[table.length - 1][1];
}

/**
 * CC/CV charge of a lithium cell, integrated in 1 s steps.
 *
 * Returns time, the energy in / stored / heat split (they must balance) and a
 * downsampled curve for the page to draw.
 */
export function chargeProfile({
  capacityMah, iccA, vcv = 4.2, iTermA = null, rIntOhm = 0.15,
  socStart = 0.05, socTarget = 1.0, dtS = 1, table = OCV_LIION, maxHours = 20,
}) {
  if (iTermA == null) iTermA = 0.05 * iccA;
  const capacityC = capacityMah * 3.6;          // coulombs
  let soc = socStart;
  let t = 0;
  let eIn = 0, eStored = 0, eHeat = 0, eCv = 0;
  let phase = 'cc';
  let kneeSoc = null, kneeTime = null, cvCurrent = iccA;
  const curve = [];
  const curveEvery = Math.max(1, Math.round(30 / dtS));
  let i = 0;

  while (t < maxHours * 3600) {
    const ocv = ocvAt(soc, table);
    let current;
    if (phase === 'cc') {
      current = iccA;
      if (ocv + current * rIntOhm >= vcv) {
        phase = 'cv';
        kneeSoc = soc;
        kneeTime = t;
        current = (vcv - ocv) / rIntOhm;
        cvCurrent = current;
      }
    } else {
      current = (vcv - ocv) / rIntOhm;
      cvCurrent = current;
    }
    if (current <= 0) break;

    const dQ = current * dtS;
    const dSoc = dQ / capacityC;
    const terminalV = phase === 'cc' ? ocv + current * rIntOhm : vcv;
    eIn += terminalV * dQ;
    eStored += ocv * dQ;
    eHeat += current * current * rIntOhm * dtS;
    soc += dSoc;
    t += dtS;
    if (i % curveEvery === 0) {
      curve.push({ t, soc, v: terminalV, i: current, phase });
    }
    i++;
    if (soc >= socTarget) break;
    if (phase === 'cv' && current <= iTermA) break;
  }
  return {
    timeS: t,
    timeHours: t / 3600,
    socEnd: soc,
    phase,
    kneeSoc, kneeTime,
    cvCurrent,
    energyInJ: eIn,
    energyStoredJ: eStored,
    energyHeatJ: eHeat,
    /** eStored + eHeat must equal eIn to within integration error. */
    energyBalance: (eStored + eHeat) / eIn,
    curve,
  };
}

/**
 * Playback runtime.
 *
 * `crestFactor` is the ratio of peak to average acoustic power: music sits well
 * below peak, so a speaker rated 3 W draws far less than 3 W on average. The
 * default of 8 (~9 dB) is the conventional listening-level assumption.
 */
export function playTime({
  capacityMah, socFrom = 1.0, socTo = 0.05, vNominal = 3.7,
  btSoCMa = 12, ampQuiescentMa = 2.4, ampEff = 0.92,
  acousticPeakW = 1.0, crestFactor = 8, vRail = null,
}) {
  const rail = vRail ?? vNominal;
  const acousticAvgW = acousticPeakW / crestFactor;
  const ampDrawMa = (acousticAvgW / ampEff / rail) * 1000;
  const totalMa = btSoCMa + ampQuiescentMa + ampDrawMa;
  const usableMah = capacityMah * (socFrom - socTo);
  return {
    ampDrawMa, totalMa, usableMah,
    hours: usableMah / totalMa,
    acousticAvgW,
  };
}

/* ------------------------------------------------------------------ *
 * thermal
 * ------------------------------------------------------------------ */

/**
 * Lumped natural-convection model for a bare cylinder: R_th = 1/(h·A).
 * Honest about its limits — it is a whole-part average, not a hot spot, and
 * h is a guess unless measured.
 */
export function thermalRise({ diaMm, heightMm, lossW, hConv = 10, tAmbientC = 25 }) {
  const D = diaMm * MM, H = heightMm * MM;
  const area = Math.PI * D * H + 2 * Math.PI * (D / 2) * (D / 2);
  const rTh = 1 / (hConv * area);
  const rise = lossW * rTh;
  return { areaM2: area, rThKPerW: rTh, riseK: rise, tSurfaceC: tAmbientC + rise };
}

/* ------------------------------------------------------------------ *
 * mechanics: does the stack fit, and print the enclosure
 * ------------------------------------------------------------------ */

/**
 * Axial stack check for a cylindrical body: every part must clear the inner
 * diameter and the heights must sum to less than the inner height.
 */
export function stackFit({ innerDiaMm, innerHeightMm, parts }) {
  let total = 0;
  const rows = parts.map((p) => {
    const h = p.heightMm * (p.qty || 1);
    total += h;
    const diaOk = p.diaMm <= innerDiaMm + 1e-9;
    return { ...p, stackHeightMm: h, diaOk };
  });
  return {
    rows,
    totalMm: total,
    innerHeightMm,
    remainingMm: innerHeightMm - total,
    fits: total <= innerHeightMm + 1e-9 && rows.every((r) => r.diaOk),
  };
}

/**
 * Revolve a closed 2-D profile [(r, z), …] about the Z axis into a triangle
 * mesh. Degenerate facets on the axis are dropped; winding is normalised so
 * the signed volume comes out positive (outward normals).
 */
export function latheMesh(profile, steps = 180) {
  const tris = [];
  const P = profile.map(([r, z]) => [r, z]);
  const n = P.length;
  for (let s = 0; s < steps; s++) {
    const a0 = (2 * Math.PI * s) / steps;
    const a1 = (2 * Math.PI * (s + 1)) / steps;
    const c0 = Math.cos(a0), s0 = Math.sin(a0);
    const c1 = Math.cos(a1), s1 = Math.sin(a1);
    for (let i = 0; i < n; i++) {
      const [r0, z0] = P[i];
      const [r1, z1] = P[(i + 1) % n];
      // four corners of the revolved quad
      const A = [r0 * c0, r0 * s0, z0];
      const B = [r1 * c0, r1 * s0, z1];
      const C = [r1 * c1, r1 * s1, z1];
      const D = [r0 * c1, r0 * s1, z0];
      const push = (p, q, r) => {
        const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2];
        const vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        if (Math.hypot(nx, ny, nz) < 1e-15) return;   // degenerate: on-axis
        tris.push([p, q, r]);
      };
      push(A, B, C);
      push(A, C, D);
    }
  }
  const vol = meshVolume(tris);
  if (vol < 0) {
    for (const t of tris) t.reverse();
  }
  return { triangles: tris, volumeMm3: Math.abs(meshVolume(tris)) };
}

/** Signed volume by the divergence theorem. */
export function meshVolume(tris) {
  let v = 0;
  for (const [a, b, c] of tris) {
    v += (a[0] * (b[1] * c[2] - b[2] * c[1])
        - a[1] * (b[0] * c[2] - b[2] * c[0])
        + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  }
  return v;
}

/**
 * Closed profile of the speaker body: a cup with wall thickness, a coil pocket
 * at the bottom and a driver recess at the top. Radii in mm, z from the base.
 */
export function speakerShellProfile({ odMm, heightMm, wallMm = 1.0, coilPocketDepthMm = 1.2, coilPocketDiaMm, driverRecessDepthMm = 2.0, driverDiaMm }) {
  const rOut = odMm / 2;
  const rIn = rOut - wallMm;
  const rPocket = Math.min((coilPocketDiaMm ?? odMm - 1.2) / 2, rIn);
  const rDriver = Math.min(driverDiaMm / 2, rIn);
  return [
    [0, 0],
    [rOut, 0],
    [rOut, heightMm],
    [rIn, heightMm],
    [rIn, heightMm - driverRecessDepthMm],
    [rDriver, heightMm - driverRecessDepthMm],
    [rDriver, coilPocketDepthMm + wallMm],
    [rPocket, coilPocketDepthMm + wallMm],
    [rPocket, wallMm],
    [0, wallMm],
  ];
}

/** Same, for the charging pad: a puck with a recessed coil well. */
export function padShellProfile({ odMm, heightMm, wallMm = 1.5, wellDepthMm = 1.6, wellDiaMm }) {
  const rOut = odMm / 2;
  const rWell = Math.min((wellDiaMm ?? odMm * 0.8) / 2, rOut - wallMm);
  return [
    [0, 0],
    [rOut, 0],
    [rOut, heightMm],
    [rWell, heightMm],
    [rWell, heightMm - wellDepthMm],
    [0, heightMm - wellDepthMm],
  ];
}

/** Binary STL from a lathe mesh. */
export function stlBinary(mesh, name = 'charge pad') {
  const tris = mesh.triangles;
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const dv = new DataView(buf);
  const title = name.slice(0, 70).padEnd(80, ' ');
  for (let i = 0; i < 80; i++) dv.setUint8(i, title.charCodeAt(i) || 0);
  dv.setUint32(80, tris.length, true);
  let o = 84;
  for (const [a, b, c] of tris) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const m = Math.hypot(nx, ny, nz) || 1;
    nx /= m; ny /= m; nz /= m;
    dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true);
    for (const p of [a, b, c]) {
      dv.setFloat32(o + 12, p[0], true);
      dv.setFloat32(o + 16, p[1], true);
      dv.setFloat32(o + 20, p[2], true);
      o += 12;
    }
    dv.setUint16(o, 0, true);
    o += 2;
  }
  return new Uint8Array(buf);
}

/** OpenSCAD source for the same body, for people who would rather not trust a mesh. */
export function scadSource(profile, { name = 'body', steps = 180, heightMm = null } = {}) {
  const pts = profile.map(([r, z]) => `  [${r.toFixed(3)}, ${z.toFixed(3)}]`).join(',\n');
  const h = heightMm == null ? '' : `\n// overall height: ${heightMm.toFixed(2)} mm`;
  return `// ${name} — generated by js/wireless-charge.js (lathe of a closed profile)${h}\n$fn = ${steps};\nrotate_extrude(convexity = 4) {\n  polygon(points = [\n${pts}\n  ], paths = [[${profile.map((_, i) => i).join(', ')}]]);\n}\n`;
}

/* ------------------------------------------------------------------ *
 * compliance and feasibility
 * ------------------------------------------------------------------ */

/**
 * Hard checks the design either passes or fails, each with the number that
 * decided it and the source of the limit.
 */
export function compliance(design) {
  const out = [];
  const add = (id, label, pass, detail, ref) => out.push({ id, label, pass, detail, ref });

  const {
    fHz, rxQ, k, pOutW, bodyOdMm, rxCoilOdMm, wallMm, ferriteFactor,
    txCurrentA = 0, vC1Peak = 0, lossSpeakerW = 0, thermalSpeaker = null,
    rxCoilFits = true, txCoilFits = true,
  } = design;
  const rxCoil = design.rxCoil;

  add('qi-band', 'Qi operating band 110-205 kHz',
    fHz >= QI.fMinHz && fHz <= QI.fMaxHz,
    `design frequency ${(fHz / 1e3).toFixed(1)} kHz`,
    'WPC Qi; ST "Wireless Charging in Consumer Applications": 110-205 kHz');

  const q = rxQ ?? coilQ(rxCoil, fHz, { ferriteFactor });
  add('qi-rx-q', `Receiver coil Q >= ${QI.qRxMin}`,
    q >= QI.qRxMin,
    `Q = 2πfL/R = ${q.toFixed(1)}`,
    'TI bq5105xB datasheet, WPC v1.2 receiver coil requirement');

  add('qi-coupling', 'Coupling k >= 0.5 (WPC-typical window 0.5-0.7)',
    k >= QI.kTypicalRange[0],
    `k = ${k.toFixed(3)}`,
    'TI SLYT570, "Adapting Qi-compliant wireless-power solutions to low-power applications"');

  add('coil-clearance', 'Receiver coil clears the body wall',
    rxCoilOdMm <= bodyOdMm - 2 * wallMm + 1e-9,
    `coil Ø${rxCoilOdMm.toFixed(2)} mm vs inner Ø${(bodyOdMm - 2 * wallMm).toFixed(2)} mm`,
    'mechanical stack');

  add('winding-window', 'Requested turns fit the winding window',
    rxCoilFits && txCoilFits,
    rxCoilFits && txCoilFits
      ? 'both windings fit in the layers specified'
      : `RX fits: ${rxCoilFits}, TX fits: ${txCoilFits} — reduce turns, thin the wire, or add layers`,
    'winding geometry');

  add('bpp-power', 'Receive power within the 5 W BPP ceiling',
    pOutW <= QI.bppW,
    `${(pOutW * 1000).toFixed(0)} mW delivered to the rectifier`,
    'WPC Baseline Power Profile');

  add('tx-current', 'Pad coil current stays under 3 A',
    txCurrentA <= 3,
    `${txCurrentA.toFixed(2)} A peak in the pad coil`,
    'design target: above ~3 A the FETs, traces and coil losses all escalate');

  add('c1-rating', 'Receiver series capacitor within a 25 V part',
    vC1Peak <= 25,
    `${vC1Peak.toFixed(1)} V peak across C1 (specify >= ${Math.ceil(vC1Peak * 1.5)} V)`,
    'TI bq5105xB: Cs capacitors must be 25 V rated or higher');

  add('surface-temp', 'Charging surface stays under 45 °C',
    thermalSpeaker ? thermalSpeaker.tSurfaceC <= 45 : true,
    thermalSpeaker
      ? `+${thermalSpeaker.riseK.toFixed(1)} K over ambient on ${lossSpeakerW.toFixed(2)} W of loss`
      : 'no thermal model',
    'design target for a hand-held part; IEC 62368-1 touch limits apply to a shipping product');

  add('fcc', 'RF authorisation path identified',
    true,
    fHz >= 9e3
      ? 'Above 9 kHz this is an intentional radiator: Part 18 for the power mode, Part 15 if the band also carries data. Part 15 bars 90-110 kHz (§15.205), and Part 18 has no in-band power limit at 6.78 MHz.'
      : 'Below 9 kHz: no FCC RF authorisation path applies.',
    'FCC KDB 680106, Wireless Power Transfer');

  return out;
}

/* ------------------------------------------------------------------ *
 * bill of materials
 * ------------------------------------------------------------------ */

/**
 * Reference parts. Everything with a `source` string is a real, checked
 * catalogue part; `role` rows marked "reference" are options, not decisions.
 */
export const BOM = {
  rx: [
    { qty: 1, part: 'TDK WR121210-27M8-ID', role: 'RX coil Ø12.0 × 0.34 mm, 8.32 µH @ 100 kHz, 0.95 Ω DCR', source: 'TDK / Digi-Key 445-174577-ND' },
    { qty: 1, part: 'TI BQ51050BRGER', role: 'Qi receiver + Li-ion charge controller, Qi v1.2', source: 'TI bq5105xB datasheet' },
    { qty: 1, part: 'Ferrite sheet, µ\' > 100 at 100 kHz, 0.1-0.2 mm', role: 'flux shield behind the RX coil (raises Ls → Ls\')', source: 'NXP AN4866 / TDK Qi coils' },
    { qty: 2, part: 'C0G/NP0 25 V, 100 nF class', role: 'C1 series resonance — NP0, not X7R (X7R heats)', source: 'TI bq5105xB E2E guidance' },
    { qty: 1, part: 'C0G/NP0 25 V, 1.5-2.2 nF', role: 'C2 parallel resonance at 1 MHz (moving-coil detect)', source: 'TI bq5105xB datasheet' },
    { qty: 1, part: 'Li-ion 10440, Ø10.5 × 44 mm, 300-400 mAh', role: 'cell', source: '10440 format' },
    { qty: 1, part: 'Protection IC + NTC 10 kΩ', role: 'OVP / OCP / thermal, required for a bare 10440', source: 'IEC 62133 practice' },
    { qty: 1, part: 'ADI MAX98357AETE+T', role: 'I2S class-D mono amp, 3.2 W @ 4 Ω / 5 V, 92 % @ 1 W', source: 'ADI MAX98357A datasheet' },
    { qty: 1, part: 'Bluetooth 5 audio SoC with I2S out', role: 'A2DP sink; the current draw dominates idle runtime', source: 'vendor' },
    { qty: 1, part: 'Micro driver Ø10-11 mm, 4 Ω', role: 'earpiece-class transducer — see the acoustics caveat', source: 'vendor' },
  ],
  tx: [
    { qty: 1, part: 'TDK WT505090-10F2-A11-G1', role: 'A11 TX coil Ø51.4 mm, 6.3 µH @ 100 kHz, 60 mΩ', source: 'TDK / Arrow' },
    { qty: 1, part: 'TI BQ500110 or ST STWBC-SM', role: 'Qi BPP transmitter controller with FOD', source: 'TI / ST WPT lines' },
    { qty: 1, part: 'Ferrite plate under the TX coil', role: 'shield the pad PCB from its own field', source: 'NXP AN4866' },
    { qty: 1, part: 'USB-C PD 5 V / 2 A input, reverse-polarity and OVP', role: 'pad supply', source: '—' },
  ],
};

/* ------------------------------------------------------------------ *
 * presets — the three designs the page can load
 * ------------------------------------------------------------------ */

/**
 * `stack` is the axial build, base upward, and the FIRST entry is the driver —
 * `solveDesign` uses it to size the sealed cavity behind the diaphragm.
 */
export const PRESETS = {
  spec: {
    id: 'spec',
    name: 'As stated, on the Qi band (125 kHz)',
    note: 'The dimensions exactly as given, with the link run in the WPC band — the obvious first attempt, and it does not work. Keep this one loaded while reading the frequency chart.',
    body: { odMm: 0.5 * IN_TO_MM, heightMm: 2 * IN_TO_MM, wallMm: 0.8 },
    rx: { odMm: 10.0, idMm: 3.0, turns: 15, layers: 1, wireMm: 0.20, strands: 20, strandMm: 0.05 },
    tx: { odMm: 14.0, idMm: 4.0, turns: 11, layers: 1, wireMm: 0.30, strands: 30, strandMm: 0.05 },
    gapMm: 1.5, offsetMm: 0, fHz: 125e3, ferriteFactor: QI.ferriteFactorTypical, proximityFactor: 1.5,
    vSourcePeak: 12, rSource: 0.15,
    cell: { capacityMah: 320, iccA: 0.15, rIntOhm: 0.25 },
    audio: { btSoCMa: 12, ampQuiescentMa: 2.4, ampEff: 0.92, acousticPeakW: 0.5, crestFactor: 8 },
    stack: [
      { label: 'micro driver', diaMm: 10.0, heightMm: 2.5, qty: 1 },
      { label: 'PCB (RX IC + SoC + amp)', diaMm: 10.5, heightMm: 1.0, qty: 1 },
      { label: 'Li-ion 10440', diaMm: 10.5, heightMm: 44.0, qty: 1 },
      { label: 'ferrite sheet', diaMm: 10.0, heightMm: 0.15, qty: 1 },
      { label: 'RX coil (1 layer)', diaMm: 10.0, heightMm: 0.20, qty: 1 },
      { label: 'bottom wall / glue', diaMm: 10.0, heightMm: 0.5, qty: 1 },
    ],
  },
  qi: {
    id: 'qi',
    name: 'Qi BPP: A11 pad, Ø43 mm coil',
    note: 'Standards-compliant — and the receiver coil it wants does not fit a Ø12.7 mm body.',
    body: { odMm: 26.0, heightMm: 50.8, wallMm: 1.0 },
    rx: {
      odMm: 22.0, idMm: 10.0, turns: 11, layers: 2, wireMm: 0.55, strands: 48, strandMm: 0.071,
      // No verified catalogue part at this size, so take the WPC floor: a
      // compliant receiver must reach Q >= 77.
      catalog: { q: WPC_Q_RX_MIN, fTestHz: 100e3, source: 'WPC v1.2 receiver requirement Q >= 77 (TI bq5105xB)' },
    },
    tx: {
      odMm: 43.0, idMm: 20.0, turns: 11, layers: 1, wireMm: 0.90, strands: 48, strandMm: 0.071,
      catalog: {
        lH: 6.3e-6, rOhm: 0.040, fTestHz: 100e3,
        source: 'TDK WT505090-10F2-A11-G1 (6.3 µH @ 100 kHz, 60 mΩ); Vishay IWTX5050CZEB6R3KF1 (Q 120, 36-45 mΩ)',
      },
    },
    gapMm: 4.0, offsetMm: 0, fHz: 125e3, ferriteFactor: QI.ferriteFactorTypical, proximityFactor: 1.5,
    vSourcePeak: 12, rSource: 0.15,
    cell: { capacityMah: 900, iccA: 0.5, rIntOhm: 0.12 },
    audio: { btSoCMa: 12, ampQuiescentMa: 2.4, ampEff: 0.92, acousticPeakW: 2.0, crestFactor: 8 },
    stack: [
      { label: 'driver', diaMm: 22.0, heightMm: 4.0, qty: 1 },
      { label: 'PCB', diaMm: 22.0, heightMm: 1.2, qty: 1 },
      { label: 'pouch cell', diaMm: 20.0, heightMm: 38.0, qty: 1 },
      { label: 'ferrite + RX coil', diaMm: 22.0, heightMm: 1.0, qty: 1 },
    ],
  },
  resonant: {
    id: 'resonant',
    name: 'Matched micro pair: Ø14 mm pad, Ø10 mm speaker, 6.78 MHz',
    note: 'Proprietary link, coils sized to each other and to the body. This is what actually fits.',
    body: { odMm: 12.7, heightMm: 50.8, wallMm: 0.8 },
    rx: { odMm: 10.0, idMm: 3.0, turns: 15, layers: 1, wireMm: 0.20, strands: 20, strandMm: 0.05 },
    tx: { odMm: 14.0, idMm: 4.0, turns: 11, layers: 1, wireMm: 0.30, strands: 30, strandMm: 0.05 },
    gapMm: 1.5, offsetMm: 0, fHz: 6.78e6, ferriteFactor: QI.ferriteFactorTypical, proximityFactor: 2.0,
    vSourcePeak: 12, rSource: 0.15,
    cell: { capacityMah: 320, iccA: 0.15, rIntOhm: 0.25 },
    audio: { btSoCMa: 12, ampQuiescentMa: 2.4, ampEff: 0.92, acousticPeakW: 0.5, crestFactor: 8 },
    stack: [
      { label: 'micro driver', diaMm: 10.0, heightMm: 2.5, qty: 1 },
      { label: 'PCB (RX IC + SoC + amp)', diaMm: 10.5, heightMm: 1.0, qty: 1 },
      { label: 'Li-ion 10440', diaMm: 10.5, heightMm: 44.0, qty: 1 },
      { label: 'ferrite sheet', diaMm: 10.0, heightMm: 0.15, qty: 1 },
      { label: 'RX coil (1 layer)', diaMm: 10.0, heightMm: 0.20, qty: 1 },
      { label: 'bottom wall / glue', diaMm: 10.0, heightMm: 0.5, qty: 1 },
    ],
  },
};

/** Series-resonance capacitor for L at f. */
export function seriesCapacitorFor(Lh, fHz) {
  const w = 2 * Math.PI * fHz;
  return 1 / (w * w * Lh);
}

/**
 * Drive voltage needed to deliver `targetPLoadW` to the rectifier load.
 * Real transmitters do exactly this — they walk V_in (and sometimes f) to hit
 * the power the receiver asks for — so the design number that matters is
 * "what does the pad have to swing", not "what does it do at a fixed 12 V".
 * Bisection on a monotone function; the link is linear in Vs.
 */
export function vSourceForTargetPower(linkArgs, targetPLoadW, { lo = 0.01, hi = 200 } = {}) {
  const pAt = (v) => seriesSeriesLink({ ...linkArgs, vSourcePeak: v }).pLoad;
  const pMax = pAt(hi);
  if (!Number.isFinite(pMax) || pMax < targetPLoadW) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (seriesSeriesLink({ ...linkArgs, vSourcePeak: mid }).pLoad < targetPLoadW) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------------------ *
 * the whole design, in one call — this is what the page renders
 * ------------------------------------------------------------------ */

/**
 * Solve a preset (or a hand-edited spec) end to end.
 *
 * The ferrite multiplier deserves a note, because it is the least rigorous
 * thing in here. `ferriteFactor` scales the receiver's inductance (that is
 * what it is measured to do: TI's bq5105xB example goes 11 µH free space →
 * 16 µH on the shield). The mutual inductance is then taken to scale as
 * sqrt(ferriteFactor), which is what keeps the coupling coefficient k
 * unchanged — the usual assumption when a core is added, and the conservative
 * one: a sheet that only partially links the coil would raise L more than M
 * and make k *worse*, not better.
 *
 * Returns coils, coupling, link solution, receiver chain, charge time,
 * runtime, thermal, fit and compliance rows.
 */
export function solveDesign(spec, overrides = {}) {
  const s = deepMerge(structuredClone(spec), overrides);
  const tx = planarCoil(s.tx);
  const rx = planarCoil(s.rx);
  const Ltx = coilInductance(tx);
  const LrxFree = coilInductance(rx);
  const Lrx = LrxFree * s.ferriteFactor;
  const { M: mFree, k: kCoupled } = coupleCoils(tx, rx, s.gapMm * MM, s.offsetMm * MM, 64);
  // M scaled for the ferrite; k is deliberately unchanged (see the note above).
  const M = kCoupled * Math.sqrt(Ltx * Lrx);
  const k = kCoupled;

  const prox = s.proximityFactor ?? 1;
  const txE = coilElectrical(tx, s.tx, s.fHz, { proximity: prox });
  const rxE = coilElectrical(rx, s.rx, s.fHz, { ferriteFactor: s.ferriteFactor, proximity: prox });
  const w = 2 * Math.PI * s.fHz;
  const LtxE = txE.L, LrxE = rxE.L;
  const rTx = txE.R, rRx = rxE.R;
  const qTx = txE.q, qRx = rxE.q;

  // Tune both sides at the design frequency. Cd (the 1 MHz parallel
  // anti-resonance) only exists on a Qi receiver, where the spec asks for it.
  const cs2 = seriesCapacitorFor(LrxE, s.fHz);
  const inQiBand = s.fHz >= QI.fMinHz && s.fHz <= QI.fMaxHz;
  const qiTuning = inQiBand ? qiTuningCapacitors(Lrx, { fsHz: s.fHz }) : { c1: cs2, c2: 0 };
  const cd2 = qiTuning.c2;
  const cs1 = seriesCapacitorFor(LtxE, s.fHz);

  const linkArgs = {
    fHz: s.fHz, L1: LtxE, R1: rTx, cs1, L2: LrxE, R2: rRx, cs2, cd2,
    M: kCoupled * Math.sqrt(LtxE * LrxE), rSource: s.rSource,
  };

  // What the receiver has to be handed: the cell's charge power, back through
  // the charger and the rectifier, to the AC load the bridge presents.
  const vRectTarget = 5.0;
  const pCellTarget = s.cell.iccA * 4.0;
  const pDcTarget = pCellTarget / 0.92;
  const iDcTarget = Math.max(0.02, pDcTarget / vRectTarget);
  const rLoad = rectifierAcLoad(vRectTarget, iDcTarget);

  const vSource = vSourceForTargetPower({ ...linkArgs, rLoad }, pDcTarget + 2 * 0.35 * iDcTarget, { hi: 400 })
    ?? s.vSourcePeak;
  const link = seriesSeriesLink({ ...linkArgs, rLoad, vSourcePeak: vSource });

  const chain = receiverChain({
    bridgeInputPeakVoltage: link.iLoad * rLoad,
    coilPeakCurrent: link.iLoad,
    chargerEff: 0.92,
    vCell: 4.0,
  });

  const lossRx = link.pCoil2 + chain.bridgeLoss + (chain.pDc - chain.pCell);
  const lossTx = link.pCoil1 + link.pSource;
  const endToEnd = link.pIn > 0 ? chain.pCell / link.pIn : 0;

  const charge = chargeProfile({
    capacityMah: s.cell.capacityMah,
    iccA: Math.max(0.02, chain.chargeCurrentA),
    rIntOhm: s.cell.rIntOhm,
  });

  const runtime = playTime({ capacityMah: s.cell.capacityMah, ...s.audio });

  const body = s.body;
  const thermalSpeaker = thermalRise({ diaMm: body.odMm, heightMm: body.heightMm, lossW: lossRx });
  const fit = stackFit({
    innerDiaMm: body.odMm - 2 * body.wallMm,
    innerHeightMm: body.heightMm - body.wallMm,
    parts: s.stack,
  });

  const checks = compliance({
    fHz: s.fHz, rxQ: qRx, txQ: qTx, k, pOutW: link.pLoad,
    rxCoil: rx, bodyOdMm: body.odMm, rxCoilOdMm: s.rx.odMm, wallMm: body.wallMm,
    ferriteFactor: s.ferriteFactor,
    txCurrentA: link.i1,
    vC1Peak: Math.max(link.vCs2Peak, link.vCd2Peak),
    lossSpeakerW: lossRx,
    thermalSpeaker,
    rxCoilFits: rx.fits,
    txCoilFits: tx.fits,
  });

  // First standing-wave mode of the sealed cavity behind the driver: f = c/4L,
  // L = the occupied stack behind the diaphragm. Worth damping, and cheap to
  // get wrong (it lands right in the voice band at this body size).
  const driverH = (s.stack[0] && s.stack[0].heightMm) || 0;
  const cavityDepthMm = Math.max(0, fit.totalMm - driverH);
  const cavityModeHz = cavityDepthMm > 0 ? C_SOUND / (4 * cavityDepthMm * MM) : NaN;

  return {
    spec: s, tx, rx,
    inductance: {
      txH: LtxE, rxFreeH: LrxFree, rxOnFerriteH: LrxE, ferriteFactor: s.ferriteFactor,
      txModeledH: Ltx, rxModeledH: Lrx, txSource: txE.source, rxSource: rxE.source,
      txCatalog: s.tx.catalog ?? null, rxCatalog: s.rx.catalog ?? null,
    },
    resistance: {
      txOhm: rTx, rxOhm: rRx, txDcrOhm: tx.dcr, rxDcrOhm: rx.dcr,
      txModeledOhm: txE.modeledR, rxModeledOhm: rxE.modeledR,
    },
    q: { tx: qTx, rx: qRx, kQ2: (w * M) * (w * M) / ((rTx + s.rSource) * rRx) },
    coupling: { M, mFreeSpace: mFree, k, kFerriteAdjusted: k },
    tuning: { cs1, cs2, cd2, inQiBand, ...qiTuning },
    link, chain,
    power: {
      pInW: link.pIn, pAcAtReceiverW: link.pLoad, pDcW: chain.pDc, pCellW: chain.pCell,
      lossRxW: lossRx, lossTxW: lossTx, endToEnd,
      linkEfficiency: link.efficiency,
      requiredSourcePeakV: vSource,
      targetPLoadW: pDcTarget,
    },
    charge, runtime, thermalSpeaker, fit, checks,
    acoustics: { cavityDepthMm, cavityModeHz, cavityVolumeCc: cavityVolumeCc(body, fit.totalMm - driverH) },
    geometry: {
      body, gapMm: s.gapMm, offsetMm: s.offsetMm,
      rxStackBuildMm: rx.axialBuildM / MM,
      txStackBuildMm: tx.axialBuildM / MM,
    },
  };
}

function cavityVolumeCc(body, depthMm) {
  const r = (body.odMm - 2 * body.wallMm) / 2;
  return (Math.PI * r * r * depthMm) / 1000;   // mm³ → cc
}

/* ------------------------------------------------------------------ *
 * sweeps — the page draws these, the verify tool checks them
 * ------------------------------------------------------------------ */

/** Power and efficiency against load resistance, at one geometry. */
export function sweepLoad(d, rLoads) {
  const base = {
    fHz: d.spec.fHz, L1: d.inductance.txH, R1: d.resistance.txOhm, cs1: d.tuning.cs1,
    L2: d.inductance.rxOnFerriteH, R2: d.resistance.rxOhm, cs2: d.tuning.cs2, cd2: d.tuning.cd2,
    M: d.coupling.M, rSource: d.spec.rSource,
  };
  return rLoads.map((rLoad) => {
    const l = seriesSeriesLink({ ...base, rLoad, vSourcePeak: d.power.requiredSourcePeakV });
    return { rLoad, pLoadW: l.pLoad, efficiency: l.efficiency, i1A: l.i1, i2A: l.i2 };
  });
}

/** Coupling and efficiency against coil-to-coil gap. */
export function sweepGap(spec, gapsMm, neumannSamples = 64) {
  const tx = planarCoil(spec.tx);
  const rx = planarCoil(spec.rx);
  const prox = spec.proximityFactor ?? 1;
  const txE = coilElectrical(tx, spec.tx, spec.fHz, { proximity: prox });
  const rxE = coilElectrical(rx, spec.rx, spec.fHz, { ferriteFactor: spec.ferriteFactor, proximity: prox });
  const Ltx = txE.L, Lrx = rxE.L, rTx = txE.R, rRx = rxE.R;
  const cs2 = seriesCapacitorFor(Lrx, spec.fHz);
  const cs1 = seriesCapacitorFor(Ltx, spec.fHz);
  return gapsMm.map((gapMm) => {
    const { k } = coupleCoils(tx, rx, gapMm * MM, (spec.offsetMm || 0) * MM, neumannSamples);
    const M = k * Math.sqrt(Ltx * Lrx);
    const args = {
      fHz: spec.fHz, L1: Ltx, R1: rTx, cs1, L2: Lrx, R2: rRx, cs2, cd2: 0,
      M, rSource: spec.rSource,
    };
    const iDcTarget = Math.max(0.02, (spec.cell.iccA * 4.0 / 0.92) / 5.0);
    const rLoad = rectifierAcLoad(5.0, iDcTarget);
    const v = vSourceForTargetPower({ ...args, rLoad }, spec.cell.iccA * 4.0 / 0.92, { hi: 400 });
    const l = v == null ? null : seriesSeriesLink({ ...args, rLoad, vSourcePeak: v });
    return {
      gapMm, k, M,
      requiredSourcePeakV: v,
      pLoadW: l ? l.pLoad : null,
      efficiency: l ? l.efficiency : null,
      endToEnd: l ? (0.92 * (l.pLoad - 2 * 0.35 * (2 / Math.PI) * l.i2)) / l.pIn : null,
    };
  });
}

/**
 * Efficiency against drive frequency, re-tuning both capacitors at each point.
 * This is the curve that decides Qi band vs 6.78 MHz for a small coil pair.
 */
export function sweepFrequency(spec, freqsHz) {
  const tx = planarCoil(spec.tx);
  const rx = planarCoil(spec.rx);
  const { k } = coupleCoils(tx, rx, spec.gapMm * MM, (spec.offsetMm || 0) * MM, 64);
  const iDcTarget = Math.max(0.02, (spec.cell.iccA * 4.0 / 0.92) / 5.0);
  const rLoad = rectifierAcLoad(5.0, iDcTarget);
  return freqsHz.map((fHz) => {
    const prox = spec.proximityFactor ?? 1;
    const txE = coilElectrical(tx, spec.tx, fHz, { proximity: prox });
    const rxE = coilElectrical(rx, spec.rx, fHz, { ferriteFactor: spec.ferriteFactor, proximity: prox });
    const Ltx = txE.L, Lrx = rxE.L, rTx = txE.R, rRx = rxE.R;
    const M = k * Math.sqrt(Ltx * Lrx);
    const args = {
      fHz, L1: Ltx, R1: rTx, cs1: seriesCapacitorFor(Ltx, fHz),
      L2: Lrx, R2: rRx, cs2: seriesCapacitorFor(Lrx, fHz), cd2: 0,
      M, rSource: spec.rSource, rLoad,
    };
    const v = vSourceForTargetPower(args, spec.cell.iccA * 4.0 / 0.92, { hi: 400 });
    const l = v == null ? null : seriesSeriesLink({ ...args, vSourcePeak: v });
    return {
      fHz,
      qTx: (2 * Math.PI * fHz * Ltx) / rTx,
      qRx: (2 * Math.PI * fHz * Lrx) / rRx,
      requiredSourcePeakV: v,
      pLoadW: l ? l.pLoad : null,
      efficiency: l ? l.efficiency : null,
      i1A: l ? l.i1 : null,
    };
  });
}

/** Coupling against sideways misalignment — how much aiming tolerance you get. */
export function sweepOffset(spec, offsetsMm, neumannSamples = 48) {
  const tx = planarCoil(spec.tx);
  const rx = planarCoil(spec.rx);
  const Ltx = coilInductance(tx);
  const Lrx = coilInductance(rx) * spec.ferriteFactor;
  return offsetsMm.map((offsetMm) => {
    const { k } = coupleCoils(tx, rx, spec.gapMm * MM, offsetMm * MM, neumannSamples);
    return { offsetMm, k };
  });
}

function deepMerge(a, b) {
  for (const key of Object.keys(b)) {
    const v = b[key];
    if (v && typeof v === 'object' && !Array.isArray(v) && a[key] && typeof a[key] === 'object' && !Array.isArray(a[key])) {
      deepMerge(a[key], v);
    } else {
      a[key] = v;
    }
  }
  return a;
}

/* ------------------------------------------------------------------ *
 * exporters
 * ------------------------------------------------------------------ */

export function bomCsv(sides = ['rx', 'tx']) {
  const rows = [['Qty', 'Part', 'Role', 'Source']];
  for (const side of sides) {
    rows.push([`--- ${side.toUpperCase()} ---`, '', '', '']);
    for (const item of BOM[side]) rows.push([String(item.qty), item.part, item.role, item.source]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * ngspice deck for the link, with the rectifier and cell collapsed into R_load.
 *
 *   V1 - Rs - L1 - Cs1 - R1 - gnd        (transmitter mesh)
 *   L2 - Cs2 - R2 - Rload - back to L2   (receiver loop, magnetically driven)
 *   Cd2 across the load                  (only on a Qi receiver)
 *   K1 couples L1 and L2
 *
 * `tools/verify_wireless_charge.mjs` checks the deck structurally — that every
 * element node is declared, that L1/L2 appear once in the K statement, and that
 * the element values are the ones the engine solved for. It does not run
 * ngspice; if you have it, `ngspice -b link.cir` will sweep it.
 */
export function spiceNetlist(d) {
  const s = d.spec;
  const f = s.fHz;
  const sci = (v) => v.toExponential(6);
  const rLoad = d.link.pLoad / (d.link.iLoad * d.link.iLoad);
  const lines = [
    `* charge pad / speaker link — generated by js/wireless-charge.js`,
    `* ${s.name ?? 'design'}`,
    `* f = ${(f / 1e3).toFixed(1)} kHz · k = ${d.coupling.k.toFixed(4)} · L1 = ${sci(d.inductance.txH)} H`,
    `V1 in 0 DC 0 AC ${sci(d.power.requiredSourcePeakV)}`,
    `Rs in n1 ${sci(s.rSource)}`,
    `L1 n1 n2 ${sci(d.inductance.txH)}`,
    `Cs1 n2 n3 ${sci(d.tuning.cs1)}`,
    `R1 n3 0 ${sci(d.resistance.txOhm)}`,
    `L2 n4 n5 ${sci(d.inductance.rxOnFerriteH)}`,
    `Cs2 n5 n6 ${sci(d.tuning.cs2)}`,
    `R2 n6 n7 ${sci(d.resistance.rxOhm)}`,
    // The receiver is a floating loop: the load closes it back to n4, which is
    // the only way a magnetically driven secondary has a complete path.
    `Rload n7 n4 ${sci(rLoad)}`,
  ];
  if (d.tuning.cd2 > 0) lines.push(`Cd2 n7 n4 ${sci(d.tuning.cd2)}`);
  lines.push(
    `K1 L1 L2 ${d.coupling.k.toFixed(6)}`,
    `.ac dec 400 ${sci(f / 3)} ${sci(f * 3)}`,
    `.control`,
    `run`,
    `meas ac v_load MAX mag(v(n7) - v(n4))`,
    `.endc`,
    '.end',
  );
  return lines.join('\n') + '\n';
}

/* ------------------------------------------------------------------ *
 * formatting helpers shared with the page
 * ------------------------------------------------------------------ */

export function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  const a = Math.abs(value);
  if (a === 0) return '0';
  if (a >= 1e6) return (value / 1e6).toFixed(digits) + ' M';
  if (a >= 1e3) return (value / 1e3).toFixed(digits) + ' k';
  if (a >= 1) return value.toFixed(digits);
  if (a >= 1e-3) return (value * 1e3).toFixed(digits) + ' m';
  if (a >= 1e-6) return (value * 1e6).toFixed(digits) + ' µ';
  if (a >= 1e-9) return (value * 1e9).toFixed(digits) + ' n';
  return (value * 1e12).toFixed(digits) + ' p';
}

export function fmtUnit(value, unit, digits = 2) {
  return Number.isFinite(value) ? `${fmt(value, digits)}${unit}` : '—';
}
