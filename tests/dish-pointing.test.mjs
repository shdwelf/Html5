// S5: GEO dish-pointing calculator — known-answer look angles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { geoLookAngles, geoVisibleArc } from "../js/dish-pointing.js";

test("satellite directly overhead: elevation 90, range is GEO altitude", () => {
  const r = geoLookAngles({ lat: 0, lon: -75 }, -75);
  assert.equal(r.elevationDeg, 90);
  assert.equal(Math.round(r.rangeKm), 35793); // 42164.17 - 6371
  assert.equal(r.visible, true);
  assert.match(r.model, /spherical-earth/);
});

test("Los Angeles to GOES-West (137.2W): southwest, high elevation", () => {
  const r = geoLookAngles({ lat: 34.05, lon: -118.24 }, -137.2);
  assert.ok(Math.abs(r.azimuthDeg - 211.5) < 0.5, `az ${r.azimuthDeg}`);
  assert.ok(Math.abs(r.elevationDeg - 45.5) < 0.5, `el ${r.elevationDeg}`);
  assert.ok(r.rangeKm > 37000 && r.rangeKm < 38000);
});

test("satellite on the far side of the Earth is not visible", () => {
  const r = geoLookAngles({ lat: 0, lon: 0 }, 180);
  assert.equal(r.visible, false);
  assert.ok(r.elevationDeg < 0);
});

test("visible arc is symmetric on the equator and narrows with latitude", () => {
  const eq = geoVisibleArc({ lat: 0, lon: 0 }, 10);
  assert.equal(eq.westOffsetDeg, -eq.eastOffsetDeg);
  assert.ok(Math.abs(eq.eastOffsetDeg - 71.25) < 0.5);
  const north = geoVisibleArc({ lat: 65, lon: 0 }, 0);
  assert.ok(north.eastOffsetDeg < 81.3, "high latitude sees less of the arc");
});

test("bad input throws instead of returning NaN angles", () => {
  assert.throws(() => geoLookAngles({ lat: 91, lon: 0 }, 0), RangeError);
  assert.throws(() => geoLookAngles({ lat: 0 }, 0), TypeError);
  assert.throws(() => geoLookAngles({ lat: 0, lon: 0 }, NaN), TypeError);
});
