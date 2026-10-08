/**
 * INGRESS INTEL 4Dwm — the globe stage.
 *
 * The planet view of a faction network: an equirectually-texture-free wire
 * earth, country outlines from the vendored Natural Earth extract, a graticule,
 * a real day/night terminator, and the geodesic mathematics the link and field
 * layers need (great-circle arcs, spherical triangles). All coordinates are
 * lon/lat in degrees; E6 lives only in the wire reader.
 *
 * Two things this deliberately does NOT do:
 *   · it never projects a fake "network" onto the earth to look live — if there
 *     is no frame, it draws the graticule and says so
 *   · it does not pretend the terminator is a game object. It is here because a
 *     day/night line is the one global overlay every agent actually reads off a
 *     world map, and its absence would make the globe look decorative.
 */

const DEG = Math.PI / 180;

/** lon/lat degrees → a point on a sphere of radius r (y-up, +Y = north pole). */
export function lonLatToVec3(lon, lat, r = 1, target = null) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  if (target) return target.set(x, y, z);
  return [x, y, z];
}

/** Inverse of lonLatToVec3 — used for cursor readouts on the sphere. */
export function vec3ToLonLat(v) {
  const r = Math.hypot(v.x, v.y, v.z) || 1;
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v.y / r))) / DEG;
  let lon = Math.atan2(v.z, -v.x) / DEG - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon, r };
}

/**
 * Unit vector for lon/lat — the math below works in vector space so arcs and
 * triangles stay geodesic instead of "straight on the plate carrée".
 */
export function unitVector(lon, lat) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return [-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
}

export function fromUnit(v) {
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v[1]))) / DEG;
  let lon = Math.atan2(v[2], -v[0]) / DEG - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return [lon, lat];
}

const asLL = (p) => (Array.isArray(p) ? { lon: p[0], lat: p[1] } : p);

/** Points along the great circle from A to B, in lon/lat degrees. */
export function geodesicPath(a0, b0, steps = 48) {
  const a = asLL(a0);
  const b = asLL(b0);
  const A = unitVector(a.lon, a.lat);
  const B = unitVector(b.lon, b.lat);
  const dot = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
  const omega = Math.acos(dot);
  const out = [];
  if (omega < 1e-6) return [{ lon: a.lon, lat: a.lat }, { lon: b.lon, lat: b.lat }];
  const sinO = Math.sin(omega);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k0 = Math.sin((1 - t) * omega) / sinO;
    const k1 = Math.sin(t * omega) / sinO;
    const v = [A[0] * k0 + B[0] * k1, A[1] * k0 + B[1] * k1, A[2] * k0 + B[2] * k1];
    const [lon, lat] = fromUnit(v);
    out.push({ lon, lat });
  }
  return out;
}

/**
 * A spherical triangle, subdivided so it bulges with the planet instead of
 * cutting a chord through it. Barycentric subdivision, each sub-vertex pushed
 * back onto the sphere.
 */
export function sphericalTriangleGeometry(THREE, corners, radius = 1, subdivisions = 5) {
  const V = corners.map((c) => unitVector(c.lon, c.lat));
  const pos = [];
  const push = (w) => {
    const v = [
      V[0][0] * w[0] + V[1][0] * w[1] + V[2][0] * w[2],
      V[0][1] * w[0] + V[1][1] * w[1] + V[2][1] * w[2],
      V[0][2] * w[0] + V[1][2] * w[1] + V[2][2] * w[2],
    ];
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    pos.push((v[0] / n) * radius, (v[1] / n) * radius, (v[2] / n) * radius);
  };
  const n = Math.max(1, subdivisions);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {
      const k = n - i - j;
      const up = [i / n, j / n, k / n];
      const left = [(i + 1) / n, j / n, (k - 1) / n];
      const right = [i / n, (j + 1) / n, k / n];
      push(up); push(left); push(right);
      if (j > 0) {
        const a = [(i + 1) / n, j / n, (k - 1) / n];
        const b = [(i + 1) / n, (j - 1) / n, k / n];
        const c = [i / n, j / n, k / n];
        push(a); push(b); push(c);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------- solar geometry */

const dayOfYear = (date) => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return (date.getTime() - start) / 86400000;
};

/**
 * Subsolar point from the two-term NOAA approximations (accuracy ~0.3° — far
 * finer than anything a 20-unit globe can show).
 */
export function subsolarPoint(date = new Date()) {
  const n = dayOfYear(date);
  const B = (2 * Math.PI * (n - 81)) / 364;
  const decl = 23.45 * Math.sin(DEG * (360 * (284 + n)) / 365);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B) - 0.014615 * Math.cos(2 * B) - 0.040849 * Math.sin(2 * B));
  const utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  let lon = 15 * (12 - utcH) + eqTime / 4;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return { lat: decl, lon };
}

/** The great circle 90° from the subsolar point. */
export function terminatorRing(date, radius = 1, steps = 128) {
  const s = subsolarPoint(date);
  const u = unitVector(s.lon, s.lat);
  // Two tangent vectors spanning the plane perpendicular to u.
  const z = [0, 1, 0];
  let e1 = cross(u, z);
  if (norm(e1) < 1e-6) e1 = cross(u, [1, 0, 0]);
  e1 = scale(e1, 1 / norm(e1));
  const e2 = cross(u, e1);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const v = scale(e1, Math.cos(t));
    v[0] += e2[0] * Math.sin(t); v[1] += e2[1] * Math.sin(t); v[2] += e2[2] * Math.sin(t);
    const [lon, lat] = fromUnit(v);
    pts.push(lonLatToVec3(lon, lat, radius));
  }
  return { points: pts.flat(), subsolar: s, antiSolar: scale(u, -1) };
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

/* ----------------------------------------------------------- the stage */

/**
 * createGlobe({ THREE, radius }) → { root, lonLat, setCountries, setDay,
 * setGraticule, setStars, spin }
 *
 * Everything is a child of `root` so the caller can rotate/zoom the planet as a
 * unit and reuse the same group for picking.
 */
export function createGlobe({ THREE, radius = 20 }) {
  const root = new THREE.Group();
  root.name = "globe";

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.998, 64, 40),
    new THREE.MeshStandardMaterial({ color: 0x070d15, roughness: 0.95, metalness: 0, transparent: true, opacity: 0.92 }),
  );
  root.add(shell);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.02, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x1b3a5c, wireframe: true, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  root.add(glow);

  const nightMat = new THREE.MeshBasicMaterial({ color: 0x01040a, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  let nightCap = null;

  const lonLat = (lon, lat, lift = 0) => lonLatToVec3(lon, lat, radius + lift);

  /* graticule ---------------------------------------------------------- */
  function buildGraticule(step = 15) {
    const pts = [];
    for (let lat = -75; lat <= 75; lat += step) {
      let prev = null;
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = lonLat(lon, lat, 0.02);
        if (prev) pts.push(...prev, ...p);
        prev = p;
      }
    }
    for (let lon = -180; lon < 180; lon += step) {
      let prev = null;
      for (let lat = -85; lat <= 85; lat += 5) {
        const p = lonLat(lon, lat, 0.02);
        if (prev) pts.push(...prev, ...p);
        prev = p;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x2a4459, transparent: true, opacity: 0.4 }));
  }
  const graticule = buildGraticule(15);
  graticule.visible = false;
  root.add(graticule);

  /* countries ---------------------------------------------------------- */
  function buildCountries(geojson, lift = 0.05) {
    const pts = [];
    const polys = [];
    const ringToLine = (ring) => {
      const out = [];
      for (let i = 0; i < ring.length; i++) {
        const [lon, lat] = ring[i];
        const p = lonLat(lon, lat, lift);
        out.push(...p);
        if (i + 1 < ring.length) out.push(...lonLat(ring[i + 1][0], ring[i + 1][1], lift));
      }
      return out;
    };
    for (const f of geojson.features || []) {
      const g = f.geometry;
      if (!g) continue;
      const rings = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      for (const poly of rings) {
        for (const ring of poly) pts.push(...ringToLine(ring));
        const outer = poly[0];
        if (outer && outer.length > 3) polys.push(outer);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x6d8ba3, transparent: true, opacity: 0.72 }));
    lines.name = "countries";
    return { lines, polys };
  }

  let countryPolys = [];
  function setCountries(geojson) {
    const { lines, polys } = buildCountries(geojson);
    const old = root.getObjectByName("countries");
    if (old) { root.remove(old); old.geometry.dispose(); old.material.dispose(); }
    root.add(lines);
    countryPolys = polys;
    return lines;
  }

  /* day/night ---------------------------------------------------------- */
  function setDay(date = new Date()) {
    const { points, antiSolar } = terminatorRing(date, radius * 1.004, 128);
    const pos = [];
    const pole = [antiSolar[0] * radius * 1.004, antiSolar[1] * radius * 1.004, antiSolar[2] * radius * 1.004];
    for (let i = 0; i < points.length / 3 - 1; i++) {
      pos.push(...pole);
      pos.push(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
      pos.push(points[(i + 1) * 3], points[(i + 1) * 3 + 1], points[(i + 1) * 3 + 2]);
    }
    if (!nightCap) {
      nightCap = new THREE.Mesh(new THREE.BufferGeometry(), nightMat);
      nightCap.name = "night";
      root.add(nightCap);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    nightCap.geometry.dispose();
    nightCap.geometry = g;
    return subsolarPoint(date);
  }

  /* point-in-country, for the HUD's "over land / over ocean" readout --- */
  function isLand(lon, lat) {
    for (const ring of countryPolys) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }

  return {
    root,
    radius,
    lonLat,
    setCountries,
    setDay,
    isLand,
    setGraticule: (on) => { graticule.visible = !!on; },
    shell,
    glow,
    geodesicPath,
    triangle: (corners, opts) => sphericalTriangleGeometry(THREE, corners, radius * (opts?.lift ?? 1.001), opts?.sub ?? 6),
  };
}

/** Star field, so the globe is not floating in a flat colour. */
export function buildStars(THREE, count = 900, radius = 320) {
  const pos = new Float32Array(count * 3);
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const t = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    pos[i * 3] = radius * r * Math.cos(t);
    pos[i * 3 + 1] = radius * u;
    pos[i * 3 + 2] = radius * r * Math.sin(t);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fc4e8, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.75 }));
}

/**
 * Subdivide a lon/lat triangle and lift each vertex through `project(lon, lat)`.
 *
 * Shared by both stages on purpose: the globe pushes the vertices back onto the
 * sphere, the basin plate samples the relief field. Same tessellation, different
 * project — which is why a field reads the same way in both views.
 */
export function subdivideTriangle(corners, n = 6, project = (lon, lat) => [lon, lat, 0]) {
  const [a, b, c] = corners;
  const A = [a.lon, a.lat];
  const B = [b.lon, b.lat];
  const C = [c.lon, c.lat];
  const at = (u, v, w) => {
    const lon = A[0] * u + B[0] * v + C[0] * w;
    const lat = A[1] * u + B[1] * v + C[1] * w;
    return project(lon, lat);
  };
  const out = [];
  const steps = Math.max(1, n | 0);
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j + i <= steps; j++) {
      const k = steps - i - j;
      const p0 = at(i / steps, j / steps, k / steps);
      const p1 = at((i + 1) / steps, j / steps, (k - 1) / steps);
      const p2 = at(i / steps, (j + 1) / steps, k / steps);
      out.push(...p0, ...p1, ...p2);
      if (j > 0) {
        const q0 = at((i + 1) / steps, j / steps, (k - 1) / steps);
        const q1 = at((i + 1) / steps, (j - 1) / steps, k / steps);
        const q2 = at(i / steps, j / steps, k / steps);
        out.push(...q0, ...q1, ...q2);
      }
    }
  }
  return out;
}
