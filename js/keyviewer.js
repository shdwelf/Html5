// KeyViewer (Mathspace) — DOM bootstrap over js/mathspace.js.
// The math lives in mathspace.js (pure, unit-tested); this file only
// draws, reads inputs, and renders the compendium cards.
import {
  SPECIAL_ANGLES, TRIG_IDENTITIES, GEOMETRY_FORMULAS, PLATONIC_SOLIDS,
  solveTriangle, C, iPow, sind, cosd, tand, normDeg, deg2rad,
} from "./mathspace.js";

const $ = (id) => document.getElementById(id);
const fmt = (x, digits = 6) => {
  if (!Number.isFinite(x)) return "—";
  const v = Math.abs(x) < 1e-12 ? 0 : x;
  return String(Math.round(v * 10 ** digits) / 10 ** digits);
};
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

/* ---------------------------------------------------------- unit circle */
let angle = 37;
function drawCircle() {
  const cv = $("circleCanvas");
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = W / 2 - 24;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(120,170,220,0.25)";
  ctx.beginPath(); ctx.moveTo(8, cy); ctx.lineTo(W - 8, cy); ctx.moveTo(cx, 8); ctx.lineTo(cx, H - 8); ctx.stroke();
  ctx.strokeStyle = "#5ce1ff";
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  const t = deg2rad(angle);
  const px = cx + R * Math.cos(t), py = cy - R * Math.sin(t);
  ctx.strokeStyle = "#ffd75e";
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.strokeStyle = "#ff8a5e";
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke(); // sin leg
  ctx.strokeStyle = "#9be29b";
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke(); // cos leg
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
  const tv = Math.abs(cosd(angle)) < 1e-9 ? "undefined" : fmt(tand(angle));
  $("circleReadout").innerHTML =
    `θ = <b>${fmt(angle, 2)}°</b> = <b>${fmt(t)} rad</b> (${fmt(normDeg(angle) / 360, 4)} of a turn)<br>` +
    `sinθ = <b>${fmt(sind(angle))}</b> · cosθ = <b>${fmt(cosd(angle))}</b> · tanθ = <b>${tv}</b><br>` +
    `quadrant point (${fmt(cosd(angle), 4)}, ${fmt(sind(angle), 4)}) on x² + y² = 1`;
  $("angleDeg").value = fmt(angle, 2);
  $("angleSlider").value = String(normDeg(angle));
}
function setAngle(deg) { angle = deg; drawCircle(); }

function renderSpecial() {
  const head = "<tr><th>θ°</th><th>sinθ</th><th>cosθ</th><th>tanθ</th><th>decimal sin</th><th>decimal cos</th></tr>";
  $("specialTable").innerHTML = head + SPECIAL_ANGLES.map((r) =>
    `<tr class="pick" data-deg="${r.deg}"><td>${r.deg}°</td><td>${esc(r.sin)}</td><td>${esc(r.cos)}</td><td>${esc(r.tan)}</td>` +
    `<td>${fmt(sind(r.deg))}</td><td>${fmt(cosd(r.deg))}</td></tr>`).join("");
  $("specialTable").querySelectorAll("tr.pick").forEach((tr) =>
    tr.addEventListener("click", () => setAngle(Number(tr.dataset.deg))));
}

/* ------------------------------------------------------- triangle solver */
function runSolver() {
  const known = {};
  for (const k of ["a", "b", "c", "A", "B", "C"]) {
    const v = $("in_" + k).value;
    if (v !== "") known[k] = Number(v);
  }
  const out = $("solverOut");
  let sols;
  try { sols = solveTriangle(known); } catch (e) { sols = []; }
  if (!Object.keys(known).length) { out.innerHTML = `<div class="sol warn">Enter at least three values (with at least one side).</div>`; return; }
  if (!sols.length) { out.innerHTML = `<div class="sol warn">No triangle satisfies those values (check the triangle inequality, angle sum &lt; 180°, and the SSA reach).</div>`; return; }
  out.innerHTML = `<p class="note">${sols.length} solution${sols.length > 1 ? "s" : ""}${sols.length === 2 ? " — SSA ambiguous case: both are shown, neither is hidden" : ""}:</p>` +
    sols.map((s, i) => `<div class="sol"><b>Solution ${i + 1}</b><br>` +
      `a=${fmt(s.a, 4)} · b=${fmt(s.b, 4)} · c=${fmt(s.c, 4)}<br>` +
      `A=${fmt(s.A, 4)}° · B=${fmt(s.B, 4)}° · C=${fmt(s.C, 4)}° (sum ${fmt(s.A + s.B + s.C, 4)}°)<br>` +
      `area=${fmt(s.area, 4)} · perimeter=${fmt(s.perimeter, 4)} · R=${fmt(s.R, 4)} · r=${fmt(s.r, 4)}</div>`).join("");
}

/* ------------------------------------------------------------ compendium */
function renderCompendium(filter) {
  const q = (filter || "").trim().toLowerCase();
  const TH = deg2rad(37), BE = deg2rad(53);
  const match = (...texts) => !q || texts.some((t) => t.toLowerCase().includes(q));
  $("identityCards").innerHTML = TRIG_IDENTITIES
    .filter((e) => match(e.family, e.name, e.display))
    .map((e) => {
      const d = Math.abs(e.lhs(TH, BE) - e.rhs(TH, BE));
      return `<div class="card"><div class="fam">${esc(e.family.toUpperCase())}</div>` +
        `<div class="disp">${esc(e.display)}</div>` +
        `<div>${esc(e.name)}</div><div class="chk">check θ=37°, β=53°: |Δ| = ${d.toExponential(1)}</div></div>`;
    }).join("") || `<p class="note">No identity matches.</p>`;
  $("formulaCards").innerHTML = GEOMETRY_FORMULAS
    .filter((e) => match(e.family, e.name, e.display))
    .map((e, i) => `<div class="card"><div class="fam">${esc(e.family.toUpperCase())}</div>` +
      `<div class="disp">${esc(e.display)}</div><div>${esc(e.name)}</div>` +
      `<div class="mini">${e.inputs.map((v) => `<label>${esc(v)} <input type="number" step="any" data-gi="${i}" data-var="${esc(v)}" value="${e.sample[v]}" /></label>`).join("")}` +
      `<span class="res" id="gres-${i}"></span></div></div>`).join("") || `<p class="note">No formula matches.</p>`;
  const recompute = (i) => {
    const e = GEOMETRY_FORMULAS[i];
    const vals = {};
    document.querySelectorAll(`input[data-gi="${i}"]`).forEach((inp) => { vals[inp.dataset.var] = Number(inp.value); });
    const el = $("gres-" + i);
    try { el.textContent = "= " + fmt(e.compute(vals), 6); }
    catch { el.textContent = "= —"; }
  };
  GEOMETRY_FORMULAS.forEach((e, i) => { if ($("gres-" + i)) recompute(i); });
  document.querySelectorAll("input[data-gi]").forEach((inp) =>
    inp.addEventListener("input", () => recompute(Number(inp.dataset.gi))));
  $("platonicTable").innerHTML =
    "<tr><th>solid</th><th>faces F</th><th>vertices V</th><th>edges E</th><th>face</th><th>V − E + F</th></tr>" +
    PLATONIC_SOLIDS.map((p) => `<tr><td style="text-align:left">${esc(p.name)}</td><td>${p.faces}</td><td>${p.vertices}</td><td>${p.edges}</td><td>${esc(p.face)}</td><td>${p.vertices - p.edges + p.faces}</td></tr>`).join("");
}

/* ---------------------------------------------------------- complex plane */
let plotted = []; // [{z, label, color}]
function drawComplex() {
  const cv = $("complexCanvas");
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
  const all = plotted.map((p) => p.z);
  const extent = Math.max(2, ...all.map((z) => Math.max(Math.abs(z.re), Math.abs(z.im)))) * 1.2;
  const px = (z) => [cx + (z.re / extent) * (W / 2 - 16), cy - (z.im / extent) * (H / 2 - 16)];
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(120,170,220,0.25)";
  ctx.beginPath(); ctx.moveTo(8, cy); ctx.lineTo(W - 8, cy); ctx.moveTo(cx, 8); ctx.lineTo(cx, H - 8); ctx.stroke();
  ctx.strokeStyle = "rgba(92,225,255,0.5)";
  ctx.beginPath(); ctx.arc(cx, cy, (1 / extent) * (W / 2 - 16), 0, Math.PI * 2); ctx.stroke();
  ctx.font = "10px ui-monospace, monospace";
  for (const p of plotted) {
    const [x, y] = px(p.z);
    ctx.strokeStyle = p.color;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(p.label, x + 6, y - 4);
  }
}
function readZ(prefix) { return { re: Number($(prefix + "Re").value), im: Number($(prefix + "Im").value) }; }
function runComplex(op) {
  const z = readZ("z"), w = readZ("w");
  const n = Math.max(1, Math.floor(Number($("cN").value) || 1));
  const out = $("complexReadout");
  const polar = (v) => `|v| = ${fmt(C.abs(v))}, arg = ${fmt(C.argDeg(v))}°`;
  try {
    if (op === "plot") {
      plotted = [{ z, label: "z=" + C.format(z), color: "#ffd75e" }, { z: w, label: "w=" + C.format(w), color: "#5ce1ff" }];
      out.innerHTML = `z: ${polar(z)}<br>w: ${polar(w)}<br>e^{i·arg z} points along z at unit length.`;
    } else if (op === "add" || op === "mul" || op === "div") {
      const v = C[op](z, w);
      const sym = { add: "+", mul: "·", div: "/" }[op];
      plotted = [{ z, label: "z", color: "#ffd75e" }, { z: w, label: "w", color: "#5ce1ff" }, { z: v, label: `z${sym}w`, color: "#ff8a5e" }];
      out.innerHTML = `z ${sym} w = <b>${esc(C.format(v))}</b><br>${polar(v)}`;
    } else if (op === "conj") {
      const v = C.conj(z);
      plotted = [{ z, label: "z", color: "#ffd75e" }, { z: v, label: "z̄", color: "#ff8a5e" }];
      out.innerHTML = `z̄ = <b>${esc(C.format(v))}</b> · z·z̄ = |z|² = ${fmt(C.abs(z) ** 2)} (always real)`;
    } else if (op === "pow") {
      const v = C.pow(z, n);
      plotted = [{ z, label: "z", color: "#ffd75e" }, { z: v, label: `z^${n}`, color: "#ff8a5e" }];
      out.innerHTML = `z^${n} = <b>${esc(C.format(v))}</b> (De Moivre: modulus ${fmt(C.abs(z))}^${n}, angle ${fmt(C.argDeg(z))}°×${n})<br>` +
        `powers of i: i¹=${esc(C.format(iPow(1)))}, i²=${esc(C.format(iPow(2)))}, i³=${esc(C.format(iPow(3)))}, i⁴=${esc(C.format(iPow(4)))} — then the cycle repeats.`;
    } else if (op === "roots") {
      const roots = C.roots(z, n);
      plotted = [{ z, label: "z", color: "#ffd75e" }, ...roots.map((r, i) => ({ z: r, label: `√${i + 1}`, color: "#9be29b" }))];
      out.innerHTML = `${n} root${n > 1 ? "s" : ""} of z, evenly spaced by ${fmt(360 / n, 4)}° on |root| = ${fmt(C.abs(z) ** (1 / n))}:<br>` +
        roots.map((r) => esc(C.format(r))).join(" · ");
    }
  } catch (e) {
    out.innerHTML = `<span class="warn">${esc(e.message)}</span>`;
    plotted = [{ z, label: "z", color: "#ffd75e" }];
  }
  drawComplex();
}

/* ------------------------------------------------------------------ boot */
function main() {
  renderSpecial();
  drawCircle();
  renderCompendium("");
  plotted = [{ z: readZ("z"), label: "z", color: "#ffd75e" }, { z: readZ("w"), label: "w", color: "#5ce1ff" }];
  drawComplex();
  $("angleDeg").addEventListener("input", (e) => { const v = Number(e.target.value); if (Number.isFinite(v)) { angle = v; drawCircle(); } });
  $("angleSlider").addEventListener("input", (e) => setAngle(Number(e.target.value)));
  let dragging = false;
  const cv = $("circleCanvas");
  const fromEvent = (e) => {
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * cv.width - cv.width / 2;
    const y = cv.height / 2 - ((e.clientY - r.top) / r.height) * cv.height;
    setAngle(normDeg((Math.atan2(y, x) * 180) / Math.PI));
  };
  cv.addEventListener("pointerdown", (e) => { dragging = true; fromEvent(e); });
  cv.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
  cv.addEventListener("pointerup", () => { dragging = false; });
  $("solveBtn").addEventListener("click", runSolver);
  $("solve345").addEventListener("click", () => {
    for (const k of ["a", "b", "c", "A", "B", "C"]) $("in_" + k).value = "";
    $("in_a").value = "3"; $("in_b").value = "4"; $("in_c").value = "5";
    runSolver();
  });
  $("compSearch").addEventListener("input", (e) => renderCompendium(e.target.value));
  document.querySelectorAll("[data-cop]").forEach((b) => b.addEventListener("click", () => runComplex(b.dataset.cop)));
}
main();
