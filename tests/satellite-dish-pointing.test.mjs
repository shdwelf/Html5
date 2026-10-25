import test from 'node:test';
import assert from 'node:assert/strict';
import { DISH_SITES, DISH_SLOTS, dishModelNote, EARTH_RADIUS_KM, MU_EARTH_KM3_S2 } from '../js/satellite-constellations-data.js';
import { EARTH_ROTATION_RAD_S, geoOrbitRadiusKm, geostationaryLookAngles } from '../js/satellite-dish-pointing.js';

const DEG = Math.PI / 180;

// Independent ECEF → ENU vector derivation, used only here as a cross-check
// of the spherical closed form in js/satellite-dish-pointing.js.
function lookAnglesVector(latDeg, lonDeg, satLonDeg, R, r) {
  const f = latDeg * DEG, l = lonDeg * DEG, sl = satLonDeg * DEG;
  const obs = [R * Math.cos(f) * Math.cos(l), R * Math.cos(f) * Math.sin(l), R * Math.sin(f)];
  const sat = [r * Math.cos(sl), r * Math.sin(sl), 0];
  const v = [sat[0] - obs[0], sat[1] - obs[1], sat[2] - obs[2]];
  const e = -Math.sin(l) * v[0] + Math.cos(l) * v[1];
  const n = -Math.sin(f) * Math.cos(l) * v[0] - Math.sin(f) * Math.sin(l) * v[1] + Math.cos(f) * v[2];
  const u = Math.cos(f) * Math.cos(l) * v[0] + Math.cos(f) * Math.sin(l) * v[1] + Math.sin(f) * v[2];
  const range = Math.hypot(v[0], v[1], v[2]);
  return {
    azimuthDeg: (Math.atan2(e, n) / DEG + 360) % 360,
    elevationDeg: Math.asin(u / range) / DEG,
    rangeKm: range,
    horiz: Math.hypot(e, n),
  };
}

test('worked example: 52°N 0° → 66°E reproduces az 109.33°, el 5.85°', () => {
  const r = geostationaryLookAngles({ siteLatDeg: 52, siteLonDeg: 0, satLonDeg: 66 });
  // Published in the SPU lecture (spu.edu.sy) worked example; that example uses
  // R = 6378 km vs this viewer's 6371 km sphere, so allow 0.05° of slack.
  assert.ok(Math.abs(r.azimuthDeg - 109.33) < 0.05, `az ${r.azimuthDeg}`);
  assert.ok(Math.abs(r.elevationDeg - 5.85) < 0.05, `el ${r.elevationDeg}`);
  assert.ok(Math.abs(r.centralAngleDeg - 75.5) < 0.2, `gamma ${r.centralAngleDeg}`);
  assert.equal(r.aboveHorizon, true);
});

test('elevation agrees with the classic closed form to 1e-9 deg over a grid', () => {
  const r0 = geoOrbitRadiusKm();
  const k = EARTH_RADIUS_KM / r0;
  for (const lat of [-60, -20, 0, 18.4655, 39.7392, 52, 70]) {
    for (const lon of [-120, -0.1278, 40]) {
      for (const sat of [-137, -75.2, -0.0, 66, 120]) {
        const dLon = ((sat - lon + 180) % 360 + 360) % 360 - 180;
        const cg = Math.cos(lat * DEG) * Math.cos(dLon * DEG);
        const classic = Math.atan((cg - k) / Math.sqrt(1 - cg * cg)) / DEG;
        const r = geostationaryLookAngles({ siteLatDeg: lat, siteLonDeg: lon, satLonDeg: sat });
        if (Math.abs(r.elevationDeg) < 89.9) {
          assert.ok(Math.abs(r.elevationDeg - classic) < 1e-9, `lat ${lat} lon ${lon} sat ${sat}: ${r.elevationDeg} vs ${classic}`);
        }
      }
    }
  }
});

test('spherical form matches the independent ECEF→ENU vector derivation', () => {
  const r0 = geoOrbitRadiusKm();
  for (const lat of [-60, -20, 0, 25.7617, 47.6062, 52, 70]) {
    for (const lon of [-122.3321, 0, 40]) {
      for (const sat of [-137, -75.2, 66, 120]) {
        const a = geostationaryLookAngles({ siteLatDeg: lat, siteLonDeg: lon, satLonDeg: sat });
        const b = lookAnglesVector(lat, lon, sat, EARTH_RADIUS_KM, r0);
        assert.ok(Math.abs(a.elevationDeg - b.elevationDeg) < 1e-6, `el lat ${lat} lon ${lon} sat ${sat}`);
        assert.ok(Math.abs(a.rangeKm - b.rangeKm) < 1e-4, `range lat ${lat} lon ${lon} sat ${sat}`);
        if (b.horiz > 1e-3) {
          let d = Math.abs(a.azimuthDeg - b.azimuthDeg);
          if (d > 180) d = 360 - d;
          assert.ok(d < 1e-6, `az lat ${lat} lon ${lon} sat ${sat}: ${a.azimuthDeg} vs ${b.azimuthDeg}`);
        }
      }
    }
  }
});

test('quadrant sanity: equator east/west, meridians north/south', () => {
  const eqE = geostationaryLookAngles({ siteLatDeg: 0, siteLonDeg: -120, satLonDeg: -75.2 });
  assert.ok(Math.abs(eqE.azimuthDeg - 90) < 1e-9);
  const eqW = geostationaryLookAngles({ siteLatDeg: 0, siteLonDeg: -120, satLonDeg: -170 });
  assert.ok(Math.abs(eqW.azimuthDeg - 270) < 1e-9);
  const nhS = geostationaryLookAngles({ siteLatDeg: 52, siteLonDeg: 10, satLonDeg: 10 });
  assert.ok(Math.abs(nhS.azimuthDeg - 180) < 1e-9);
  const shN = geostationaryLookAngles({ siteLatDeg: -40, siteLonDeg: 10, satLonDeg: 10 });
  assert.ok(Math.abs(shN.azimuthDeg) < 1e-9);
});

test('sub-satellite point: elevation 90, azimuth null, range = r − R', () => {
  const r0 = geoOrbitRadiusKm();
  const r = geostationaryLookAngles({ siteLatDeg: 0, siteLonDeg: 66, satLonDeg: 66 });
  assert.equal(r.azimuthDeg, null);
  assert.equal(r.elevationDeg, 90);
  assert.ok(Math.abs(r.rangeKm - (r0 - EARTH_RADIUS_KM)) < 0.01);
});

test('horizon limit sits at the ~81.3° GEO arc; far slots fall below it', () => {
  const near = geostationaryLookAngles({ siteLatDeg: 52, siteLonDeg: 0, satLonDeg: 66 });
  assert.ok(Math.abs(near.horizonCentralAngleDeg - 81.3) < 0.1, String(near.horizonCentralAngleDeg));
  assert.ok(near.horizonCentralAngleDeg > 81.2 && near.horizonCentralAngleDeg < 81.4);
  const far = geostationaryLookAngles({ siteLatDeg: 52, siteLonDeg: 0, satLonDeg: -114 });
  assert.equal(far.aboveHorizon, false);
  assert.ok(far.elevationDeg < 0);
  assert.ok(far.centralAngleDeg > near.horizonCentralAngleDeg);
});

test('GEO radius derived from μ/ω_E lands at ≈42164 km', () => {
  const r0 = geoOrbitRadiusKm();
  assert.ok(r0 > 42160 && r0 < 42168, String(r0));
  assert.ok(EARTH_ROTATION_RAD_S > 7.29e-5 && EARTH_ROTATION_RAD_S < 7.30e-5);
  assert.ok(MU_EARTH_KM3_S2 > 398000 && MU_EARTH_KM3_S2 < 399000);
});

test('presets are well-formed and every site×slot combination resolves', () => {
  assert.ok(DISH_SITES.length >= 4);
  assert.ok(DISH_SLOTS.length >= 3);
  for (const s of DISH_SITES) {
    assert.ok(s.id && s.name && s.note, `site ${s.id || '?'}`);
    assert.ok(Number.isFinite(s.lat) && s.lat >= -90 && s.lat <= 90, `site lat ${s.id}`);
    assert.ok(Number.isFinite(s.lon) && s.lon >= -180 && s.lon <= 180, `site lon ${s.id}`);
  }
  for (const s of DISH_SLOTS) {
    assert.ok(s.id && s.name && s.note, `slot ${s.id || '?'}`);
    assert.ok(Number.isFinite(s.lon) && s.lon >= -180 && s.lon <= 180, `slot lon ${s.id}`);
    assert.ok(Array.isArray(s.sources) && s.sources.length >= 1, `slot ${s.id} sources`);
    for (const u of s.sources) assert.match(u, /^https:\/\//);
  }
  for (const site of DISH_SITES) {
    for (const slot of DISH_SLOTS) {
      const r = geostationaryLookAngles({ siteLatDeg: site.lat, siteLonDeg: site.lon, satLonDeg: slot.lon });
      assert.ok(Number.isFinite(r.elevationDeg), `${site.id}/${slot.id} el`);
      assert.ok(Number.isFinite(r.rangeKm) && r.rangeKm > 0, `${site.id}/${slot.id} range`);
      if (r.azimuthDeg !== null) {
        assert.ok(r.azimuthDeg >= 0 && r.azimuthDeg < 360, `${site.id}/${slot.id} az ${r.azimuthDeg}`);
      }
      assert.ok(r.elevationDeg > -90 && r.elevationDeg <= 90, `${site.id}/${slot.id} el bounds`);
    }
  }
});

test('model note carries the sphere constants, drift warning, and no-meter caveat', () => {
  assert.match(dishModelNote, /6371/);
  assert.match(dishModelNote, /42164/);
  assert.match(dishModelNote, /2026-10-25/);
  assert.match(dishModelNote, /not a substitute for a meter at the dish/);
});

test('invalid inputs throw explicit errors', () => {
  assert.throws(() => geostationaryLookAngles({ siteLatDeg: NaN, siteLonDeg: 0, satLonDeg: 0 }), /finite/);
  assert.throws(() => geostationaryLookAngles({ siteLatDeg: 91, siteLonDeg: 0, satLonDeg: 0 }), /out of/);
});
