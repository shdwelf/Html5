// Country viewer (PC-Globe style) — offline browser over the seeded CIA
// World Factbook register. Pure helpers are exported for tests; the DOM
// bootstrap only runs in a browser.
import { COUNTRIES, COUNTRY_DATA_META } from "./country-data.js";

export function filterCountries(list, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [...list];
  return list.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.capital.name.toLowerCase().includes(q) ||
    c.code.toLowerCase() === q);
}

export function formatInt(n) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US");
}

// Equirectangular projection: lon -180..180 -> x 0..w, lat 90..-90 -> y 0..h.
export function project(lon, lat, w, h) {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
}

export function sortByName(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

function drawMap(canvas, selected) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#0b1622";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(120,170,220,0.25)";
  for (let lon = -150; lon <= 150; lon += 30) {
    const [x] = project(lon, 0, w, h);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat, w, h);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (const c of COUNTRIES) {
    const [x, y] = project(c.lon, c.lat, w, h);
    ctx.fillStyle = selected && c.code === selected.code ? "#ffd75e" : "#7fd4ff";
    ctx.beginPath(); ctx.arc(x, y, selected && c.code === selected.code ? 5 : 3, 0, Math.PI * 2); ctx.fill();
  }
  if (selected && Number.isFinite(selected.capital.lat) && Number.isFinite(selected.capital.lon)) {
    const [x, y] = project(selected.capital.lon, selected.capital.lat, w, h);
    ctx.fillStyle = "#ff8a5e";
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
}

function el(id) { return document.getElementById(id); }

export function capitalText(c) {
  const hasCoords = Number.isFinite(c.capital.lat) && Number.isFinite(c.capital.lon);
  if (!c.capital.name && !hasCoords) return "none published (source profile lists no capital)";
  if (!hasCoords) return `${c.capital.name} (no coordinates published)`;
  if (!c.capital.name) return `(${c.capital.lat}, ${c.capital.lon})`;
  return `${c.capital.name} (${c.capital.lat}, ${c.capital.lon})`;
}

function renderDetail(c) {
  const d = el("detail");
  if (!c) { d.innerHTML = "<p>Select a country.</p>"; return; }
  d.innerHTML = `
    <h2>${c.name}</h2>
    <p class="loc">${c.location}</p>
    <table>
      <tr><th>Capital</th><td>${capitalText(c)}</td></tr>
      <tr><th>Country reference point</th><td>${c.lat}, ${c.lon}</td></tr>
      <tr><th>Area (total)</th><td>${formatInt(c.areaTotalSqKm)} sq km</td></tr>
      <tr><th>Population</th><td>${c.populationText}</td></tr>
      <tr><th>Languages</th><td>${c.languages}</td></tr>
      <tr><th>Government</th><td>${c.governmentType}</td></tr>
      <tr><th>National anthem</th><td>“${c.anthemTitle}”<br><span class="byline">${c.anthemLyricsMusic}</span></td></tr>
    </table>
    <p class="note">Anthem shown as Factbook title/credit text; audio is not bundled.
    Fields are verbatim CIA World Factbook extractions (see source pin below).</p>`;
}

function main() {
  const listEl = el("countries");
  const searchEl = el("search");
  const canvas = el("world");
  let selected = null;
  function renderList() {
    const items = sortByName(filterCountries(COUNTRIES, searchEl.value));
    listEl.innerHTML = items.map((c) =>
      `<li><button type="button" data-code="${c.code}" class="${selected && c.code === selected.code ? "active" : ""}">${c.capital.name ? `${c.name} — ${c.capital.name}` : c.name}</button></li>`).join("");
    listEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      selected = COUNTRIES.find((c) => c.code === b.dataset.code) || null;
      renderList(); renderDetail(selected); drawMap(canvas, selected);
    }));
  }
  searchEl.addEventListener("input", renderList);
  el("sourcepin").textContent =
    `${COUNTRY_DATA_META.source} · upstream ${COUNTRY_DATA_META.upstreamCommit.slice(0, 12)} · ` +
    `${COUNTRY_DATA_META.count} seeded countries · register: ${COUNTRY_DATA_META.register}`;
  renderList();
  drawMap(canvas, null);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
}
