import assert from "node:assert/strict";
import test from "node:test";
import {
  BODIES,
  J2000,
  METEOR_STREAMS,
  bodyById,
  daysSinceJ2000,
  orbitPath,
  orbitalPosition,
  solveKepler,
} from "../public/apps/helios-observatory/js/astronomy.js";
import {
  factorize,
  isPrime,
  sieve,
  ulamCoordinate,
} from "../public/apps/prime-viewer/js/primes.js";

test("Helios catalog IDs, parent links, and model outputs are well-formed", () => {
  const ids = new Set(BODIES.map((body) => body.id));
  assert.equal(ids.size, BODIES.length);
  assert.ok(BODIES.length >= 25);
  assert.ok(METEOR_STREAMS.length >= 5);
  for (const body of BODIES) {
    assert.ok(Number.isFinite(body.a) && body.a > 0, `${body.id} has a semimajor axis`);
    assert.ok(Number.isFinite(body.e) && body.e >= 0 && body.e < 1, `${body.id} has a bounded elliptic eccentricity`);
    assert.ok(Number.isFinite(body.period) && body.period > 0, `${body.id} has a positive period`);
    if (body.parent) assert.ok(ids.has(body.parent), `${body.id} parent is catalogued`);
    const position = orbitalPosition(body, 1234);
    for (const coordinate of [position.x, position.y, position.z, position.r, position.E]) assert.ok(Number.isFinite(coordinate));
    assert.ok(position.r > 0);
  }
  assert.equal(bodyById("earth")?.name, "Earth");
  assert.equal(bodyById("missing"), null);
  assert.equal(daysSinceJ2000(new Date(J2000)), 0);
});

test("Kepler solver and orbit paths remain finite and periodic", () => {
  for (const eccentricity of [0, 0.2, 0.8, 0.967, 0.999]) {
    for (const meanAnomaly of [-11, -Math.PI, 0, 1.2, Math.PI, 19]) {
      const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);
      assert.ok(Number.isFinite(eccentricAnomaly));
      const normalized = ((meanAnomaly % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const residual = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - normalized;
      assert.ok(Math.abs(residual) < 1e-8, `Kepler residual e=${eccentricity}, M=${meanAnomaly}: ${residual}`);
    }
  }
  const path = orbitPath(bodyById("earth"), 180);
  assert.equal(path.length, 181);
  assert.ok(Math.hypot(path[0].x - path.at(-1).x, path[0].y - path.at(-1).y, path[0].z - path.at(-1).z) < 1e-10);
});

test("Prime Viewer math has exact counts, factorizations, and unique Ulam coordinates", () => {
  const { primes } = sieve(100);
  assert.equal(primes.length, 25);
  assert.equal(primes.at(-1), 97);
  assert.equal(isPrime(999983), true);
  assert.equal(isPrime(999981), false);
  assert.deepEqual(factorize(360), [[2, 3], [3, 2], [5, 1]]);
  assert.deepEqual(factorize(1), []);
  const coordinates = Array.from({ length: 100 }, (_, index) => ulamCoordinate(index + 1).join(","));
  assert.equal(new Set(coordinates).size, coordinates.length);
  assert.deepEqual(ulamCoordinate(1), [0, 0]);
});
