// Country viewer (PC-Globe style) — offline browser over the seeded CIA
// World Factbook register. Pure helpers are exported for tests; the DOM
// bootstrap only runs in a browser.
import { COUNTRIES, COUNTRY_DATA_META } from "./country-data.js";
import { COUNTRY_ISO_REGISTER_META } from "./country-iso-crosswalk.js";
import { COUNTRY_IANA_TLD_META } from "./country-iana-cctlds.js";
import { MAP_VIEWS, drawCountryOutlines, nearestCountryAt, projectMapPoint } from "./country-map.js";
import {
  countryDisplayName,
  countryIanaTlds,
  countryIsoCodes,
  filterCountries,
  findUnprofiledIsoEntries,
  isoIanaTlds,
  sortByName,
} from "./country-viewer-search.js";

import { makeGazetteerIndex, searchName } from "./city-gazetteer.js";
import { GAZ_ROWS as atlantaRows } from "./city-gazetteer-data-atlanta.js";
import { GAZ_ROWS as buffaloRows } from "./city-gazetteer-data-buffalo.js";
import { GAZ_ROWS as kansasCityRows } from "./city-gazetteer-data-kansascity.js";
import { GAZ_ROWS as lawrenceRows } from "./city-gazetteer-data-lawrence.js";
import { GAZ_ROWS as torontoRows } from "./city-gazetteer-data-toronto.js";
import { GAZ_ROWS as polynesiaRows } from "./city-gazetteer-data-polynesia.js";

export { countryDisplayName, countryIanaTlds, countryIsoCodes, filterCountries, findUnprofiledIsoEntries, isoIanaTlds, sortByName };

const GAZETTEER_INDEX = makeGazetteerIndex([
  ...atlantaRows, ...buffaloRows, ...kansasCityRows, ...lawrenceRows, ...torontoRows, ...polynesiaRows,
]);

export function searchGazetteerPoints(query, limit = 8) {
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];
  return searchName(GAZETTEER_INDEX, q, { limit });
}

export function formatInt(n) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US");
}

// Backward-compatible exported projection helper; view is optional.
export function project(lon, lat, w, h, view = MAP_VIEWS.world) {
  return projectMapPoint(lon, lat, w, h, view);
}

function drawMap(canvas, selected, selectedGazetteer = null, outlines = null, view = MAP_VIEWS.world) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#0b1622";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  ctx.strokeStyle = "rgba(120,170,220,0.22)";
  ctx.lineWidth = 1;
  for (let lon = -150; lon <= 150; lon += 30) {
    const [x] = project(lon, 0, w, h, view);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat, w, h, view);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  drawCountryOutlines(ctx, outlines, w, h, view);
  for (const c of COUNTRIES) {
    const [x, y] = project(c.lon, c.lat, w, h, view);
    if (x < -8 || x > w + 8 || y < -8 || y > h + 8) continue;
    const isSelected = selected && c.code === selected.code;
    ctx.fillStyle = isSelected ? "#ffd75e" : "#7fd4ff";
    ctx.beginPath(); ctx.arc(x, y, isSelected ? 5.5 : Math.min(4, 1.7 + (view.scale ?? 1) * 0.6), 0, Math.PI * 2); ctx.fill();
  }
  if (selected && Number.isFinite(selected.capital.lat) && Number.isFinite(selected.capital.lon)) {
    const [x, y] = project(selected.capital.lon, selected.capital.lat, w, h, view);
    ctx.fillStyle = "#ff8a5e";
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  if (selectedGazetteer && Number.isFinite(selectedGazetteer.lat) && Number.isFinite(selectedGazetteer.lon)) {
    const [x, y] = project(selectedGazetteer.lon, selectedGazetteer.lat, w, h, view);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ff5c78";
    ctx.fill();
  }
  ctx.restore();
}


function el(id) { return document.getElementById(id); }
function esc(s) {
  return String(s ?? "").replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" }[c]));
}

function renderGazetteerDetail(point) {
  const host = el("gazDetail");
  if (!point) {
    host.textContent = "Choose a result to highlight it on the world map.";
    return;
  }
  const hasCoords = Number.isFinite(point.lat) && Number.isFinite(point.lon);
  const identity = point.verified && point.gnis
    ? `USGS GNIS ${esc(point.gnis)}`
    : hasCoords
      ? "reference point · no GNIS id claimed"
      : "name-only record · no coordinates included";
  const coordinateText = hasCoords ? `${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}` : "Coordinates not included";
  host.innerHTML = `<b>${esc(point.name)}</b><br>${esc(point.fclass)} · ${esc(point.county || "area not recorded")}<br>` +
    `${coordinateText}<br>${identity}<br><span class="note">${esc(point.note || "")}</span>`;
}

export function capitalText(c) {
  const hasCoords = Number.isFinite(c.capital.lat) && Number.isFinite(c.capital.lon);
  if (!c.capital.name && !hasCoords) return "none published (source profile lists no capital)";
  if (!hasCoords) return `${c.capital.name} (no coordinates published)`;
  if (!c.capital.name) return `(${c.capital.lat}, ${c.capital.lon})`;
  return `${c.capital.name} (${c.capital.lat}, ${c.capital.lon})`;
}

function renderDetail(c) {
  const d = el("detail");
  if (!c) { d.innerHTML = "<p>Select a country or area profile.</p>"; return; }
  const displayName = countryDisplayName(c);
  const isoCodes = countryIsoCodes(c);
  const ianaTlds = countryIanaTlds(c);
  const identifiers = `CIA Factbook code: ${c.code.toUpperCase()}` +
    (isoCodes.length ? ` · ISO 3166-1 alpha-2: ${isoCodes.join(", ")}` : " · no direct ISO name match in this crosswalk");
  d.innerHTML = `
    <h2>${esc(displayName)}</h2>
    <p class="loc">${esc(c.location)}</p>
    <table>
      <tr><th>Source identifiers</th><td>${esc(identifiers)}</td></tr>
      <tr><th>IANA ccTLD aliases</th><td>${esc(ianaTlds.join(", ") || "none in the pinned search index")}</td></tr>
      <tr><th>Capital</th><td>${esc(capitalText(c))}</td></tr>
      <tr><th>Country reference point</th><td>${esc(`${c.lat}, ${c.lon}`)}</td></tr>
      <tr><th>Area (total)</th><td>${esc(formatInt(c.areaTotalSqKm))} sq km</td></tr>
      <tr><th>Population</th><td>${esc(c.populationText)}</td></tr>
      <tr><th>Languages</th><td>${esc(c.languages)}</td></tr>
      <tr><th>Government</th><td>${esc(c.governmentType)}</td></tr>
      <tr><th>National anthem</th><td>“${esc(c.anthemTitle)}”<br><span class="byline">${esc(c.anthemLyricsMusic)}</span></td></tr>
    </table>
    <p class="note">Anthem shown as Factbook title/credit text; audio is not bundled.
    The Factbook source pin carries no national-instruments field, so none is shown
    rather than substituting a value from another source.
    Profile fields are verbatim CIA World Factbook extractions; display-name and search aliases
    are a separate ISO crosswalk (see source pin below).</p>`;
}

function main() {
  const listEl = el("countries");
  const searchEl = el("search");
  const gazSearchEl = el("gazSearch");
  const gazResultsEl = el("gazResults");
  const canvas = el("world");
  const mapStatus = el("mapStatus");
  const zoomSelected = el("zoomSelected");
  let selected = null;
  let selectedGazetteer = null;
  let outlines = null;
  let outlineState = "Loading offline country outlines";
  let view = MAP_VIEWS.world;

  function renderMap() {
    drawMap(canvas, selected, selectedGazetteer, outlines, view);
    if (mapStatus) mapStatus.textContent = `${outlineState} · ${view.label ?? "Custom view"}`;
  }

  function renderList() {
    const query = searchEl.value;
    const items = sortByName(filterCountries(COUNTRIES, query));
    const isoOnly = findUnprofiledIsoEntries(query, 8);
    const profileMarkup = items.map((c) => {
      const name = countryDisplayName(c);
      const capital = c.capital?.name ? ` — ${esc(c.capital.name)}` : "";
      const isoCodes = countryIsoCodes(c);
      const ianaTlds = countryIanaTlds(c);
      const identifiers = `Factbook ${c.code.toUpperCase()}` +
        (isoCodes.length ? ` · ISO ${isoCodes.join(", ")}` : "") +
        (ianaTlds.length ? ` · IANA ${ianaTlds.join(", ")}` : "");
      return `<li><button type="button" data-code="${esc(c.code)}" class="${selected && c.code === selected.code ? "active" : ""}">` +
        `${esc(name)}${capital}<small>${esc(identifiers)}</small></button></li>`;
    }).join("");
    const isoOnlyMarkup = isoOnly.map((entry) => {
      const tlds = isoIanaTlds(entry.isoAlpha2);
      const tldLabel = tlds.length ? ` · IANA ccTLD ${tlds.join(", ")}` : "";
      return `<li class="search-note"><strong>${esc(entry.names[0])} (${esc(entry.isoAlpha2)})</strong>` +
        `<small>ISO name index only${esc(tldLabel)} · no separate Factbook profile is represented here. ` +
        `Do not create or infer a country profile from an unmatched ISO label.</small></li>`;
    }).join("");
    listEl.innerHTML = profileMarkup + isoOnlyMarkup ||
      '<li class="search-note">No match in this limited offline index. Unmapped or legacy IANA TLDs are withheld rather than assigned to a country profile.</li>';
    listEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      selected = COUNTRIES.find((c) => c.code === b.dataset.code) || null;
      if (zoomSelected) zoomSelected.disabled = !selected;
      renderList(); renderDetail(selected); renderMap();
    }));
  }

  function renderGazetteerSearch() {
    selectedGazetteer = null;
    renderGazetteerDetail(null);
    const q = gazSearchEl.value.trim();
    if (q.length < 2) {
      gazResultsEl.innerHTML = q ? '<p class="note">Enter at least two characters.</p>' : "";
      renderMap();
      return;
    }
    const hits = searchGazetteerPoints(q);
    gazResultsEl.innerHTML = hits.length
      ? hits.map((point, i) => {
        const hasCoords = Number.isFinite(point.lat) && Number.isFinite(point.lon);
        const provenance = point.verified && point.gnis
          ? `GNIS ${esc(point.gnis)}`
          : hasCoords ? "reference point" : "name only · no coordinates";
        return `<button type="button" data-point="${i}" aria-label="${esc(point.name)}, ${esc(provenance)}">` +
          `${esc(point.name)}<small>${esc(point.fclass)} · ${esc(point.county || "county unknown")} · ${esc(provenance)}</small></button>`;
      }).join("")
      : '<p class="note">No match in the limited offline place-name index; this is not a live or complete lookup.</p>';
    gazResultsEl.querySelectorAll("button[data-point]").forEach((button) => button.addEventListener("click", () => {
      selectedGazetteer = hits[Number(button.dataset.point)] || null;
      renderGazetteerDetail(selectedGazetteer);
      renderMap();
    }));
    renderMap();
  }

  function setView(name) {
    view = MAP_VIEWS[name] || MAP_VIEWS.world;
    document.querySelectorAll("[data-map-view]").forEach((button) => {
      const active = button.dataset.mapView === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderMap();
  }

  document.querySelectorAll("[data-map-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.mapView));
  });
  if (zoomSelected) zoomSelected.addEventListener("click", () => {
    if (!selected) return;
    const area = selected.areaTotalSqKm ?? 1_000_000;
    const scale = area < 5_000 ? 12 : area < 50_000 ? 8 : area < 250_000 ? 5 : area < 1_000_000 ? 3.5 : 2.2;
    view = { label: countryDisplayName(selected), centerLon: selected.lon, centerLat: selected.lat, scale };
    document.querySelectorAll("[data-map-view]").forEach((button) => {
      button.classList.remove("active"); button.setAttribute("aria-pressed", "false");
    });
    renderMap();
  });
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const hit = nearestCountryAt(x, y, COUNTRIES, canvas.width, canvas.height, view, 20);
    if (!hit) return;
    selected = hit;
    if (zoomSelected) zoomSelected.disabled = false;
    renderList(); renderDetail(selected); renderMap();
  });
  searchEl.addEventListener("input", renderList);
  gazSearchEl.addEventListener("input", renderGazetteerSearch);
  el("sourcepin").textContent =
    `${COUNTRY_DATA_META.source} · upstream ${COUNTRY_DATA_META.upstreamCommit.slice(0, 12)} · ` +
    `${COUNTRY_DATA_META.count} seeded Factbook records · register: ${COUNTRY_DATA_META.register}. ` +
    `Search overlay: ${COUNTRY_ISO_REGISTER_META.source.package} ${COUNTRY_ISO_REGISTER_META.source.version} ` +
    `(MIT), reviewed ${COUNTRY_ISO_REGISTER_META.reviewDate}; ` +
    `${COUNTRY_ISO_REGISTER_META.counts.isoNameEntries} ISO names, ` +
    `${COUNTRY_ISO_REGISTER_META.counts.mappedIsoEntries} mapped, ` +
    `${COUNTRY_ISO_REGISTER_META.counts.unmappedIsoEntries} ISO-only; policy: “Do not create or infer a country profile from an unmatched ISO label.” ` +
    `IANA ccTLD search: ${COUNTRY_IANA_TLD_META.counts.uniqueValidatedTlds} TLD names from ` +
    `world-countries ${COUNTRY_IANA_TLD_META.source.version} (ODbL-1.0), checked against the pinned IANA-list mirror; ` +
    `${COUNTRY_IANA_TLD_META.counts.sharedTldNames} shared TLD names; snapshot, not live.`;
  renderList();
  renderGazetteerSearch();
  if (zoomSelected) zoomSelected.disabled = true;

  fetch("./vendor/world/countries.geo.json")
    .then((response) => {
      if (!response.ok) throw new Error(`outline data request failed (${response.status})`);
      return response.json();
    })
    .then((data) => { outlines = data; outlineState = `Country outlines loaded (${data.features?.length ?? 0})`; renderMap(); })
    .catch(() => {
      outlineState = "Country outlines unavailable; country points remain visible";
      renderMap();
    });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
}
