/** VRML 2.0 terrarium writer — Terraink layers as named DEF groups. */

function fmt(n) {
  return Number(n).toFixed(4);
}

function sanitizeTitle(s) {
  return String(s).replace(/["\r\n]/g, "").slice(0, 200);
}

export const VRML_LAYERS = [
  { id: "terrain", label: "MESH" },
  { id: "contours", label: "CONTOUR" },
  { id: "hachure", label: "HACHURE" },
  { id: "drain", label: "DRAIN" },
  { id: "outline", label: "OUTLINE" },
  { id: "roads", label: "ROADS" },
  { id: "weather", label: "WX" },
  { id: "glass", label: "GLASS" },
  { id: "nodes", label: "NODES" },
];

export function defaultLayers() {
  return Object.fromEntries(VRML_LAYERS.map((l) => [l.id, true]));
}

function lineSet(points, color, name) {
  if (!points || points.length < 6) return "";
  // Validate numeric input to avoid NaN in VRML
  if (points.some((v) => !Number.isFinite(v))) return "";
  const coords = [];
  const idx = [];
  for (let i = 0; i + 5 < points.length; i += 6) {
    const n = coords.length / 3;
    coords.push(fmt(points[i]), fmt(points[i + 1]), fmt(points[i + 2]), fmt(points[i + 3]), fmt(points[i + 4]), fmt(points[i + 5]));
    idx.push(`${n} ${n + 1} -1`);
  }
  const pts = [];
  for (let i = 0; i < coords.length; i += 3) pts.push(`${coords[i]} ${coords[i + 1]} ${coords[i + 2]}`);
  const safeName = String(name).replace(/[^A-Za-z0-9_]/g, "_");
  return `
DEF LAYER_${safeName} Transform {
  children [
    Shape {
      appearance Appearance { material Material { emissiveColor ${color} } }
      geometry IndexedLineSet {
        coord Coordinate { point [ ${pts.join(", ")} ] }
        coordIndex [ ${idx.join(" ")} ]
      }
    }
  ]
}`;
}

export function demToVrml(dem, world, wx, title = "SITE-K Terrarium", extra = {}) {
  const layers = { ...defaultLayers(), ...(extra.layers || {}) };
  const { nx, ny, elev } = dem;
  const stepX = Math.max(1, extra.stepX || 3);
  const stepY = Math.max(1, extra.stepY || 3);
  const cx = Math.ceil(nx / stepX);
  const cy = Math.ceil(ny / stepY);
  const coords = [];
  for (let j = 0; j < ny; j += stepY) {
    for (let i = 0; i < nx; i += stepX) {
      const x = (i / (nx - 1) - 0.5) * world.w;
      const z = (j / (ny - 1) - 0.5) * world.d;
      const y = elev[j * nx + i] * world.elevScale;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      coords.push(`${fmt(x)} ${fmt(y)} ${fmt(z)}`);
    }
  }
  const faces = [];
  for (let j = 0; j < cy - 1; j++) {
    for (let i = 0; i < cx - 1; i++) {
      const a = j * cx + i;
      const b = a + 1;
      const c = a + cx;
      const d = c + 1;
      faces.push(`${a} ${c} ${b} -1`, `${b} ${c} ${d} -1`);
    }
  }

  const rain = [];
  if (layers.weather && wx && (wx.precipIn > 0.01 || /rain|snow/.test(String(wx.text || "").toLowerCase()))) {
    for (let k = 0; k < 180; k++) {
      const x = Math.sin(k * 12.1) * 0.5 * world.w * 0.9;
      const z = Math.cos(k * 7.7) * 0.5 * world.d * 0.9;
      const y = 4 + (k % 17) * 0.35;
      rain.push(`${fmt(x)} ${fmt(y)} ${fmt(z)}`);
    }
  }

  const nodeShapes = (extra.nodes || [])
    .map((n) => {
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y) || !Number.isFinite(n.z)) return "";
      return `Transform { translation ${fmt(n.x)} ${fmt(n.y + 0.2)} ${fmt(n.z)} children [ Shape { appearance Appearance { material Material { diffuseColor 1 0.7 0.12 } } geometry Box { size 0.18 0.4 0.18 } } ] }`;
    })
    .filter(Boolean)
    .join("\n");

  const safeTitle = sanitizeTitle(title);
  const wxSource = sanitizeTitle(wx?.source || "n/a");
  const wxText = sanitizeTitle(wx?.text || "");
  const tempStr = wx?.tempF?.toFixed?.(1) || "—";

  const parts = [];
  parts.push(`#VRML V2.0 utf8
# SITE-K terrarium — ${safeTitle}
# weather ${wxSource}  ${tempStr}F  ${wxText}
# generated ${new Date().toISOString()}
# layers ${Object.entries(layers)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(" ")}

WorldInfo {
  title "${safeTitle}"
  info [ "USGS 3DEP reconstruction", "NOAA / WU live weather", "Terraink line-art sibling", "SFX installer sibling" ]
}

Background { skyColor [ 0.06 0.10 0.09 ] }
NavigationInfo { type [ "EXAMINE" "ANY" ] headlight TRUE }

DirectionalLight { direction -0.4 -1 -0.3 color 0.6 0.9 0.55 intensity 0.8 }
DirectionalLight { direction 0.6 -0.4 0.5 color 1 0.7 0.3 intensity 0.35 }
`);

  if (layers.glass) {
    parts.push(`
DEF LAYER_GLASS Transform {
  translation 0 ${fmt(world.w * 0.08)} 0
  children [
    Shape {
      appearance Appearance {
        material Material { diffuseColor 0.15 0.25 0.18 transparency 0.82 shininess 0.7 }
      }
      geometry Box { size ${fmt(world.w + 2)} ${fmt(world.w * 0.22)} ${fmt(world.d + 2)} }
    }
  ]
}`);
  }

  if (layers.terrain) {
    parts.push(`
DEF LAYER_TERRAIN Transform {
  children [
    Shape {
      appearance Appearance {
        material Material { diffuseColor 0.18 0.38 0.16 specularColor 0.2 0.3 0.2 }
      }
      geometry IndexedFaceSet {
        solid FALSE
        creaseAngle 1.2
        coord Coordinate { point [ ${coords.join(", ")} ] }
        coordIndex [ ${faces.join(" ")} ]
      }
    }
  ]
}`);
  }

  if (layers.contours && extra.contourLines) {
    extra.contourLines.forEach((c, i) => {
      parts.push(lineSet(c.segs, c.level < 0 ? "0.1 0.29 0.35" : i % 2 ? "0.24 0.42 0.22" : "0.16 0.29 0.16", `CONTOUR_${i}`));
    });
  }
  if (layers.hachure) parts.push(lineSet(extra.hachureLines, "0.45 0.38 0.28", "HACHURE"));
  if (layers.drain) parts.push(lineSet(extra.drainLines, "0.23 0.55 0.72", "DRAIN"));
  if (layers.outline) parts.push(lineSet(extra.outlineLines, "0.77 0.35 0.09", "OUTLINE"));
  if (layers.roads) parts.push(lineSet(extra.roadLines, "1 0.69 0.13", "ROADS"));

  if (layers.weather && rain.length) {
    parts.push(`
DEF LAYER_WEATHER Transform {
  children [
    Shape {
      appearance Appearance { material Material { emissiveColor 0.45 0.75 0.9 } }
      geometry PointSet { coord Coordinate { point [ ${rain.join(", ")} ] } }
    }
  ]
}`);
  }

  if (layers.nodes && nodeShapes) {
    parts.push(`
DEF LAYER_NODES Transform {
  children [
    ${nodeShapes}
  ]
}`);
  }

  return parts.filter(Boolean).join("\n");
}

export function downloadText(filename, text, mime = "model/vrml") {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = String(filename).replace(/[^A-Za-z0-9._-]/g, "_");
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.error("downloadText failed", err);
    // Fallback: open in new tab
    try {
      const w = window.open();
      if (w) {
        w.document.write(`<pre>${text.slice(0, 50000)}</pre>`);
      }
    } catch {}
  }
}
