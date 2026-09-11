/**
 * ============================================================================
 * ADL GIS Interactive Vector & Topographic Map Engine
 * ============================================================================
 * High-performance HTML5 Canvas GIS engine with coordinate projection,
 * USGS 3DEP hypsometric relief, bounding box selection, radial buffer tools,
 * and ADL Gazetteer spatial footprint visualization.
 * ============================================================================
 */

import { haversineDistance } from "../src/gazbean/gazbean.js";

// Color palettes for FTT Facets
export const FTT_COLORS = {
  "phys": "#e5c07b",       // Gold / Ochre for landforms/peaks
  "phys.peak": "#ffd700",  // Bright gold for summits
  "phys.valley": "#d19a66",// Canyon orange
  "phys.range": "#e06c75", // Mountain ridge crimson
  "phys.island": "#98c379",// Island green
  "hydro": "#5ce1ff",      // Cyan for hydrographic
  "hydro.stream": "#61afef",// River blue
  "hydro.lake": "#56b6c2", // Lake turquoise
  "hydro.marine": "#38bdf8",// Marine ocean blue
  "hydro.spring": "#00f0ff",// Bright thermal cyan
  "pop": "#f59e0b",        // Populated place amber
  "pop.city": "#fbbf24",   // Incorporated city
  "pop.town": "#fde68a",   // Unincorporated town
  "admin": "#10b981",      // Administrative emerald
  "admin.park": "#34d399", // Park green
  "manmade": "#c678dd",    // Manmade purple
  "manmade.transport": "#a855f7"
};

export class AdlGisMap {
  constructor(canvasId, options = {}) {
    this.canvas = typeof canvasId === "string" ? document.getElementById(canvasId) : canvasId;
    this.ctx = this.canvas.getContext("2d");
    this.options = Object.assign({
      centerLon: -119.8489,
      centerLat: 34.4140,
      zoom: 6, // 1 to 14
      mapStyle: "usgs-topo", // "usgs-topo", "dark-gis", "satellite", "hydro"
      onSelectFeature: null,
      onBBoxSelected: null,
      onPointSelected: null
    }, options);

    this.features = [];
    this.selectedFeature = null;
    this.hoveredFeature = null;

    // Interaction Modes: "navigate", "bbox", "radial", "inspect"
    this.toolMode = "navigate";
    this.bboxStart = null;
    this.bboxCurrent = null;
    this.radialCenter = null;
    this.radialRadiusMeters = 50000;

    // Drag State
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.startCenterLon = 0;
    this.startCenterLat = 0;

    this.mouseLon = 0;
    this.mouseLat = 0;

    this.initEvents();
    this.resize();
    this.render();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || this.canvas.parentElement.clientWidth || 800;
    this.height = rect.height || this.canvas.parentElement.clientHeight || 500;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  setFeatures(features) {
    this.features = features;
    this.render();
  }

  setMapStyle(style) {
    this.options.mapStyle = style;
    this.render();
  }

  setToolMode(mode) {
    this.toolMode = mode;
    if (mode !== "bbox") {
      this.bboxStart = null;
      this.bboxCurrent = null;
    }
    this.render();
  }

  setRadialFilter(lon, lat, radiusMeters) {
    this.radialCenter = { lon, lat };
    this.radialRadiusMeters = radiusMeters;
    this.render();
  }

  clearRadialFilter() {
    this.radialCenter = null;
    this.render();
  }

  // Coordinate Projection (Equirectangular / Web Mercator approximation centered on viewport)
  lonLatToScreen(lon, lat) {
    const scale = Math.pow(2, this.options.zoom) * 8;
    const cosCenterLat = Math.cos((this.options.centerLat * Math.PI) / 180);
    const x = (this.width / 2) + (lon - this.options.centerLon) * scale * cosCenterLat;
    const y = (this.height / 2) - (lat - this.options.centerLat) * scale;
    return { x, y };
  }

  screenToLonLat(x, y) {
    const scale = Math.pow(2, this.options.zoom) * 8;
    const cosCenterLat = Math.cos((this.options.centerLat * Math.PI) / 180);
    const lon = this.options.centerLon + (x - this.width / 2) / (scale * cosCenterLat);
    const lat = this.options.centerLat - (y - this.height / 2) / scale;
    return { lon, lat };
  }

  fitBounds(minLon, minLat, maxLon, maxLat) {
    this.options.centerLon = (minLon + maxLon) / 2;
    this.options.centerLat = (minLat + maxLat) / 2;
    const dLon = Math.max(0.01, Math.abs(maxLon - minLon));
    const dLat = Math.max(0.01, Math.abs(maxLat - minLat));
    const zoomLon = Math.log2((this.width * 0.7) / (dLon * 8 * Math.cos((this.options.centerLat * Math.PI) / 180)));
    const zoomLat = Math.log2((this.height * 0.7) / (dLat * 8));
    this.options.zoom = Math.max(2, Math.min(13, Math.floor(Math.min(zoomLon, zoomLat))));
    this.render();
  }

  flyTo(lon, lat, zoom = 9) {
    this.options.centerLon = lon;
    this.options.centerLat = lat;
    this.options.zoom = zoom;
    this.render();
  }

  initEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener("dblclick", (e) => this.onDoubleClick(e));

    // Touch Support
    this.canvas.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener("touchend", (e) => this.onTouchEnd(e), { passive: false });
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onMouseDown(e) {
    if (e.button !== 0) return;
    const pos = this.getCanvasPos(e);
    const geo = this.screenToLonLat(pos.x, pos.y);

    if (this.toolMode === "bbox") {
      this.isDragging = true;
      this.bboxStart = geo;
      this.bboxCurrent = geo;
    } else if (this.toolMode === "radial") {
      this.radialCenter = geo;
      if (this.options.onPointSelected) {
        this.options.onPointSelected(geo.lon, geo.lat, this.radialRadiusMeters);
      }
      this.render();
    } else {
      // Check feature click first
      const clicked = this.findFeatureAt(pos.x, pos.y);
      if (clicked) {
        this.selectedFeature = clicked;
        if (this.options.onSelectFeature) this.options.onSelectFeature(clicked);
        this.render();
        return;
      }
      this.isDragging = true;
      this.dragStartX = pos.x;
      this.dragStartY = pos.y;
      this.startCenterLon = this.options.centerLon;
      this.startCenterLat = this.options.centerLat;
    }
  }

  onMouseMove(e) {
    const pos = this.getCanvasPos(e);
    const geo = this.screenToLonLat(pos.x, pos.y);
    this.mouseLon = geo.lon;
    this.mouseLat = geo.lat;

    // Trigger HUD coordinates update
    const hud = document.getElementById("mapCoordsHud");
    if (hud) {
      const latStr = `${Math.abs(geo.lat).toFixed(4)}° ${geo.lat >= 0 ? "N" : "S"}`;
      const lonStr = `${Math.abs(geo.lon).toFixed(4)}° ${geo.lon >= 0 ? "E" : "W"}`;
      hud.textContent = `WGS84: ${latStr}  ${lonStr}  ·  ZOOM: ${this.options.zoom}x`;
    }

    if (this.isDragging) {
      if (this.toolMode === "bbox") {
        this.bboxCurrent = geo;
        this.render();
      } else if (this.toolMode === "navigate") {
        const dx = pos.x - this.dragStartX;
        const dy = pos.y - this.dragStartY;
        const scale = Math.pow(2, this.options.zoom) * 8;
        const cosCenterLat = Math.cos((this.options.centerLat * Math.PI) / 180);
        this.options.centerLon = this.startCenterLon - dx / (scale * cosCenterLat);
        this.options.centerLat = this.startCenterLat + dy / scale;
        this.render();
      }
    } else {
      const hovered = this.findFeatureAt(pos.x, pos.y);
      if (hovered !== this.hoveredFeature) {
        this.hoveredFeature = hovered;
        this.canvas.style.cursor = hovered ? "pointer" : (this.toolMode === "bbox" ? "crosshair" : "grab");
        this.render();
      }
    }
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.toolMode === "bbox" && this.bboxStart && this.bboxCurrent) {
      const minLon = Math.min(this.bboxStart.lon, this.bboxCurrent.lon);
      const maxLon = Math.max(this.bboxStart.lon, this.bboxCurrent.lon);
      const minLat = Math.min(this.bboxStart.lat, this.bboxCurrent.lat);
      const maxLat = Math.max(this.bboxStart.lat, this.bboxCurrent.lat);

      if (Math.abs(maxLon - minLon) > 0.001 && Math.abs(maxLat - minLat) > 0.001) {
        if (this.options.onBBoxSelected) {
          this.options.onBBoxSelected({ minLon, minLat, maxLon, maxLat });
        }
      }
    }
    this.render();
  }

  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    const oldZoom = this.options.zoom;
    const newZoom = Math.max(2, Math.min(14, oldZoom + delta * 0.5));
    if (newZoom !== oldZoom) {
      this.options.zoom = newZoom;
      this.render();
    }
  }

  onDoubleClick(e) {
    const pos = this.getCanvasPos(e);
    const geo = this.screenToLonLat(pos.x, pos.y);
    this.options.centerLon = geo.lon;
    this.options.centerLat = geo.lat;
    this.options.zoom = Math.min(14, this.options.zoom + 1);
    this.render();
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseDown({ button: 0, clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  onTouchEnd(e) {
    this.onMouseUp(e);
  }

  findFeatureAt(screenX, screenY) {
    const hitRadius = 14;
    for (let i = this.features.length - 1; i >= 0; i--) {
      const feat = this.features[i];
      const p = this.lonLatToScreen(feat.longitude, feat.latitude);
      const dist = Math.hypot(p.x - screenX, p.y - screenY);
      if (dist <= hitRadius) {
        return feat;
      }
    }
    return null;
  }

  // ==========================================================================
  // RENDERING PIPELINE
  // ==========================================================================
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Base Map Background
    this.renderBackground(ctx, w, h);

    // 2. Graticules / Coordinate Grid
    this.renderGraticules(ctx, w, h);

    // 3. Simulated Topographic Contours & Shoreline Polygons
    this.renderTerrainAndCoast(ctx, w, h);

    // 4. Radial Distance Buffer (if active)
    if (this.radialCenter) {
      this.renderRadialBuffer(ctx);
    }

    // 5. Active Bounding Box (if drawing)
    if (this.bboxStart && this.bboxCurrent) {
      this.renderBBoxSelection(ctx);
    }

    // 6. Feature Footprints & Bounding Boxes
    this.renderFeatureBBoxes(ctx);

    // 7. Feature Point Markers
    this.renderFeatureMarkers(ctx);

    // 8. Hover Tooltip & Selection Glow
    if (this.hoveredFeature || this.selectedFeature) {
      this.renderOverlayCard(ctx);
    }

    // 9. Map Scale Bar & Compass Rose
    this.renderMapAdornments(ctx, w, h);
  }

  renderBackground(ctx, w, h) {
    const style = this.options.mapStyle;
    if (style === "dark-gis") {
      ctx.fillStyle = "#05080b";
      ctx.fillRect(0, 0, w, h);
    } else if (style === "satellite") {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
      grad.addColorStop(0, "#0e1e28");
      grad.addColorStop(1, "#04090e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (style === "hydro") {
      ctx.fillStyle = "#03131d";
      ctx.fillRect(0, 0, w, h);
    } else {
      // usgs-topo style: USGS topographic dark-sepia aesthetic
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0d131a");
      grad.addColorStop(1, "#080c10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  renderGraticules(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(92, 225, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(92, 225, 255, 0.4)";
    ctx.font = "9px 'SF Mono', Monaco, monospace";

    const step = this.options.zoom >= 8 ? 0.5 : (this.options.zoom >= 5 ? 2 : 10);
    const bounds = {
      nw: this.screenToLonLat(0, 0),
      se: this.screenToLonLat(w, h)
    };

    const minLon = Math.floor(Math.min(bounds.nw.lon, bounds.se.lon) / step) * step;
    const maxLon = Math.ceil(Math.max(bounds.nw.lon, bounds.se.lon) / step) * step;
    const minLat = Math.floor(Math.min(bounds.nw.lat, bounds.se.lat) / step) * step;
    const maxLat = Math.ceil(Math.max(bounds.nw.lat, bounds.se.lat) / step) * step;

    // Draw Longitude meridians
    for (let lon = minLon; lon <= maxLon; lon += step) {
      const pTop = this.lonLatToScreen(lon, maxLat);
      const pBot = this.lonLatToScreen(lon, minLat);
      ctx.beginPath();
      ctx.moveTo(pTop.x, 0);
      ctx.lineTo(pBot.x, h);
      ctx.stroke();

      if (pTop.x > 10 && pTop.x < w - 40) {
        ctx.fillText(`${lon.toFixed(1)}°`, pTop.x + 4, 14);
      }
    }

    // Draw Latitude parallels
    for (let lat = minLat; lat <= maxLat; lat += step) {
      const pLeft = this.lonLatToScreen(minLon, lat);
      const pRight = this.lonLatToScreen(maxLon, lat);
      ctx.beginPath();
      ctx.moveTo(0, pLeft.y);
      ctx.lineTo(w, pRight.y);
      ctx.stroke();

      if (pLeft.y > 20 && pLeft.y < h - 10) {
        ctx.fillText(`${lat.toFixed(1)}°`, 8, pLeft.y - 4);
      }
    }

    ctx.restore();
  }

  renderTerrainAndCoast(ctx, w, h) {
    ctx.save();
    // Approximate Western US & California Coastline + Channel Islands vector
    const coastPoints = [
      [-124.7, 48.4], [-124.2, 46.2], [-124.4, 43.4], [-124.2, 40.4],
      [-123.0, 38.0], [-122.5, 37.8], [-122.0, 36.6], [-120.6, 34.9],
      [-120.4, 34.4], [-119.8, 34.4], [-119.2, 34.2], [-118.5, 34.0],
      [-117.2, 32.7], [-117.1, 32.5]
    ];

    ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (const pt of coastPoints) {
      const p = this.lonLatToScreen(pt[0], pt[1]);
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    // Topographic Elevation Contours (Hypsometric isolines for peaks)
    ctx.strokeStyle = "rgba(229, 192, 123, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    for (const feat of this.features) {
      if (feat.elevationMeters && feat.elevationMeters > 500) {
        const p = this.lonLatToScreen(feat.longitude, feat.latitude);
        const radius = Math.min(60, (feat.elevationMeters / 100) * (this.options.zoom / 4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        if (feat.elevationMeters > 2000) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  renderRadialBuffer(ctx) {
    const center = this.lonLatToScreen(this.radialCenter.lon, this.radialCenter.lat);
    const scale = Math.pow(2, this.options.zoom) * 8;
    const cosCenterLat = Math.cos((this.radialCenter.lat * Math.PI) / 180);
    // Convert meters to degree delta approx (1 deg lat ~ 111,320m)
    const degRadius = this.radialRadiusMeters / 111320;
    const pixelRadius = degRadius * scale;

    ctx.save();
    ctx.fillStyle = "rgba(92, 225, 255, 0.08)";
    ctx.strokeStyle = "#5ce1ff";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.arc(center.x, center.y, pixelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beacon Pulse Center
    ctx.setLineDash([]);
    ctx.fillStyle = "#5ce1ff";
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Distance Label
    ctx.fillStyle = "#5ce1ff";
    ctx.font = "10px monospace";
    ctx.fillText(`${Math.round(this.radialRadiusMeters / 1000)} km buffer`, center.x + pixelRadius + 6, center.y + 4);
    ctx.restore();
  }

  renderBBoxSelection(ctx) {
    const p1 = this.lonLatToScreen(this.bboxStart.lon, this.bboxStart.lat);
    const p2 = this.lonLatToScreen(this.bboxCurrent.lon, this.bboxCurrent.lat);
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const bw = Math.abs(p1.x - p2.x);
    const bh = Math.abs(p1.y - p2.y);

    ctx.save();
    ctx.fillStyle = "rgba(251, 191, 36, 0.12)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeRect(x, y, bw, bh);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "10px monospace";
    const minLon = Math.min(this.bboxStart.lon, this.bboxCurrent.lon).toFixed(3);
    const maxLon = Math.max(this.bboxStart.lon, this.bboxCurrent.lon).toFixed(3);
    const minLat = Math.min(this.bboxStart.lat, this.bboxCurrent.lat).toFixed(3);
    const maxLat = Math.max(this.bboxStart.lat, this.bboxCurrent.lat).toFixed(3);
    ctx.fillText(`BBox: [${minLon}, ${minLat}] to [${maxLon}, ${maxLat}]`, x + 4, y - 6);
    ctx.restore();
  }

  renderFeatureBBoxes(ctx) {
    ctx.save();
    for (const feat of this.features) {
      if (feat.bbox && Array.isArray(feat.bbox) && feat.bbox.length === 4) {
        const [minLon, minLat, maxLon, maxLat] = feat.bbox;
        const nw = this.lonLatToScreen(minLon, maxLat);
        const se = this.lonLatToScreen(maxLon, minLat);
        const bw = Math.abs(se.x - nw.x);
        const bh = Math.abs(se.y - nw.y);

        const color = FTT_COLORS[feat.fttCode] || "#5ce1ff";
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1;
        ctx.strokeRect(nw.x, nw.y, bw, bh);

        if (this.hoveredFeature === feat || this.selectedFeature === feat) {
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = color;
          ctx.fillRect(nw.x, nw.y, bw, bh);
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 2;
          ctx.strokeRect(nw.x, nw.y, bw, bh);
        }
      }
    }
    ctx.restore();
  }

  renderFeatureMarkers(ctx) {
    ctx.save();
    for (const feat of this.features) {
      const p = this.lonLatToScreen(feat.longitude, feat.latitude);
      if (p.x < -20 || p.x > this.width + 20 || p.y < -20 || p.y > this.height + 20) {
        continue;
      }

      const isHovered = this.hoveredFeature === feat;
      const isSelected = this.selectedFeature === feat;
      const color = FTT_COLORS[feat.fttCode] || "#5ce1ff";

      // Outer Pulse Glow for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 16 : 12, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "rgba(255, 215, 0, 0.25)" : "rgba(92, 225, 255, 0.25)";
        ctx.fill();
      }

      // Marker Icon Node
      ctx.beginPath();
      const radius = isSelected ? 8 : (isHovered ? 7 : 5);
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#0d1117";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Feature Label (show on higher zoom or when hovered)
      if (this.options.zoom >= 6 || isHovered || isSelected) {
        ctx.font = isSelected ? "bold 11px monospace" : "10px monospace";
        ctx.fillStyle = isSelected ? "#fff" : (isHovered ? "#5ce1ff" : "rgba(230, 237, 243, 0.85)");
        const nameText = feat.primaryName.length > 24 ? feat.primaryName.substring(0, 22) + "…" : feat.primaryName;
        ctx.fillText(nameText, p.x + radius + 4, p.y + 3);
      }
    }
    ctx.restore();
  }

  renderOverlayCard(ctx) {
    const feat = this.hoveredFeature || this.selectedFeature;
    if (!feat) return;

    const p = this.lonLatToScreen(feat.longitude, feat.latitude);
    const cardW = 260;
    const cardH = 92;
    let cardX = p.x + 16;
    let cardY = p.y - cardH / 2;

    if (cardX + cardW > this.width - 10) cardX = p.x - cardW - 16;
    if (cardY < 10) cardY = 10;
    if (cardY + cardH > this.height - 10) cardY = this.height - cardH - 10;

    ctx.save();
    // Backdrop
    ctx.fillStyle = "rgba(10, 14, 20, 0.94)";
    ctx.strokeStyle = FTT_COLORS[feat.fttCode] || "#5ce1ff";
    ctx.lineWidth = 1.5;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Connector Line to Pin
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(cardX > p.x ? cardX : cardX + cardW, cardY + cardH / 2);
    ctx.strokeStyle = "rgba(92, 225, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Content
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(feat.primaryName.substring(0, 28), cardX + 10, cardY + 18);

    ctx.fillStyle = FTT_COLORS[feat.fttCode] || "#5ce1ff";
    ctx.font = "10px monospace";
    ctx.fillText(`${feat.gnisFeatureClass}  ·  FTT: ${feat.fttCode}`, cardX + 10, cardY + 34);

    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`State: ${feat.stateAlpha} | County: ${feat.countyName || "—"}`, cardX + 10, cardY + 50);

    const eleText = feat.elevationMeters !== undefined ? `${feat.elevationMeters}m (${feat.elevationFeet}ft)` : "N/A";
    ctx.fillText(`Elev: ${eleText} | Quad: ${feat.usgsQuadName || "—"}`, cardX + 10, cardY + 66);

    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`ID: ${feat.adlId} (GNIS #${feat.gnisId || "—"})`, cardX + 10, cardY + 82);

    ctx.restore();
  }

  renderMapAdornments(ctx, w, h) {
    ctx.save();
    // Scale Bar in bottom-left
    const scaleX = 20;
    const scaleY = h - 20;
    const scalePixelW = 100;
    const scale = Math.pow(2, this.options.zoom) * 8;
    const cosCenterLat = Math.cos((this.options.centerLat * Math.PI) / 180);
    const degSpan = scalePixelW / (scale * cosCenterLat);
    const kmSpan = degSpan * 111.32;
    const miSpan = kmSpan * 0.621371;

    ctx.strokeStyle = "#5ce1ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scalePixelW, scaleY);
    ctx.lineTo(scaleX + scalePixelW, scaleY - 4);
    ctx.stroke();

    ctx.fillStyle = "#5ce1ff";
    ctx.font = "9px monospace";
    ctx.fillText(`${Math.round(kmSpan)} km  /  ${Math.round(miSpan)} mi`, scaleX + 6, scaleY - 6);

    // North Arrow in top-right
    const compassX = w - 30;
    const compassY = 30;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 14);
    ctx.lineTo(compassX + 5, compassY + 4);
    ctx.lineTo(compassX, compassY);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 14);
    ctx.lineTo(compassX - 5, compassY + 4);
    ctx.lineTo(compassX, compassY);
    ctx.fill();

    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("N", compassX - 3, compassY - 18);
    ctx.restore();
  }
}
