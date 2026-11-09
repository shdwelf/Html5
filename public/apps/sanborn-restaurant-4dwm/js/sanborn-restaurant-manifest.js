// Parser for the Sanborn Restaurant Study's XDC comment manifest. The .wrl
// companion is valid, sparse VRML97; the richer Three.js scene is described
// by lines such as `# XDC_BOX ...`, not by a full VRML97 parser.

function number(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseSanbornManifest(text) {
  const rows = [];
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("# XDC_")) continue;
    const parts = line.split(/\s+/);
    const marker = parts[1] ?? "";
    const kind = marker.startsWith("XDC_") ? marker.slice(4) : marker;

    if (kind === "BOX" && parts.length >= 13) {
      rows.push({
        kind,
        id: parts[2],
        pos: [number(parts[3]), number(parts[4]), number(parts[5])],
        size: [number(parts[6]), number(parts[7]), number(parts[8])],
        color: parts[9], layer: parts[10], group: parts[11], label: parts.slice(12).join(" "),
      });
    } else if ((kind === "CYL" || kind === "CYLINDER") && parts.length >= 12) {
      rows.push({
        kind: "CYL",
        id: parts[2],
        pos: [number(parts[3]), number(parts[4]), number(parts[5])],
        radius: number(parts[6]), height: number(parts[7]),
        color: parts[8], layer: parts[9], group: parts[10], label: parts.slice(11).join(" "),
      });
    } else if (kind === "LINE" && parts.length >= 12) {
      rows.push({
        kind,
        id: parts[2],
        a: [number(parts[3]), number(parts[4]), number(parts[5])],
        b: [number(parts[6]), number(parts[7]), number(parts[8])],
        color: parts[9], layer: parts[10], label: parts.slice(11).join(" "),
      });
    } else if (kind === "LABEL" && parts.length >= 10) {
      rows.push({
        kind,
        id: parts[2],
        pos: [number(parts[3]), number(parts[4]), number(parts[5])],
        size: number(parts[6]), color: parts[7], layer: parts[8], label: parts.slice(9).join(" "),
      });
    } else if (kind === "POINTLIGHT" && parts.length >= 11) {
      rows.push({
        kind,
        id: parts[2],
        pos: [number(parts[3]), number(parts[4]), number(parts[5])],
        color: parts[6], intensity: number(parts[7]), distance: number(parts[8]),
        layer: parts[9], label: parts.slice(10).join(" "),
      });
    }
  }
  return rows;
}

export function lightIntensity(light, enabled) {
  if (!enabled) return 0;
  const intensity = Number(light?.intensity);
  return Number.isFinite(intensity) && intensity > 0 ? intensity : 0;
}
