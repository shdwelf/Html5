import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSTELLATIONS,
  EARTH_RADIUS_KM,
  LAUNCH_WINDOWS,
  countAtYear,
  horizonHalfAngleDeg,
  modelDisclaimer,
  oneWayLightTimeMs,
  orbitalPeriodMinutes,
  orbitalSpeedKmS,
  periodFromSmaMinutes,
  shellGeometry,
  visibleProxyCount,
} from '../js/satellite-constellations-data.js';

test('constellation data has sources, shells, and conservative caveats', () => {
  assert.match(modelDisclaimer.toLowerCase(), /not live ephemeris/);
  assert.ok(EARTH_RADIUS_KM > 6300 && EARTH_RADIUS_KM < 6400);
  assert.deepEqual(CONSTELLATIONS.map(c => c.id), ['gps','glonass','galileo','beidou','iridium','oneweb','starlink','jpss','gto','molniya']);
  for (const c of CONSTELLATIONS) {
    assert.ok(c.sources.length >= 1, `${c.id} has at least one source`);
    assert.ok(c.facts.length >= 3, `${c.id} has interpretive facts`);
    assert.ok(c.milestones.length >= 3, `${c.id} has timeline milestones`);
    assert.ok(c.currentSatellites > 0, `${c.id} has current/design count`);
    for (const s of c.shells) {
      assert.ok(s.altitudeKm > 100 && s.altitudeKm <= 35786, `${c.id}/${s.id} altitude is plausible`);
      assert.ok(s.inclinationDeg >= 0 && s.inclinationDeg <= 120, `${c.id}/${s.id} inclination is plausible`);
      assert.ok(Number.isInteger(s.planes) && s.planes >= 1, `${c.id}/${s.id} has planes`);
      assert.ok(Number.isInteger(s.renderSatellites) && s.renderSatellites >= 1, `${c.id}/${s.id} has render proxies`);
    }
  }
});

test('orbital math matches known shell scales', () => {
  assert.ok(Math.abs(orbitalPeriodMinutes(550) - 95.5) < 1.5, 'Starlink-like LEO period');
  assert.ok(Math.abs(orbitalPeriodMinutes(780) - 100.4) < 1.5, 'Iridium-like LEO period');
  assert.ok(Math.abs(orbitalPeriodMinutes(20200) - 718) < 8, 'GPS-like MEO period');
  assert.ok(Math.abs(orbitalPeriodMinutes(35786) - 1436) < 20, 'GEO period');
  assert.ok(orbitalSpeedKmS(550) > orbitalSpeedKmS(20200));
  assert.ok(oneWayLightTimeMs(35786) > oneWayLightTimeMs(550));
  assert.ok(horizonHalfAngleDeg(1200) > horizonHalfAngleDeg(550));
});

test('timeline counts grow without exposing impossible proxies', () => {
  const starlink = CONSTELLATIONS.find(c => c.id === 'starlink');
  const oneweb = CONSTELLATIONS.find(c => c.id === 'oneweb');
  const gps = CONSTELLATIONS.find(c => c.id === 'gps');
  assert.equal(countAtYear(starlink, 2017), 0);
  assert.ok(countAtYear(starlink, 2026) >= 6750);
  assert.equal(countAtYear(oneweb, 2018), 0);
  assert.equal(countAtYear(gps, 1977), 0);
  assert.ok(countAtYear(gps, 1995) >= 24);
  for (const c of CONSTELLATIONS) for (const shell of c.shells) {
    const n = visibleProxyCount(c, shell, 2026);
    assert.ok(n >= 0 && n <= shell.renderSatellites, `${c.id}/${shell.id} visible proxy bound`);
  }
});

test('large constellations are downsampled and GNSS is not', () => {
  const starlink = CONSTELLATIONS.find(c => c.id === 'starlink').shells[0];
  const oneweb = CONSTELLATIONS.find(c => c.id === 'oneweb').shells[0];
  const gps = CONSTELLATIONS.find(c => c.id === 'gps').shells[0];
  assert.ok(starlink.renderSatellites < starlink.satellites, 'Starlink is represented by proxies');
  assert.ok(oneweb.renderSatellites < oneweb.satellites, 'OneWeb is represented by proxies');
  assert.equal(gps.renderSatellites, gps.satellites, 'GPS nominal slots are all drawn');
});

test('transfer layer carries honest elliptical geometry', () => {
  const gto = CONSTELLATIONS.find(c => c.id === 'gto');
  const mol = CONSTELLATIONS.find(c => c.id === 'molniya');
  assert.equal(gto.layer, 'transfer');
  assert.equal(mol.layer, 'transfer');

  const gtoGeom = shellGeometry(gto.shells[0]);
  assert.ok(gtoGeom.elliptical);
  assert.equal(gto.shells[0].apogeeKm, 35786, 'GTO apogee kisses GEO altitude');
  assert.ok(gtoGeom.e > 0.7 && gtoGeom.e < 0.75, `GTO eccentricity plausible (${gtoGeom.e})`);
  // GTO period is ~10.5 h
  const gtoPeriodH = periodFromSmaMinutes(gtoGeom.a) / 60;
  assert.ok(Math.abs(gtoPeriodH - 10.5) < 0.4, `GTO period ~10.5 h (${gtoPeriodH.toFixed(2)})`);

  const molGeom = shellGeometry(mol.shells[0]);
  assert.equal(mol.shells[0].inclinationDeg, 63.4, 'Molniya critical inclination');
  const molPeriodH = periodFromSmaMinutes(molGeom.a) / 60;
  assert.ok(Math.abs(molPeriodH - 11.97) < 0.25, `Molniya semi-synchronous ~12 h (${molPeriodH.toFixed(2)})`);
  // Both are labeled as illustrative orbit classes, not fleets
  assert.match(gto.name.toLowerCase(), /illustrative/);
  assert.match(mol.name.toLowerCase(), /illustrative/);

  // Circular shells report e = 0 through the same helper
  const gps = CONSTELLATIONS.find(c => c.id === 'gps');
  const gpsGeom = shellGeometry(gps.shells[0]);
  assert.equal(gpsGeom.e, 0);
  assert.ok(!gpsGeom.elliptical);
});

test('launch window research is typed, dated, and sourced', () => {
  assert.match(LAUNCH_WINDOWS.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(LAUNCH_WINDOWS.types.length >= 5, 'window taxonomy covers the mission classes');
  const targets = LAUNCH_WINDOWS.types.map(t => t.target.toLowerCase()).join(' ');
  for (const needle of ['iss', 'sun-synchronous', 'geo', 'mars']) {
    assert.ok(targets.includes(needle), `window taxonomy covers ${needle}`);
  }
  for (const t of LAUNCH_WINDOWS.types) {
    assert.ok(t.window && t.driver, `${t.id} explains its window and driver`);
  }
  assert.ok(LAUNCH_WINDOWS.opportunities.length >= 4);
  for (const op of LAUNCH_WINDOWS.opportunities) {
    assert.ok(op.label && op.status && op.note, `${op.id} is fully described`);
    assert.ok((op.sources || []).length >= 1, `${op.id} is sourced`);
    for (const [, url] of op.sources) assert.match(url, /^https:\/\//, `${op.id} source is https`);
  }
  const mars = LAUNCH_WINDOWS.opportunities.find(o => o.id === 'mars-2026');
  assert.match(mars.label, /Nov/);
});
