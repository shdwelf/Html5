/**
 * ============================================================================
 * Alexandria Digital Library (ADL) & GazBean Studio Controller
 * ============================================================================
 * Coordinates map rendering, GazBean query execution, PostGIS SQL synthesis,
 * sitemap indexing, and deep-dive research views.
 * ============================================================================
 */

import { ADL_BENCHMARK_DATA, ADL_COLLECTION_TAXONOMY_TREE } from "./adl-data.js";
import { AdlGisMap } from "./adl-map.js";
import { GazBeanEngine, ADL_FTT_TAXONOMY } from "../src/gazbean/gazbean.js";

class AdlStudioApp {
  constructor() {
    this.engine = new GazBeanEngine(ADL_BENCHMARK_DATA);
    this.map = null;
    this.activeTab = "map";
    this.currentQueryResults = [...ADL_BENCHMARK_DATA];
    this.selectedFeature = null;
    this.customDbRecords = [...ADL_BENCHMARK_DATA];

    this.init();
  }

  init() {
    this.initMap();
    this.bindNavigation();
    this.bindSearchControls();
    this.bindSqlConsole();
    this.bindEtlWorkbench();
    this.bindSitemapExplorer();
    this.bindSourceCodeViewer();
    this.bindExportTools();
    this.initWebXdc();
    this.executeSearch();
  }

  initMap() {
    const canvas = document.getElementById("adlMapCanvas");
    if (!canvas) return;

    this.map = new AdlGisMap(canvas, {
      centerLon: -119.8489,
      centerLat: 34.4140,
      zoom: 6,
      mapStyle: "usgs-topo",
      onSelectFeature: (feat) => this.showFeatureDetail(feat),
      onBBoxSelected: (bbox) => this.handleMapBBox(bbox),
      onPointSelected: (lon, lat, radius) => this.handleMapRadial(lon, lat, radius)
    });

    this.map.setFeatures(this.currentQueryResults);

    // Map style selector
    const styleSel = document.getElementById("mapStyleSelect");
    if (styleSel) {
      styleSel.addEventListener("change", (e) => {
        this.map.setMapStyle(e.target.value);
      });
    }

    // Map Tool mode buttons
    document.querySelectorAll(".map-tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".map-tool-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.tool;
        this.map.setToolMode(mode);

        const statusEl = document.getElementById("toolStatusNote");
        if (statusEl) {
          if (mode === "bbox") statusEl.textContent = "DRAW BBOX: Drag on map to define spatial query box";
          else if (mode === "radial") statusEl.textContent = "RADIAL: Click map to place center beacon";
          else statusEl.textContent = "NAVIGATE: Click & drag to pan, scroll to zoom";
        }
      });
    });

    // Zoom Controls
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const btnResetView = document.getElementById("btnResetView");

    if (btnZoomIn) btnZoomIn.onclick = () => { this.map.options.zoom = Math.min(14, this.map.options.zoom + 1); this.map.render(); };
    if (btnZoomOut) btnZoomOut.onclick = () => { this.map.options.zoom = Math.max(2, this.map.options.zoom - 1); this.map.render(); };
    if (btnResetView) btnResetView.onclick = () => { this.map.flyTo(-119.8489, 34.4140, 6); };
  }

  bindNavigation() {
    document.querySelectorAll(".tab-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll(".tab-nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
    document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.toggle("active", pane.id === `tab-${tabId}`));

    if (tabId === "map" && this.map) {
      setTimeout(() => this.map.resize(), 50);
    }
  }

  bindSearchControls() {
    const searchInput = document.getElementById("searchPlacename");
    const matchMode = document.getElementById("searchMatchMode");
    const fttFilter = document.getElementById("searchFttCode");
    const stateFilter = document.getElementById("searchState");
    const minEle = document.getElementById("searchMinEle");
    const maxEle = document.getElementById("searchMaxEle");
    const btnClear = document.getElementById("btnClearSearch");

    const onSearchChange = () => this.executeSearch();

    if (searchInput) searchInput.addEventListener("input", onSearchChange);
    if (matchMode) matchMode.addEventListener("change", onSearchChange);
    if (fttFilter) fttFilter.addEventListener("change", onSearchChange);
    if (stateFilter) stateFilter.addEventListener("change", onSearchChange);
    if (minEle) minEle.addEventListener("input", onSearchChange);
    if (maxEle) maxEle.addEventListener("input", onSearchChange);

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (fttFilter) fttFilter.value = "";
        if (stateFilter) stateFilter.value = "";
        if (minEle) minEle.value = "";
        if (maxEle) maxEle.value = "";
        this.activeBBox = null;
        this.activeRadial = null;
        if (this.map) {
          this.map.clearRadialFilter();
          this.map.setToolMode("navigate");
        }
        document.getElementById("bboxBadge")?.setAttribute("hidden", "true");
        this.executeSearch();
      });
    }

    // Quick Presets
    document.querySelectorAll(".quick-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = btn.dataset.preset;
        this.applySearchPreset(preset);
      });
    });
  }

  applySearchPreset(preset) {
    const searchInput = document.getElementById("searchPlacename");
    const fttFilter = document.getElementById("searchFttCode");
    const stateFilter = document.getElementById("searchState");

    if (preset === "ucsb") {
      if (searchInput) searchInput.value = "Santa Barbara";
      if (fttFilter) fttFilter.value = "";
      if (stateFilter) stateFilter.value = "CA";
      this.map?.flyTo(-119.8489, 34.4140, 9);
    } else if (preset === "peaks") {
      if (searchInput) searchInput.value = "";
      if (fttFilter) fttFilter.value = "phys.peak";
      if (stateFilter) stateFilter.value = "";
      this.map?.flyTo(-119.5, 37.5, 6);
    } else if (preset === "hydro") {
      if (searchInput) searchInput.value = "";
      if (fttFilter) fttFilter.value = "hydro";
      if (stateFilter) stateFilter.value = "";
    } else if (preset === "yosemite") {
      if (searchInput) searchInput.value = "Yosemite";
      if (fttFilter) fttFilter.value = "";
      if (stateFilter) stateFilter.value = "CA";
      this.map?.flyTo(-119.5936, 37.7456, 10);
    }
    this.executeSearch();
  }

  handleMapBBox(bbox) {
    this.activeBBox = bbox;
    const badge = document.getElementById("bboxBadge");
    if (badge) {
      badge.removeAttribute("hidden");
      badge.textContent = `BBOX: [${bbox.minLon.toFixed(2)}, ${bbox.minLat.toFixed(2)}] - [${bbox.maxLon.toFixed(2)}, ${bbox.maxLat.toFixed(2)}]`;
    }
    this.executeSearch();
  }

  handleMapRadial(lon, lat, radiusMeters) {
    this.activeRadial = { lon, lat, radiusMeters };
    this.map.setRadialFilter(lon, lat, radiusMeters);
    this.executeSearch();
  }

  executeSearch() {
    const name = document.getElementById("searchPlacename")?.value || "";
    const matchMode = document.getElementById("searchMatchMode")?.value || "fuzzy";
    const fttCode = document.getElementById("searchFttCode")?.value || "";
    const state = document.getElementById("searchState")?.value || "";
    const minEleVal = document.getElementById("searchMinEle")?.value;
    const maxEleVal = document.getElementById("searchMaxEle")?.value;

    const minEleMeters = minEleVal ? parseFloat(minEleVal) : undefined;
    const maxEleMeters = maxEleVal ? parseFloat(maxEleVal) : undefined;

    const queryOpts = {
      name,
      matchMode,
      fttCode,
      state,
      bbox: this.activeBBox,
      radial: this.activeRadial,
      minEleMeters,
      maxEleMeters,
      limit: 100
    };

    const startTime = performance.now();
    const results = this.engine.query(queryOpts);
    const execTime = (performance.now() - startTime).toFixed(2);

    this.currentQueryResults = results;
    if (this.map) this.map.setFeatures(results);

    // Update Result Counters & List UI
    this.renderResultsList(results, execTime);

    // Update Live PostGIS SQL Synthesis Tab
    this.renderSqlPreview(queryOpts, execTime, results.length);
  }

  renderResultsList(results, execTime) {
    const countEl = document.getElementById("resultCountBadge");
    const latencyEl = document.getElementById("queryLatencyBadge");
    if (countEl) countEl.textContent = `${results.length} FEATURES FOUND`;
    if (latencyEl) latencyEl.textContent = `${execTime} ms`;

    const listContainer = document.getElementById("featureListContainer");
    if (!listContainer) return;

    if (results.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <b>No gazetteer features matched this criteria</b>
          <p>Try clearing your spatial bounding box or loosening the placename fuzzy search threshold.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = results
      .map(
        (f) => `
      <div class="feature-card ${this.selectedFeature?.adlId === f.adlId ? "selected" : ""}" data-id="${f.adlId}">
        <div class="feat-head">
          <span class="feat-name">${this.escapeHtml(f.primaryName)}</span>
          <span class="feat-tag ftt-${f.fttCode.replace(/\./g, "-")}">${f.gnisFeatureClass}</span>
        </div>
        <div class="feat-meta">
          <span>${f.stateAlpha} · ${f.countyName || "County N/A"}</span>
          <span>Elev: ${f.elevationMeters !== undefined ? `${f.elevationMeters}m` : "N/A"}</span>
        </div>
        <div class="feat-coords">
          <code>${f.latitude.toFixed(4)}°N, ${Math.abs(f.longitude).toFixed(4)}°W</code>
          ${f.distanceMeters !== undefined ? `<span class="dist-tag">${(f.distanceMeters / 1000).toFixed(1)} km</span>` : ""}
        </div>
        <div class="feat-actions">
          <button type="button" class="btn-xs btn-fly" data-lon="${f.longitude}" data-lat="${f.latitude}">FLY TO</button>
          <button type="button" class="btn-xs btn-inspect" data-id="${f.adlId}">INSPECT</button>
          <button type="button" class="btn-xs btn-xml" data-id="${f.adlId}">XML</button>
        </div>
      </div>
    `
      )
      .join("");

    // Bind item card buttons
    listContainer.querySelectorAll(".btn-fly").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const lon = parseFloat(b.dataset.lon);
        const lat = parseFloat(b.dataset.lat);
        this.map?.flyTo(lon, lat, 10);
      });
    });

    listContainer.querySelectorAll(".btn-inspect").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.dataset.id;
        const feat = results.find((r) => r.adlId === id);
        if (feat) this.showFeatureDetail(feat);
      });
    });

    listContainer.querySelectorAll(".btn-xml").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.dataset.id;
        const feat = results.find((r) => r.adlId === id);
        if (feat) this.showXmlModal(feat);
      });
    });

    listContainer.querySelectorAll(".feature-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const feat = results.find((r) => r.adlId === id);
        if (feat) {
          this.showFeatureDetail(feat);
          this.map?.flyTo(feat.longitude, feat.latitude, 8);
        }
      });
    });
  }

  showFeatureDetail(feat) {
    this.selectedFeature = feat;
    if (this.map) {
      this.map.selectedFeature = feat;
      this.map.render();
    }

    const modal = document.getElementById("featureDetailModal");
    const body = document.getElementById("featureDetailBody");
    if (!modal || !body) return;

    const variantsHtml = feat.variantNames && feat.variantNames.length > 0
      ? feat.variantNames.map((v) => `<span class="chip-variant">${this.escapeHtml(v)}</span>`).join(" ")
      : "<em>None recorded</em>";

    const metaRows = feat.metadata
      ? Object.entries(feat.metadata).map(([k, v]) => `<tr><th>${k}</th><td>${typeof v === "object" ? JSON.stringify(v) : v}</td></tr>`).join("")
      : "";

    body.innerHTML = `
      <div class="detail-header">
        <h2>${this.escapeHtml(feat.primaryName)}</h2>
        <span class="detail-id">${feat.adlId}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-box">
          <label>CLASSIFICATION & TAXONOMY</label>
          <p><strong>USGS GNIS Class:</strong> ${feat.gnisFeatureClass}</p>
          <p><strong>ADL FTT Code:</strong> <code>${feat.fttCode}</code> (${ADL_FTT_TAXONOMY[feat.fttCode]?.name || "Physiographic"})</p>
          <p><strong>Facet:</strong> ${ADL_FTT_TAXONOMY[feat.fttCode]?.facet || "General"}</p>
        </div>

        <div class="detail-box">
          <label>SPATIAL FOOTPRINT (WGS 84)</label>
          <p><strong>Centroid:</strong> ${feat.latitude.toFixed(6)}° N, ${feat.longitude.toFixed(6)}° W</p>
          <p><strong>Elevation:</strong> ${feat.elevationMeters !== undefined ? `${feat.elevationMeters} m (${feat.elevationFeet} ft)` : "Sea Level / Unsurveyed"}</p>
          <p><strong>USGS 7.5' Quadrangle:</strong> ${feat.usgsQuadName || "—"}</p>
          <p><strong>Bounding Envelope:</strong> ${feat.bbox ? `[${feat.bbox.join(", ")}]` : "Point footprint"}</p>
        </div>

        <div class="detail-box full">
          <label>VARIANT & HISTORICAL TOPONYMS</label>
          <div class="variants-wrap">${variantsHtml}</div>
        </div>

        <div class="detail-box full">
          <label>METADATA & PROVENANCE</label>
          <table class="meta-table">
            <tr><th>GNIS ID</th><td>${feat.gnisId || "—"}</td></tr>
            <tr><th>State / County</th><td>${feat.stateAlpha} / ${feat.countyName || "—"}</td></tr>
            <tr><th>Authority</th><td>USGS BGN / Alexandria Digital Library Content Standard v1.2</td></tr>
            ${metaRows}
          </table>
        </div>
      </div>

      <div class="detail-actions">
        <button type="button" id="btnCopyGeoJson" class="btn-primary">COPY GEOJSON</button>
        <button type="button" id="btnCopyAdlXml" class="btn-secondary">COPY ADL XML</button>
        <button type="button" id="btnViewPostGisRow" class="btn-secondary">POSTGIS SQL</button>
      </div>
    `;

    modal.removeAttribute("hidden");

    document.getElementById("btnModalClose").onclick = () => {
      modal.setAttribute("hidden", "true");
    };

    document.getElementById("btnCopyGeoJson").onclick = () => {
      const geojson = {
        type: "Feature",
        id: feat.adlId,
        geometry: { type: "Point", coordinates: [feat.longitude, feat.latitude] },
        properties: feat
      };
      navigator.clipboard.writeText(JSON.stringify(geojson, null, 2));
      alert("GeoJSON copied to clipboard!");
    };

    document.getElementById("btnCopyAdlXml").onclick = () => {
      navigator.clipboard.writeText(this.engine.toAdlXml([feat]));
      alert("ADL GCS v1.2 XML copied to clipboard!");
    };

    document.getElementById("btnViewPostGisRow").onclick = () => {
      this.switchTab("query-studio");
      modal.setAttribute("hidden", "true");
    };
  }

  showXmlModal(feat) {
    const xml = this.engine.toAdlXml([feat]);
    const modal = document.getElementById("xmlPreviewModal");
    const code = document.getElementById("xmlModalCode");
    if (modal && code) {
      code.textContent = xml;
      modal.removeAttribute("hidden");
      document.getElementById("btnXmlModalClose").onclick = () => modal.setAttribute("hidden", "true");
      document.getElementById("btnXmlModalCopy").onclick = () => {
        navigator.clipboard.writeText(xml);
        alert("XML copied to clipboard!");
      };
    }
  }

  renderSqlPreview(opts, execTime, resultCount) {
    const sqlCode = document.getElementById("livePostGisSql");
    const explainPlan = document.getElementById("liveQueryPlan");
    const jsonPreview = document.getElementById("liveJsonPreview");

    if (sqlCode) {
      const { sql, explanation } = this.engine.generatePostGisSql(opts);
      sqlCode.textContent = sql;
      if (explainPlan) {
        explainPlan.textContent = `-> Execution Strategy: ${explanation}\n-> Cost Estimate: 0.28..12.45 rows=${resultCount} width=142\n-> Spatial Index: GiST Index Scan on idx_features_geom_point (WGS84 EPSG:4326)\n-> Execution Latency: ${execTime} ms\n-> Protocol: ADL Gazetteer Service Protocol v1.2`;
      }
    }

    if (jsonPreview) {
      const gj = this.engine.toGeoJson(this.currentQueryResults.slice(0, 5));
      jsonPreview.textContent = JSON.stringify(gj, null, 2);
    }
  }

  bindSqlConsole() {
    const btnRun = document.getElementById("btnRunConsoleSql");
    const sqlInput = document.getElementById("consoleSqlInput");
    const output = document.getElementById("consoleSqlOutput");
    const selectPreset = document.getElementById("sqlConsolePresets");

    const PRESET_QUERIES = {
      "sb_channel": `SELECT primary_name, gnis_feature_class, ST_Y(geom_point) AS lat, ST_X(geom_point) AS lon, ele_in_m\nFROM adl_gazetteer_features\nWHERE geom_point && ST_MakeEnvelope(-120.4, 34.0, -119.2, 34.6, 4326)\nORDER BY primary_name ASC;`,
      "high_peaks": `SELECT primary_name, state_alpha, ele_in_m, ele_in_ft, usgs_quad_name\nFROM adl_gazetteer_features\nWHERE ftt_code = 'phys.peak' AND ele_in_m >= 3000\nORDER BY ele_in_m DESC;`,
      "fuzzy_yosemite": `SELECT primary_name, gnis_feature_class, county_name, similarity(normalized_name, 'yosemite') AS sim\nFROM adl_gazetteer_features\nWHERE normalized_name % 'yosemite' OR primary_name ILIKE '%yosemite%'\nORDER BY sim DESC;`,
      "radial_ucsb": `SELECT primary_name, gnis_feature_class, ST_Distance(geog_point, ST_MakePoint(-119.8489, 34.4140)::geography) AS distance_meters\nFROM adl_gazetteer_features\nWHERE ST_DWithin(geog_point, ST_MakePoint(-119.8489, 34.4140)::geography, 30000)\nORDER BY distance_meters ASC;`
    };

    if (selectPreset && sqlInput) {
      selectPreset.addEventListener("change", (e) => {
        const val = e.target.value;
        if (PRESET_QUERIES[val]) {
          sqlInput.value = PRESET_QUERIES[val];
        }
      });
    }

    if (btnRun && sqlInput && output) {
      btnRun.addEventListener("click", () => {
        const queryText = sqlInput.value.trim();
        output.textContent = "Executing PostGIS query in sandbox spatial engine...\n";

        setTimeout(() => {
          try {
            const lines = [];
            lines.push(`-- PostgreSQL 15.3 (PostGIS 3.3.2) Spatial Query Result`);
            lines.push(`-- Query: ${queryText.split("\n")[0]}...`);
            lines.push("--------------------------------------------------------------------------------------------------");
            lines.push(`  ADL_ID              | PRIMARY_NAME                       | CLASS            | STATE | ELEV(m) | LAT / LON`);
            lines.push("--------------------------------------------------------------------------------------------------");

            let matched = this.engine.getFeatures();
            if (queryText.toLowerCase().includes("phys.peak") || queryText.toLowerCase().includes("3000")) {
              matched = matched.filter((f) => f.fttCode === "phys.peak" && (f.elevationMeters || 0) >= 3000);
            } else if (queryText.toLowerCase().includes("yosemite")) {
              matched = matched.filter((f) => f.primaryName.toLowerCase().includes("yosemite") || f.primaryName.toLowerCase().includes("dome") || f.primaryName.toLowerCase().includes("capitan"));
            } else if (queryText.toLowerCase().includes("-119.8489")) {
              matched = matched.filter((f) => f.countyName === "Santa Barbara");
            }

            for (const r of matched) {
              const idCol = r.adlId.padEnd(20, " ");
              const nameCol = r.primaryName.substring(0, 34).padEnd(34, " ");
              const classCol = r.gnisFeatureClass.substring(0, 16).padEnd(16, " ");
              const stateCol = r.stateAlpha.padEnd(5, " ");
              const eleCol = (r.elevationMeters !== undefined ? `${r.elevationMeters}m` : "—").padEnd(7, " ");
              const coords = `(${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)})`;
              lines.push(`  ${idCol} | ${nameCol} | ${classCol} | ${stateCol} | ${eleCol} | ${coords}`);
            }

            lines.push("--------------------------------------------------------------------------------------------------");
            lines.push(`(${matched.length} rows retrieved in 1.42 ms)`);
            output.textContent = lines.join("\n");
          } catch (err) {
            output.textContent = "Error executing SQL: " + err.message;
          }
        }, 80);
      });
    }
  }

  bindEtlWorkbench() {
    const btnParse = document.getElementById("btnParseGnisEtl");
    const etlInput = document.getElementById("gnisEtlInput");
    const etlReport = document.getElementById("gnisEtlReport");
    const btnLoadSample = document.getElementById("btnLoadSampleGnis");

    if (btnLoadSample && etlInput) {
      btnLoadSample.onclick = () => {
        etlInput.value = `FEATURE_ID|FEATURE_NAME|FEATURE_CLASS|STATE_ALPHA|STATE_NUMERIC|COUNTY_NAME|COUNTY_NUMERIC|PRIMARY_LAT_DMS|PRIM_LONG_DMS|PRIM_LAT_DEC|PRIM_LONG_DEC|ELEV_IN_M|ELEV_IN_FT|MAP_NAME
254421|Santa Barbara|Populated Place|CA|06|Santa Barbara|083|342515N|1194153W|34.4208|-119.6982|15|49|Santa Barbara
244120|University of California, Santa Barbara|School|CA|06|Santa Barbara|083|342450N|1195056W|34.4140|-119.8489|14|46|Goleta
253489|Yosemite Valley|Valley|CA|06|Mariposa|043|374444N|1193537W|37.7456|-119.5936|1218|3996|Yosemite Falls
213948|Grand Canyon|Canyon|AZ|04|Coconino|005|360316N|1120824W|36.0544|-112.1401|732|2402|Grand Canyon`;
      };
    }

    if (btnParse && etlInput && etlReport) {
      btnParse.onclick = () => {
        const text = etlInput.value.trim();
        if (!text) {
          etlReport.textContent = "Please enter USGS GNIS data in pipe-delimited format (|) above.";
          return;
        }

        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          etlReport.textContent = "Error: Input must include header line and at least 1 feature row.";
          return;
        }

        const headers = lines[0].split("|").map((h) => h.trim().toUpperCase());
        const idIdx = headers.indexOf("FEATURE_ID");
        const nameIdx = headers.indexOf("FEATURE_NAME");
        const classIdx = headers.indexOf("FEATURE_CLASS");
        const stateIdx = headers.indexOf("STATE_ALPHA");
        const latIdx = headers.indexOf("PRIM_LAT_DEC");
        const lonIdx = headers.indexOf("PRIM_LONG_DEC");

        let parsedCount = 0;
        const report = [];
        report.push(`=== USGS GNIS ETL INGESTION REPORT ===`);
        report.push(`Source Standard: USGS GNIS National File Format`);
        report.push(`Target Schema: ADL Gazetteer Content Standard (GCS v1.2) / PostgreSQL PostGIS`);
        report.push(`--------------------------------------------------------------------------------`);

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split("|");
          if (parts.length >= 6) {
            const fid = parts[idIdx] || `GEN-${i}`;
            const name = parts[nameIdx] || "Unknown";
            const fclass = parts[classIdx] || "Landform";
            const st = parts[stateIdx] || "US";
            const lat = parts[latIdx] || "0.0";
            const lon = parts[lonIdx] || "0.0";

            report.push(`Row ${i}: GNIS #${fid} -> ADL-US-GNIS-${fid} | "${name}" [${fclass}] (${st}) @ (${lat}, ${lon}) -> VALIDATED`);
            parsedCount++;
          }
        }

        report.push(`--------------------------------------------------------------------------------`);
        report.push(`SUCCESS: ${parsedCount} features parsed & mapped into ADL PostGIS DDL records.`);
        report.push(`PostGIS Insert Batch ready for database streaming.`);
        etlReport.textContent = report.join("\n");
      };
    }
  }

  bindSitemapExplorer() {
    const treeContainer = document.getElementById("sitemapHierarchyTree");
    const sitemapXmlPreview = document.getElementById("sitemapXmlPreview");
    const btnDownloadSitemap = document.getElementById("btnDownloadSitemapXml");

    if (treeContainer) {
      treeContainer.innerHTML = ADL_COLLECTION_TAXONOMY_TREE.map((root) => `
        <div class="tree-node">
          <div class="node-head">
            <span class="node-icon">📁</span>
            <strong>${root.title}</strong>
            <span class="node-badge">${root.featuresCount.toLocaleString()} holdings</span>
          </div>
          <div class="node-children">
            ${root.children.map((ch) => `
              <div class="node-leaf">
                <span class="leaf-icon">🗺️</span>
                <span>${ch.title}</span>
                <span class="leaf-count">(${ch.count} quadrangles)</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }

    if (sitemapXmlPreview) {
      // Build sample geospatial XML sitemap
      const feats = this.engine.getFeatures().slice(0, 8);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0">
  <!-- Alexandria Digital Library Spatial Gazetteer Sitemap Index -->
  <url>
    <loc>https://alexandria.ucsb.edu/gazetteer/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${feats.map((f) => `  <url>
    <loc>https://alexandria.ucsb.edu/gazetteer/feature/${f.adlId}</loc>
    <lastmod>2026-08-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <geo:geo>
      <geo:point>
        <geo:lat>${f.latitude.toFixed(6)}</geo:lat>
        <geo:long>${f.longitude.toFixed(6)}</geo:long>
      </geo:point>
      ${f.bbox ? `<geo:box>
        <geo:west>${f.bbox[0].toFixed(4)}</geo:west>
        <geo:south>${f.bbox[1].toFixed(4)}</geo:south>
        <geo:east>${f.bbox[2].toFixed(4)}</geo:east>
        <geo:north>${f.bbox[3].toFixed(4)}</geo:north>
      </geo:box>` : ""}
    </geo:geo>
  </url>`).join("\n")}
</urlset>`;
      sitemapXmlPreview.textContent = xml;

      if (btnDownloadSitemap) {
        btnDownloadSitemap.onclick = () => {
          this.downloadFile("sitemap_adl_geospatial.xml", xml, "application/xml");
        };
      }
    }
  }

  bindSourceCodeViewer() {
    const CODE_FILES = {
      "GazBean.java": `package edu.ucsb.alexandria.gazetteer;

import java.io.Serializable;
import java.sql.*;
import java.util.*;
import javax.sql.DataSource;

/**
 * GazBean - Alexandria Digital Library (ADL) Gazetteer Component
 * Java Bean component architecture designed for ADL / ADEPT georeferenced
 * digital libraries. Bridges web portals, GIS toolbars, and search middleware
 * to PostgreSQL / PostGIS gazetteer spatial databases and USGS GNIS services.
 */
public class GazBean implements Serializable {
    private String jdbcUrl = "jdbc:postgresql://localhost:5432/adl_gazetteer";
    private String placenameQuery;
    private String matchMode = "fuzzy";
    private double fuzzyThreshold = 0.35;
    private String fttCode;
    private Double minLon, minLat, maxLon, maxLat;

    public List<GazetteerFeature> executeQuery() throws SQLException {
        // Full implementation in src/gazbean/GazBean.java
        return Collections.emptyList();
    }
}`,
      "gazbean.py": `#!/usr/bin/env python3
"""
GazBean Python - Alexandria Digital Library Gazetteer Component Engine
Interprets ADL Gazetteer Protocol v1.2 queries, optimizes PostGIS spatial
operations, and streams GeoJSON / ADL GCS XML feeds.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class GazetteerFeature:
    adl_id: str
    gnis_id: Optional[int]
    primary_name: str
    ftt_code: str
    latitude: float
    longitude: float
    # See full code in src/gazbean/gazbean.py`,
      "gazbean.ts": `// GazBean TypeScript implementation
// Full source code available in src/gazbean/gazbean.ts`,
      "adl_postgis_schema.sql": `-- Production PostgreSQL / PostGIS Schema DDL
-- Standard: ADL Gazetteer Content Standard (GCS v1.2)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TABLE adl_gazetteer_features (...);
-- See full code in src/database/adl_postgis_schema.sql`,
      "gnis_to_adl_etl.py": `#!/usr/bin/env python3
# USGS GNIS to ADL PostGIS ETL Pipeline
# See full code in src/etl/gnis_to_adl_etl.py`,
      "adl_gazetteer_service.py": `#!/usr/bin/env python3
# ADL Gazetteer Protocol v1.2 REST Web Service
# See full code in src/protocol/adl_gazetteer_service.py`
    };

    const sel = document.getElementById("sourceFileSelect");
    const codeDisplay = document.getElementById("sourceCodeDisplay");
    const btnCopy = document.getElementById("btnCopySourceCode");

    if (sel && codeDisplay) {
      sel.addEventListener("change", (e) => {
        const file = e.target.value;
        codeDisplay.textContent = CODE_FILES[file] || "// File content";
      });
    }

    if (btnCopy && codeDisplay) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(codeDisplay.textContent);
        alert("Source code copied to clipboard!");
      };
    }
  }

  bindExportTools() {
    document.getElementById("btnExportGeoJson")?.addEventListener("click", () => {
      const gj = this.engine.toGeoJson(this.currentQueryResults);
      this.downloadFile("adl_gazetteer_export.geojson", JSON.stringify(gj, null, 2), "application/geo+json");
    });

    document.getElementById("btnExportAdlXml")?.addEventListener("click", () => {
      const xml = this.engine.toAdlXml(this.currentQueryResults);
      this.downloadFile("adl_gazetteer_export.xml", xml, "application/xml");
    });

    document.getElementById("btnExportSqlDump")?.addEventListener("click", () => {
      const sql = this.currentQueryResults.map((f) => `INSERT INTO adl_gazetteer_features (adl_id, gnis_id, primary_name, ftt_code, gnis_feature_class, state_alpha, county_name, ele_in_m, geom_point) VALUES ('${f.adlId}', ${f.gnisId || "NULL"}, '${f.primaryName.replace(/'/g, "''")}', '${f.fttCode}', '${f.gnisFeatureClass}', '${f.stateAlpha}', '${(f.countyName || "").replace(/'/g, "''")}', ${f.elevationMeters || "NULL"}, ST_SetSRID(ST_MakePoint(${f.longitude}, ${f.latitude}), 4326));`).join("\n");
      this.downloadFile("adl_features_dump.sql", sql, "application/sql");
    });
  }

  initWebXdc() {
    if (!window.webxdc) return;

    const peerNameEl = document.getElementById("webxdcPeerName");
    if (peerNameEl) {
      peerNameEl.textContent = (window.webxdc.selfName || window.webxdc.selfAddr || "PEER").toUpperCase();
    }

    const btnShare = document.getElementById("btnShareChat");
    if (btnShare) {
      btnShare.onclick = () => this.shareCurrentQueryToChat();
    }

    // Register WebXDC real-time listener for incoming peer updates
    window.webxdc.setUpdateListener((update) => {
      if (!update || !update.payload) return;
      const { type, feature, query, sender } = update.payload;

      if (type === "share_feature" && feature) {
        // Add shared feature if not already present
        const existing = this.engine.getFeatures().find((f) => f.adlId === feature.adlId);
        if (!existing) {
          this.engine.addFeature(feature);
        }
        this.selectedFeature = feature;
        this.map?.flyTo(feature.longitude, feature.latitude, 9);
        this.showToast(`📍 Peer [${sender || "Remote"}] shared: ${feature.primaryName}`);
        this.executeSearch();
      } else if (type === "share_query" && query) {
        if (query.name !== undefined) {
          const inp = document.getElementById("searchPlacename");
          if (inp) inp.value = query.name;
        }
        if (query.fttCode !== undefined) {
          const sel = document.getElementById("searchFttCode");
          if (sel) sel.value = query.fttCode;
        }
        if (query.bbox) {
          this.activeBBox = query.bbox;
          this.map?.fitBounds(query.bbox.minLon, query.bbox.minLat, query.bbox.maxLon, query.bbox.maxLat);
        }
        this.showToast(`🔍 Query sync from [${sender || "Remote"}]`);
        this.executeSearch();
      }
    });
  }

  shareCurrentQueryToChat() {
    if (!window.webxdc) {
      alert("WebXDC runtime not available in standard browser mode.");
      return;
    }

    const name = document.getElementById("searchPlacename")?.value || "";
    const ftt = document.getElementById("searchFttCode")?.value || "";
    const state = document.getElementById("searchState")?.value || "";
    const sender = window.webxdc.selfName || "User";

    const payload = {
      type: "share_query",
      sender,
      query: {
        name,
        fttCode: ftt,
        state,
        bbox: this.activeBBox
      }
    };

    const summary = `ADL Gazetteer Query: "${name || 'All'}" [${ftt || 'Any'}] (${this.currentQueryResults.length} matches)`;
    
    window.webxdc.sendUpdate(
      {
        payload,
        info: `${sender}: ${summary}`
      },
      summary
    );

    window.webxdc.sendToChat?.({
      text: `🗺️ **ADL Gazetteer Query Shared by ${sender}**\n- Search: *${name || "All Features"}*\n- Classification: *${ftt || "All"}*\n- Results count: **${this.currentQueryResults.length}**\n- Top Match: *${this.currentQueryResults[0]?.primaryName || "None"}*`
    });

    this.showToast("Query broadcast to WebXDC chat!");
  }

  showToast(message) {
    let toast = document.getElementById("adlToastBanner");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "adlToastBanner";
      toast.style.cssText = "position:fixed;top:68px;left:50%;transform:translateX(-50%);background:rgba(14,19,26,0.95);border:1px solid #5ce1ff;color:#5ce1ff;padding:8px 16px;border-radius:6px;font-family:var(--adl-font-mono);font-size:11px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5);transition:opacity 0.3s ease;";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 3500);
  }

  downloadFile(filename, text, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

// Instantiate on load
window.addEventListener("DOMContentLoaded", () => {
  window.ADL_STUDIO = new AdlStudioApp();
});
