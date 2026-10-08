/**
 * js/wireless-charge-lab.js — the page behind wireless-charge-pad.html.
 *
 * All the engineering is in ./wireless-charge.js (imported by the Node checks
 * too). This file is only state, DOM and drawing.
 */
import * as W from "./wireless-charge.js";

/* ------------------------------------------------------------------ *
 * tiny DOM helpers
 * ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
};

function kvTable(target, rows) {
  const t = $(target);
  t.replaceChildren();
  for (const r of rows) {
    if (r === null) continue;
    if (typeof r === "string") {
      t.append(el("tr", {}, el("th", { colspan: "2", class: "group", text: r })));
      continue;
    }
    const [label, value, note] = r;
    t.append(el("tr", {},
      el("td", { text: label }),
      el("td", { class: "n", text: value },
        note ? el("span", { class: "src", text: `  ${note}` }) : null)));
  }
}

const u = (v, unit, d = 2) => (Number.isFinite(v) ? `${W.fmt(v, d)} ${unit}` : "—");

/* ------------------------------------------------------------------ *
 * state
 * ------------------------------------------------------------------ */

let state = structuredClone(W.PRESETS.resonant);

function setPath(path, value) {
  const parts = path.split(".");
  let o = state;
  for (const p of parts.slice(0, -1)) o = o[p];
  o[parts[parts.length - 1]] = value;
}
function getPath(path) {
  return path.split(".").reduce((o, p) => o[p], state);
}

/* ------------------------------------------------------------------ *
 * inputs
 * ------------------------------------------------------------------ */

const FIELDS = {
  body: [
    ["body.odMm", "body Ø", "mm", 0.05],
    ["body.heightMm", "body height", "mm", 0.1],
    ["body.wallMm", "wall", "mm", 0.05],
    ["gapMm", "coil-to-coil gap", "mm", 0.05],
    ["offsetMm", "sideways offset", "mm", 0.05],
  ],
  tx: [
    ["tx.odMm", "outer Ø", "mm", 0.1],
    ["tx.idMm", "inner Ø", "mm", 0.1],
    ["tx.turns", "turns", "", 1],
    ["tx.wireMm", "conductor build Ø", "mm", 0.01],
    ["tx.strands", "litz strands", "", 1],
    ["tx.strandMm", "strand Ø", "mm", 0.005],
  ],
  rx: [
    ["rx.odMm", "outer Ø", "mm", 0.1],
    ["rx.idMm", "inner Ø", "mm", 0.1],
    ["rx.turns", "turns", "", 1],
    ["rx.wireMm", "conductor build Ø", "mm", 0.01],
    ["rx.strands", "litz strands", "", 1],
    ["rx.strandMm", "strand Ø", "mm", 0.005],
  ],
  link: [
    ["fKhz", "frequency", "kHz", 1],
    ["ferriteFactor", "ferrite factor", "×", 0.05],
    ["proximityFactor", "proximity derate", "×", 0.1],
    ["rSource", "inverter R", "Ω", 0.01],
    ["cell.capacityMah", "cell capacity", "mAh", 5],
    ["cell.iccMa", "charge current", "mA", 5],
    ["cell.rIntMohm", "cell R int", "mΩ", 5],
    ["audio.btSoCMa", "BT SoC draw", "mA", 0.5],
    ["audio.ampQuiescentMa", "amp quiescent", "mA", 0.1],
    ["audio.ampEff", "amp efficiency", "", 0.01],
    ["audio.acousticPeakW", "acoustic peak", "W", 0.05],
    ["audio.crestFactor", "crest factor", "×", 0.5],
  ],
};

function buildInputs() {
  for (const group of Object.keys(FIELDS)) {
    const host = $(`in-${group}`);
    host.replaceChildren();
    for (const [path, label, unit, step] of FIELDS[group]) {
      const id = `f-${path.replace(/\./g, "-")}`;
      const input = el("input", { id, type: "number", step: String(step), value: String(readField(path)) });
      input.addEventListener("input", () => {
        const v = Number(input.value);
        if (Number.isFinite(v)) { writeField(path, v); schedule(); }
      });
      host.append(el("div", { class: "ctl" },
        el("label", { for: id, text: `${label}${unit ? ` (${unit})` : ""}` }), input));
    }
  }
}

/** The three fields the spec stores in awkward units. */
function readField(path) {
  if (path === "fKhz") return state.fHz / 1e3;
  if (path === "cell.iccMa") return state.cell.iccA * 1e3;
  if (path === "cell.rIntMohm") return state.cell.rIntOhm * 1e3;
  return getPath(path);
}
function writeField(path, v) {
  if (path === "fKhz") { state.fHz = v * 1e3; return; }
  if (path === "cell.iccMa") { state.cell.iccA = v / 1e3; return; }
  if (path === "cell.rIntMohm") { state.cell.rIntOhm = v / 1e3; return; }
  setPath(path, v);
}

function buildPresets() {
  const host = $("presets");
  host.replaceChildren();
  for (const key of Object.keys(W.PRESETS)) {
    const p = W.PRESETS[key];
    const b = el("button", { type: "button", text: p.name, title: p.note });
    if (key === state.id) b.classList.add("on");
    b.addEventListener("click", () => {
      state = structuredClone(p);
      buildInputs();
      buildPresets();
      render();
    });
    host.append(b);
  }
}

/* ------------------------------------------------------------------ *
 * charts
 * ------------------------------------------------------------------ */

function drawChart(canvas, { series, xLabel, yLabel, logX = false, markers = [] }) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 900;
  const cssH = 200;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const g = canvas.getContext("2d");
  if (!g) return;   // no canvas backend (jsdom, or a stripped-down browser)
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, cssW, cssH);

  const pad = { l: 52, r: 52, t: 12, b: 26 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;

  const pts = series.flatMap((s) => s.points).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!pts.length) return;
  let x0 = Math.min(...pts.map((p) => p[0]));
  let x1 = Math.max(...pts.map((p) => p[0]));
  if (logX) { x0 = Math.max(x0, 1e-12); x1 = Math.max(x1, x0 * 1.001); }
  else if (x1 === x0) { x1 = x0 + 1; }
  let y0 = Math.min(0, ...pts.map((p) => p[1]));
  let y1 = Math.max(...pts.map((p) => p[1]));
  if (y1 === y0) y1 = y0 + 1;
  const span = y1 - y0;
  y1 += span * 0.08;

  const X = (x) => pad.l + (logX
    ? (Math.log(Math.max(x, x0)) - Math.log(x0)) / (Math.log(x1) - Math.log(x0))
    : (x - x0) / (x1 - x0)) * plotW;
  const Y = (y) => pad.t + plotH - ((y - y0) / (y1 - y0)) * plotH;

  g.strokeStyle = "#1d2637";
  g.fillStyle = "#7b879b";
  g.font = "10px ui-monospace, monospace";
  g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (plotH * i) / 4;
    g.beginPath(); g.moveTo(pad.l, y); g.lineTo(pad.l + plotW, y); g.stroke();
    const v = y1 - ((y1 - y0) * i) / 4;
    g.textAlign = "right";
    g.fillText(W.fmt(v, 2), pad.l - 5, y + 3);
  }
  for (let i = 0; i <= 4; i++) {
    const x = pad.l + (plotW * i) / 4;
    const v = logX
      ? Math.exp(Math.log(x0) + ((Math.log(x1) - Math.log(x0)) * i) / 4)
      : x0 + ((x1 - x0) * i) / 4;
    g.textAlign = "center";
    g.fillText(W.fmt(v, 2), x, cssH - 8);
  }
  g.textAlign = "left";
  g.fillText(xLabel, pad.l, cssH - 8 + 0);
  g.save();
  g.translate(11, pad.t + plotH / 2);
  g.rotate(-Math.PI / 2);
  g.textAlign = "center";
  g.fillText(yLabel, 0, 0);
  g.restore();

  // Number the series before drawing: the legend position depends on it, and a
  // canvas silently drops a draw call with a NaN coordinate, so an unassigned
  // index makes the label vanish instead of failing loudly.
  series.forEach((s, i) => { s._i = i; });
  for (const s of series) {
    g.strokeStyle = s.color;
    g.fillStyle = s.color;
    g.lineWidth = 1.8;
    g.beginPath();
    let started = false;
    for (const [x, y] of s.points) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) { started = false; continue; }
      const px = X(x), py = Y(y);
      if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py);
    }
    g.stroke();
    g.font = "10px ui-monospace, monospace";
    const last = s.points[s.points.length - 1];
    if (Number.isFinite(last[1])) g.fillText(s.label, pad.l + 6, pad.t + 12 + s._i * 12);
  }

  for (const m of markers) {
    if (!Number.isFinite(m.x)) continue;
    const px = X(m.x);
    g.strokeStyle = "#d8a24a";
    g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(px, pad.t); g.lineTo(px, pad.t + plotH); g.stroke();
    g.setLineDash([]);
    g.fillStyle = "#d8a24a";
    g.textAlign = "center";
    g.fillText(m.label || "", px, pad.t + 10);
  }
}

/* ------------------------------------------------------------------ *
 * the cross-section drawing
 * ------------------------------------------------------------------ */

function drawCrossSection(d) {
  const svg = $("drawing");
  const NS = "http://www.w3.org/2000/svg";
  svg.replaceChildren();
  const mk = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    svg.append(n);
    return n;
  };
  const txt = (x, y, s, extra = {}) => {
    const n = mk("text", { x, y, fill: "#8fa3c0", "font-size": "11", "font-family": "ui-monospace, monospace", ...extra });
    n.textContent = s;
    return n;
  };

  // Scale: fit the pad + body into 860 px wide.
  const padOd = Math.max(24, state.tx.odMm + 12);
  const padH = Math.max(8, state.tx.wireMm * state.tx.layers + 6);
  const totalW = padOd + d.geometry.body.odMm + 40;
  const totalH = d.geometry.body.heightMm + padH + 20;
  const s = Math.min(760 / totalW, 250 / totalH);
  const ox = 60, oy = 280;
  const px = (mm) => ox + mm * s;
  const py = (mm) => oy - mm * s;

  // pad, drawn as a section through the axis
  const padX0 = px(0);
  mk("rect", { x: padX0, y: py(padH), width: padOd * s, height: padH * s, fill: "#141a28", stroke: "#3c4a68" });
  mk("rect", {
    x: px((padOd - state.tx.odMm) / 2), y: py(padH - 1),
    width: state.tx.odMm * s, height: Math.max(2, state.tx.wireMm * s),
    fill: "#c8873a",
  });
  txt(px(padOd / 2), py(0) + 14, `pad Ø${padOd.toFixed(1)}`, { "text-anchor": "middle" });
  txt(px((padOd - state.tx.odMm) / 2), py(padH) - 6, `TX Ø${state.tx.odMm} · ${state.tx.turns}T`, { fill: "#c8873a" });

  // speaker body, to the right of the pad, sitting on it
  const bx = padOd + 40;
  const b = d.geometry.body;
  const wall = b.wallMm;
  mk("path", {
    d: [
      `M ${px(bx)} ${py(padH)}`,
      `L ${px(bx + b.odMm)} ${py(padH)}`,
      `L ${px(bx + b.odMm)} ${py(padH + b.heightMm)}`,
      `L ${px(bx + wall)} ${py(padH + b.heightMm)}`,
      `L ${px(bx + wall)} ${py(padH + wall)}`,
      `L ${px(bx)} ${py(padH + wall)}`,
      "Z",
    ].join(" "),
    fill: "#151b2a", stroke: "#4a5a7d",
  });
  // stack, from the base upward
  let z = padH + wall;
  const hues = ["#3fbf7f", "#5b8dd6", "#c8873a", "#9b6bc4", "#d05a5a", "#6b7688"];
  d.fit.rows.forEach((r, i) => {
    const h = r.stackHeightMm;
    mk("rect", {
      x: px(bx + wall), y: py(z + h), width: (b.odMm - 2 * wall) * s, height: Math.max(1, h * s),
      fill: hues[i % hues.length], "fill-opacity": "0.5", stroke: "#0a0d16",
    });
    txt(px(bx + b.odMm) + 8, py(z + h / 2) + 4, `${r.label} ${h.toFixed(2)}`, { "font-size": "10" });
    z += h;
  });
  // RX coil at the base of the body
  mk("rect", {
    x: px(bx + wall), y: py(padH + wall + 0.6), width: state.rx.odMm * s, height: Math.max(2, 0.6 * s),
    fill: "#c8873a",
  });
  // dimensions
  const dimY = py(padH + b.heightMm) - 12;
  mk("line", { x1: px(bx), y1: dimY, x2: px(bx + b.odMm), y2: dimY, stroke: "#8fa3c0" });
  txt(px(bx + b.odMm / 2), dimY - 4, `Ø${b.odMm.toFixed(2)}`, { "text-anchor": "middle" });
  mk("line", { x1: px(bx + b.odMm) + 3, y1: py(padH), x2: px(bx + b.odMm) + 3, y2: py(padH + b.heightMm), stroke: "#8fa3c0" });
  txt(px(bx + b.odMm) + 8, py(padH + b.heightMm / 2), `${b.heightMm.toFixed(2)}`);
  txt(px(bx + b.odMm / 2), py(padH + b.heightMm) - 30, `gap ${state.gapMm.toFixed(2)} mm`, { "text-anchor": "middle", fill: "#d8a24a" });
  txt(14, 18, `1 px = ${(1 / s).toFixed(3)} mm`);
}

/* ------------------------------------------------------------------ *
 * receiver schematic
 * ------------------------------------------------------------------ */

function drawSchematic(d) {
  const svg = $("schematic");
  const NS = "http://www.w3.org/2000/svg";
  svg.replaceChildren();
  const mk = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    svg.append(n);
    return n;
  };
  const box = (x, y, w, h, title, sub) => {
    mk("rect", { x, y, width: w, height: h, fill: "#141a28", stroke: "#3c4a68" });
    const t = mk("text", { x: x + w / 2, y: y + 18, fill: "#dbe6f6", "font-size": "12", "text-anchor": "middle", "font-family": "ui-monospace, monospace" });
    t.textContent = title;
    if (sub) {
      const s2 = mk("text", { x: x + w / 2, y: y + 34, fill: "#8fa3c0", "font-size": "10", "text-anchor": "middle", "font-family": "ui-monospace, monospace" });
      s2.textContent = sub;
    }
  };
  const wire = (x1, y1, x2, y2) => mk("line", { x1, y1, x2, y2, stroke: "#4a5a7d", "stroke-width": "1.5" });
  const label = (x, y, s) => {
    const t = mk("text", { x, y, fill: "#8fa3c0", "font-size": "10", "font-family": "ui-monospace, monospace" });
    t.textContent = s;
  };

  const y = 70;
  box(20, y, 130, 56, "RX coil", `Ø${state.rx.odMm} · ${state.rx.turns}T · ${W.fmt(d.inductance.rxOnFerriteH, 3)}H`);
  box(180, y, 110, 56, "Cs", `${W.fmt(d.tuning.cs2, 3)}F · 25 V NP0`);
  box(320, y, 150, 56, "Qi RX + charger", "BQ51050B class");
  box(500, y, 120, 56, "protection", "OVP/OCP + NTC");
  box(650, y, 110, 56, "cell", `${state.cell.capacityMah} mAh 10440`);
  wire(150, y + 28, 180, y + 28);
  wire(290, y + 28, 320, y + 28);
  wire(470, y + 28, 500, y + 28);
  wire(620, y + 28, 650, y + 28);
  label(20, y - 10, `k = ${d.coupling.k.toFixed(3)} at ${state.gapMm} mm gap · f = ${(state.fHz / 1e3).toFixed(1)} kHz`);
  label(320, y + 74, `V_RECT ${d.chain.vRect.toFixed(2)} V · I ${d.chain.iDc * 1e3.toFixed(0)} mA`);

  const y2 = 180;
  box(320, y2, 150, 46, "BT SoC", `${state.audio.btSoCMa} mA`);
  box(500, y2, 120, 46, "I2S class-D", `MAX98357A · ${state.audio.ampEff * 100 | 0}%`);
  box(650, y2, 110, 46, "driver", `Ø${(d.fit.rows[0]?.diaMm ?? 0).toFixed(0)} mm 4 Ω`);
  wire(650, y + 56, 650, y2 + 23);
  wire(470, y2 + 23, 500, y2 + 23);
  wire(620, y2 + 23, 650, y2 + 23);
  label(320, y2 - 8, "rail from the cell through a buck/LDO");
}

/* ------------------------------------------------------------------ *
 * render
 * ------------------------------------------------------------------ */

let pending = null;
function schedule() {
  if (pending) return;
  pending = requestAnimationFrame(() => { pending = null; render(); });
}

function render() {
  const d = W.solveDesign(state);

  /* verdict */
  const fails = d.checks.filter((c) => c.pass === false);
  $("verdict").replaceChildren(
    el("b", { text: `${state.name}. ` }),
    `${W.fmt(d.inductance.txH, 3)}H pad coil coupled at k = ${d.coupling.k.toFixed(3)} to a ` +
    `${W.fmt(d.inductance.rxOnFerriteH, 3)}H receiver coil ${(state.gapMm).toFixed(2)} mm away. ` +
    `The pad has to swing ${d.power.requiredSourcePeakV.toFixed(2)} V peak to put ` +
    `${(d.power.pCellW * 1e3).toFixed(0)} mW into the cell — ${(d.power.endToEnd * 100).toFixed(0)} % end to end, ` +
    `${(d.link.i1).toFixed(2)} A in the pad coil, +${d.thermalSpeaker.riseK.toFixed(1)} K on the speaker. ` +
    `Charge ${(d.charge.timeHours).toFixed(2)} h, playback ${d.runtime.hours.toFixed(1)} h. ` +
    `Stack ${d.fit.totalMm.toFixed(2)} mm of ${d.fit.innerHeightMm.toFixed(2)} mm: ${d.fit.fits ? "it fits" : "IT DOES NOT FIT"}. ` +
    (fails.length ? `${fails.length} check(s) fail: ${fails.map((f) => f.label).join("; ")}.` : "Every check passes."),
  );

  /* coils */
  const coilRow = (name, coil, L, Lfree, R, dcr, q, source) => [
    `${name} · geometry`,
    [`outer / inner Ø`, `${coil.spec.odMm} / ${coil.spec.idMm} mm`],
    [`turns / layers`, `${coil.turns} / ${coil.layers}`, coil.fits ? "fits the window" : `needs ${coil.layersNeeded} layers`],
    [`conductor`, `${coil.spec.strands || 1} × ${coil.spec.strandMm?.toFixed(3)} mm`, `winding length ${W.fmt(coil.wireLength, 3)}m`],
    [`inductance`, `${W.fmt(L, 3)}H`, `${name.includes("receiver") ? `${W.fmt(Lfree, 3)}H free × ${state.ferriteFactor.toFixed(2)} ferrite` : "no ferrite on the pad coil"}`],
    [`resistance`, `${W.fmt(dcr, 3)}Ω dc`, `${W.fmt(R, 3)}Ω ac at ${(state.fHz / 1e3).toFixed(0)} kHz, proximity ×${state.proximityFactor ?? 1}`],
    [`value taken from`, source, source === "model" ? "filament sum + skin effect" : "catalogue data beats the model where it exists"],
    [`Q`, q.toFixed(1), ""],
  ];
  const rows = [
    ...coilRow("transmitter (pad)", d.tx, d.inductance.txH, d.inductance.txModeledH, d.resistance.txOhm, d.resistance.txDcrOhm, d.q.tx, d.inductance.txSource),
    ...coilRow("receiver (speaker)", d.rx, d.inductance.rxOnFerriteH, d.inductance.rxFreeH, d.resistance.rxOhm, d.resistance.rxDcrOhm, d.q.rx, d.inductance.rxSource),
    "coupling",
    [`mutual inductance M`, `${W.fmt(d.coupling.M, 3)}H`, `free-space ${W.fmt(d.coupling.mFreeSpace, 3)}H`],
    [`coupling coefficient k`, d.coupling.k.toFixed(4), `WPC-typical ${W.QI.kTypicalRange.join("–")}`],
    [`tuning`, `Cs ${W.fmt(d.tuning.cs2, 3)}F`, d.tuning.inQiBand ? `Cd ${W.fmt(d.tuning.cd2, 3)}F at 1 MHz` : "no parallel cap off the Qi band"],
  ];
  kvTable("coils", rows);

  /* link */
  kvTable("link", [
    [`frequency`, `${(state.fHz / 1e3).toFixed(1)} kHz`, d.tuning.inQiBand ? "inside the WPC band" : "outside the WPC band"],
    [`required drive`, `${d.power.requiredSourcePeakV.toFixed(2)} V peak`, "solved to hit the charger's power demand"],
    [`pad coil current`, `${d.link.i1.toFixed(3)} A peak`, `${(d.link.vCoil1Peak).toFixed(1)} V across L1`],
    [`speaker coil current`, `${d.link.i2.toFixed(3)} A peak`, `${(d.link.vCoil2Peak).toFixed(1)} V across L2`],
    [`Cs voltage`, `${d.link.vCs2Peak.toFixed(1)} V peak`, "specify ≥ 25 V"],
    [`figure of merit`, `k²Q1Q2 = ${d.q.kQ2.toFixed(1)}`, `closed-form η_max ${(W.optimumLoadEfficiency(d.coupling.k, d.q.tx, d.q.rx) * 100).toFixed(1)} %`],
    [`link efficiency`, `${(d.power.linkEfficiency * 100).toFixed(1)} %`, "rectifier input ÷ pad input"],
    [`end to end`, `${(d.power.endToEnd * 100).toFixed(1)} %`, "cell ÷ pad input"],
  ]);

  kvTable("budget", [
    [`pad input`, `${(d.power.pInW * 1000).toFixed(0)} mW`],
    [`  pad coil + inverter loss`, `${(d.power.lossTxW * 1000).toFixed(0)} mW`, `coil ${(d.link.pCoil1 * 1e3).toFixed(0)} · FETs ${(d.link.pSource * 1e3).toFixed(0)}`],
    [`delivered to the rectifier`, `${(d.power.pAcAtReceiverW * 1000).toFixed(0)} mW`],
    [`  speaker coil loss`, `${(d.link.pCoil2 * 1e3).toFixed(0)} mW`],
    [`  bridge + charger loss`, `${((d.power.pAcAtReceiverW - d.power.pCellW) * 1e3 - d.link.pCoil2 * 1e3).toFixed(0)} mW`, `bridge ${(d.chain.bridgeLoss * 1e3).toFixed(0)}`],
    [`into the cell`, `${(d.power.pCellW * 1000).toFixed(0)} mW`, `${d.chain.vRect.toFixed(2)} V at ${(d.chain.iDc * 1e3).toFixed(0)} mA`],
  ]);

  /* charts */
  const fSweep = W.sweepFrequency(state, geo(state.fHz / 8, state.fHz * 8, 40));
  drawChart($("chart-f"), {
    logX: true, xLabel: "frequency", yLabel: "efficiency",
    series: [
      { label: "efficiency", color: "#3fbf7f", points: fSweep.map((p) => [p.fHz, p.efficiency == null ? NaN : p.efficiency]) },
      { label: "Q rx", color: "#5b8dd6", points: fSweep.map((p) => [p.fHz, Math.min(p.qRx, 400) / 400]) },
    ],
    markers: [{ x: state.fHz, label: `${(state.fHz / 1e3).toFixed(0)} kHz` }],
  });
  $("cap-f").textContent =
    `Efficiency (green) and receiver Q normalised to 400 (blue) against drive frequency, both coils re-tuned at ` +
    `each point. At ${(W.QI.fMinHz / 1e3).toFixed(0)}–${(W.QI.fMaxHz / 1e3).toFixed(0)} kHz (the WPC band) this pair ` +
    `runs ${(fSweep.find((p) => Math.abs(p.fHz - 125e3) < 1) ?? fSweep[0]).efficiency == null ? "n/a" : ((fSweep.find((p) => Math.abs(p.fHz - 125e3) < 1) ?? fSweep[0]).efficiency * 100).toFixed(0)} % ` +
    `because ωL is a fraction of an ohm and the coil current is enormous. That is the whole argument against a ` +
    `Qi-band link at this diameter.`;

  const gapSweep = W.sweepGap(state, [0.3, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]);
  drawChart($("chart-gap"), {
    xLabel: "gap (mm)", yLabel: "k / efficiency",
    series: [
      { label: "k", color: "#c8873a", points: gapSweep.map((p) => [p.gapMm, p.k]) },
      { label: "efficiency", color: "#3fbf7f", points: gapSweep.map((p) => [p.gapMm, p.efficiency]) },
    ],
    markers: [{ x: state.gapMm, label: `${state.gapMm} mm` }],
  });
  $("cap-gap").textContent =
    `Coupling and efficiency against coil separation, drive re-solved at each gap. k halves roughly every ` +
    `${(gapSweep[1].gapMm).toFixed(1)}–${(gapSweep[3].gapMm).toFixed(1)} mm at this size, which is why the pad ` +
    `needs a mechanical register (a recess or a magnet) rather than a flat surface.`;

  const loads = geo(0.5, 2000, 60);
  const loadSweep = W.sweepLoad(d, loads);
  drawChart($("chart-load"), {
    logX: true, xLabel: "load (Ω)", yLabel: "W / efficiency",
    series: [
      { label: "efficiency", color: "#3fbf7f", points: loadSweep.map((p) => [p.rLoad, p.efficiency]) },
      { label: "power (W)", color: "#5b8dd6", points: loadSweep.map((p) => [p.rLoad, p.pLoadW]) },
    ],
    markers: [{ x: d.link.pLoad / (d.link.iLoad * d.link.iLoad), label: "design" }],
  });
  $("cap-load").textContent =
    `Efficiency and delivered power against the load the rectifier presents. The design point (dashed) sits on the ` +
    `rising side; the closed-form optimum is ${(W.optimumLoadEfficiency(d.coupling.k, d.q.tx, d.q.rx) * 100).toFixed(1)} % ` +
    `at ${(d.resistance.rxOhm * Math.sqrt(1 + d.q.kQ2)).toFixed(1)} Ω.`;

  const offSweep = W.sweepOffset(state, [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
  drawChart($("chart-offset"), {
    xLabel: "sideways offset (mm)", yLabel: "k",
    series: [{ label: "k", color: "#c8873a", points: offSweep.map((p) => [p.offsetMm, p.k]) }],
  });
  $("cap-offset").textContent =
    `Coupling against sideways misalignment at the ${state.gapMm} mm gap, by the Neumann integral rather than the ` +
    `coaxial closed form. At ${state.rx.odMm} mm the receiver has less than ` +
    `${(offSweep.find((p) => p.k < 0.5 * offSweep[0].k)?.offsetMm ?? NaN).toFixed(1)} mm of aiming tolerance ` +
    `before k halves — the pad must centre the speaker mechanically.`;

  /* cell */
  kvTable("charge", [
    [`charge current`, `${(d.chain.chargeCurrentA * 1e3).toFixed(0)} mA`, `${(d.chain.chargeCurrentA / (state.cell.capacityMah / 1e3)).toFixed(2)} C`],
    [`0 → 100 % time`, `${d.charge.timeHours.toFixed(2)} h`],
    [`CV knee`, `at ${(d.charge.kneeSoc * 100).toFixed(1)} % SoC`, `${(d.charge.kneeTime / 60).toFixed(0)} min in`],
    [`energy in`, `${(d.charge.energyInJ / 3600).toFixed(2)} Wh`],
    [`energy stored`, `${(d.charge.energyStoredJ / 3600).toFixed(2)} Wh`, `cell loss ${(d.charge.energyHeatJ / 3600).toFixed(2)} Wh`],
    [`energy balance`, d.charge.energyBalance.toFixed(5), "stored + heat ÷ in; must be 1"],
  ]);
  kvTable("runtime", [
    [`Bluetooth SoC`, `${state.audio.btSoCMa.toFixed(1)} mA`],
    [`amp quiescent`, `${state.audio.ampQuiescentMa.toFixed(1)} mA`],
    [`amplifier draw`, `${d.runtime.ampDrawMa.toFixed(1)} mA`, `${state.audio.acousticPeakW} W peak ÷ ${state.audio.crestFactor} crest ÷ ${state.audio.ampEff} η`],
    [`total`, `${d.runtime.totalMa.toFixed(1)} mA`],
    [`usable capacity`, `${d.runtime.usableMah.toFixed(0)} mAh`, "100 % → 5 %"],
    [`playback`, `${d.runtime.hours.toFixed(1)} h`],
    [`at full acoustic power`, `${(state.cell.capacityMah * 0.95 / (state.audio.btSoCMa + state.audio.ampQuiescentMa + state.audio.acousticPeakW / state.audio.ampEff / 3.7 * 1e3)).toFixed(2)} h`, "crest factor 1 — worst case"],
    [`cavity`, `${d.acoustics.cavityVolumeCc.toFixed(2)} cc`, `first mode ${W.fmt(d.acoustics.cavityModeHz, 3)}Hz (c/4L) — damp it`],
  ]);

  drawChart($("chart-charge"), {
    xLabel: "minutes", yLabel: "V / A",
    series: [
      { label: "cell V", color: "#5b8dd6", points: d.charge.curve.map((p) => [p.t / 60, p.v]) },
      { label: "current A", color: "#c8873a", points: d.charge.curve.map((p) => [p.t / 60, p.i]) },
    ],
  });

  /* thermal + fit */
  kvTable("thermal", [
    [`speaker surface`, `${W.fmt(d.thermalSpeaker.areaM2 * 1e4, 3)} cm²`, "cylinder side + both ends"],
    [`thermal resistance`, `${d.thermalSpeaker.rThKPerW.toFixed(1)} K/W`, "h = 10 W/m²K natural convection"],
    [`receiver-side loss`, `${(d.power.lossRxW * 1e3).toFixed(0)} mW`, "coil + bridge + charger"],
    [`temperature rise`, `+${d.thermalSpeaker.riseK.toFixed(1)} K`],
    [`surface at 25 °C ambient`, `${d.thermalSpeaker.tSurfaceC.toFixed(1)} °C`, d.thermalSpeaker.tSurfaceC > 45 ? "too hot to hold" : "under the 45 °C design target"],
    [`pad-side loss`, `${(d.power.lossTxW * 1e3).toFixed(0)} mW`, "in a bigger body, so a smaller rise"],
  ]);
  const bar = $("stackbar");
  bar.replaceChildren();
  const hues = ["#3fbf7f", "#5b8dd6", "#c8873a", "#9b6bc4", "#d05a5a", "#6b7688"];
  d.fit.rows.forEach((r, i) => bar.append(el("i", {
    style: `width:${(r.stackHeightMm / d.fit.innerHeightMm * 100).toFixed(2)}%;background:${hues[i % hues.length]}`,
    title: `${r.label} ${r.stackHeightMm.toFixed(2)} mm`,
  })));
  if (d.fit.remainingMm > 0) {
    bar.append(el("i", { style: `width:${(d.fit.remainingMm / d.fit.innerHeightMm * 100).toFixed(2)}%;background:#1d2637`, title: "free" }));
  }
  kvTable("fit", [
    ...d.fit.rows.map((r) => [
      r.label,
      `${r.stackHeightMm.toFixed(2)} mm`,
      `Ø${r.diaMm} ${r.diaOk ? "✓" : "TOO WIDE"}`,
    ]),
    [`total`, `${d.fit.totalMm.toFixed(2)} mm`, `${d.fit.remainingMm >= 0 ? `${d.fit.remainingMm.toFixed(2)} mm free` : `${(-d.fit.remainingMm).toFixed(2)} mm OVER`}`],
    [`inner envelope`, `Ø${d.fit.rows.length ? (state.body.odMm - 2 * state.body.wallMm).toFixed(2) : "—"} × ${d.fit.innerHeightMm.toFixed(2)} mm`],
  ]);

  /* checks */
  const host = $("checks");
  host.replaceChildren();
  for (const c of d.checks) {
    host.append(el("div", { class: `flag ${c.pass === null ? "na" : c.pass ? "ok" : "no"}` },
      el("b", { text: c.pass === null ? "n/a" : c.pass ? "pass" : "FAIL" }),
      ` ${c.label} — ${c.detail}`,
      el("span", { class: "ref", text: c.ref })));
  }

  /* bom */
  const bomRows = [];
  for (const side of ["rx", "tx"]) {
    bomRows.push(side === "rx" ? "speaker (receiver)" : "pad (transmitter)");
    for (const item of W.BOM[side]) {
      bomRows.push([`${item.qty} × ${item.part}`, item.role, item.source]);
    }
  }
  kvTable("bom", bomRows);

  /* solids */
  const bodyProfile = W.speakerShellProfile({
    odMm: state.body.odMm, heightMm: state.body.heightMm, wallMm: state.body.wallMm,
    coilPocketDiaMm: state.rx.odMm + 0.4, driverDiaMm: d.fit.rows[0]?.diaMm ?? state.rx.odMm,
    coilPocketDepthMm: Math.max(0.4, state.rx.wireMm * 1.5 + 0.3),
    driverRecessDepthMm: d.fit.rows[0]?.heightMm ?? 2.5,
  });
  const padProfile = W.padShellProfile({
    odMm: state.tx.odMm + 12, heightMm: Math.max(8, state.tx.wireMm * state.tx.layers + 6),
    wellDiaMm: state.tx.odMm + 0.4, wellDepthMm: Math.max(1.2, state.tx.wireMm * state.tx.layers + 0.8),
  });
  const bodyMesh = W.latheMesh(bodyProfile, 240);
  const padMesh = W.latheMesh(padProfile, 180);
  kvTable("solid", [
    [`speaker body`, `${bodyMesh.triangles.length} triangles`, `${W.fmt(bodyMesh.volumeMm3 / 1000, 3)} cc of plastic`],
    [`pad body`, `${padMesh.triangles.length} triangles`, `${W.fmt(padMesh.volumeMm3 / 1000, 3)} cc`],
  ]);
  $("dl-stl-body").dataset.mesh = "";
  window.__lab = { d, bodyMesh, padMesh, bodyProfile, padProfile };

  drawCrossSection(d);
  drawSchematic(d);
}

/** geometric spacing, for log-axis sweeps */
function geo(a, b, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(a * Math.pow(b / a, i / (n - 1)));
  return out;
}

/* ------------------------------------------------------------------ *
 * downloads
 * ------------------------------------------------------------------ */

function download(name, data, mime = "text/plain") {
  const blob = data instanceof Uint8Array ? new Blob([data], { type: "application/octet-stream" }) : new Blob([data], { type: mime });
  const a = el("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function report(d) {
  const L = [];
  L.push(`CHARGE PAD LAB — design report`);
  L.push(`generated ${new Date().toISOString()} from js/wireless-charge.js`);
  L.push(``);
  L.push(`design: ${d.spec.name}`);
  L.push(`body: Ø${d.geometry.body.odMm} × ${d.geometry.body.heightMm} mm, wall ${d.geometry.body.wallMm} mm`);
  L.push(`frequency: ${(d.spec.fHz / 1e3).toFixed(1)} kHz  gap ${d.geometry.gapMm} mm  offset ${d.geometry.offsetMm} mm`);
  L.push(``);
  L.push(`TX coil: Ø${d.tx.spec.odMm}/${d.tx.spec.idMm} mm, ${d.tx.turns}T, ${d.tx.spec.strands || 1}×${d.tx.spec.strandMm.toFixed(3)} mm`);
  L.push(`  L = ${W.fmt(d.inductance.txH, 4)}H   Rdc = ${W.fmt(d.resistance.txDcrOhm, 4)}Ω   Rac = ${W.fmt(d.resistance.txOhm, 4)}Ω   Q = ${d.q.tx.toFixed(1)}`);
  L.push(`RX coil: Ø${d.rx.spec.odMm}/${d.rx.spec.idMm} mm, ${d.rx.turns}T, ${d.rx.spec.strands || 1}×${d.rx.spec.strandMm.toFixed(3)} mm`);
  L.push(`  L = ${W.fmt(d.inductance.rxFreeH, 4)}H free × ${d.inductance.ferriteFactor} = ${W.fmt(d.inductance.rxOnFerriteH, 4)}H`);
  L.push(`  Rdc = ${W.fmt(d.resistance.rxDcrOhm, 4)}Ω   Rac = ${W.fmt(d.resistance.rxOhm, 4)}Ω   Q = ${d.q.rx.toFixed(1)}`);
  L.push(`  Cs = ${W.fmt(d.tuning.cs2, 4)}F   Cd = ${W.fmt(d.tuning.cd2, 4)}F`);
  L.push(`coupling: M = ${W.fmt(d.coupling.M, 4)}H   k = ${d.coupling.k.toFixed(4)}   k²Q1Q2 = ${d.q.kQ2.toFixed(1)}`);
  L.push(``);
  L.push(`link:`);
  L.push(`  drive ${d.power.requiredSourcePeakV.toFixed(3)} V peak   I1 ${d.link.i1.toFixed(3)} A   I2 ${d.link.i2.toFixed(3)} A`);
  L.push(`  pad input ${(d.power.pInW * 1e3).toFixed(1)} mW   to rectifier ${(d.power.pAcAtReceiverW * 1e3).toFixed(1)} mW   to cell ${(d.power.pCellW * 1e3).toFixed(1)} mW`);
  L.push(`  link η ${(d.power.linkEfficiency * 100).toFixed(2)} %   end-to-end ${(d.power.endToEnd * 100).toFixed(2)} %`);
  L.push(`  pad loss ${(d.power.lossTxW * 1e3).toFixed(1)} mW   speaker loss ${(d.power.lossRxW * 1e3).toFixed(1)} mW`);
  L.push(``);
  L.push(`cell: ${(d.chain.chargeCurrentA * 1e3).toFixed(0)} mA, ${d.charge.timeHours.toFixed(2)} h, ${d.charge.energyBalance.toFixed(5)} energy balance`);
  L.push(`runtime: ${d.runtime.totalMa.toFixed(1)} mA, ${d.runtime.hours.toFixed(1)} h`);
  L.push(`thermal: +${d.thermalSpeaker.riseK.toFixed(1)} K → ${d.thermalSpeaker.tSurfaceC.toFixed(1)} °C at 25 °C ambient`);
  L.push(`fit: ${d.fit.totalMm.toFixed(2)} of ${d.fit.innerHeightMm.toFixed(2)} mm — ${d.fit.fits ? "fits" : "DOES NOT FIT"}`);
  L.push(``);
  L.push(`checks:`);
  for (const c of d.checks) L.push(`  [${c.pass === null ? "n/a " : c.pass ? "pass" : "FAIL"}] ${c.label} — ${c.detail} (${c.ref})`);
  L.push(``);
  L.push(`not modelled: ferrite field shaping (one multiplier), turn-to-turn proximity (a derate), FOD/ASK margin, coil self-resonance, driver acoustics.`);
  return L.join("\n");
}

function wireDownloads() {
  $("dl-csv").addEventListener("click", () => download("charge-pad-bom.csv", W.bomCsv(), "text/csv"));
  $("dl-netlist").addEventListener("click", () => download("charge-pad-link.cir", W.spiceNetlist(window.__lab.d)));
  $("dl-scad-body").addEventListener("click", () => download("speaker-body.scad",
    W.scadSource(window.__lab.bodyProfile, { name: "speaker body", heightMm: state.body.heightMm })));
  $("dl-scad-pad").addEventListener("click", () => download("charge-pad.scad",
    W.scadSource(window.__lab.padProfile, { name: "charge pad" })));
  $("dl-stl-body").addEventListener("click", () => download("speaker-body.stl", W.stlBinary(window.__lab.bodyMesh, "speaker body")));
  $("dl-stl-pad").addEventListener("click", () => download("charge-pad.stl", W.stlBinary(window.__lab.padMesh, "charge pad")));
  $("dl-report").addEventListener("click", () => download("charge-pad-report.txt", report(window.__lab.d)));
}

/* ------------------------------------------------------------------ *
 * boot
 * ------------------------------------------------------------------ */

buildPresets();
buildInputs();
wireDownloads();
render();
window.addEventListener("resize", schedule);
