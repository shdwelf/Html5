import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sites, toVRML, modelDisclaimer } from '../js/venue-sites-data.js';

test('six researched venues carry citations and explicit schematic limits', () => {
  assert.deepEqual(sites.map(s => s.id), ['lvcc', 'sands-expo', 'anaheim-cc', 'javits', 'delano-tower', 'walter-e-washington']);
  for (const s of sites) {
    assert.ok(s.sources.length >= 3, s.id + ' needs at least three sources');
    for (const [name, url] of s.sources) { assert.ok(name); assert.match(url, /^https:\/\//); }
    assert.ok(s.interpretation && s.context && s.summary);
    assert.ok(s.landmarks.length >= 3);
    assert.ok(s.objects.length > 5);
    for (const o of s.objects) {
      assert.ok(o.size.every(v => Number.isFinite(v) && v > 0));
      assert.ok(o.position.every(Number.isFinite));
      assert.ok(o.rotation.every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...o.rotation.slice(0, 3)) - 1) < 1e-8);
    }
  }
  assert.match(modelDisclaimer, /Not a survey/);
  assert.match(modelDisclaimer, /navigation aid/);
});

test('checked-in VRML exactly matches the shared Three.js geometry', () => {
  for (const s of sites) {
    const text = toVRML(s);
    assert.equal(readFileSync(new URL('../models/venues/' + s.id + '.wrl', import.meta.url), 'utf8'), text);
    assert.ok(text.startsWith('#VRML V2.0 utf8\n'));
    assert.equal((text.match(/geometry Box/g) || []).length, s.objects.length);
    assert.match(text, /Not a survey/);
    assert.match(text, /https:\/\//);
    assert.equal((text.match(/{/g) || []).length, (text.match(/}/g) || []).length);
    assert.equal((text.match(/\[/g) || []).length, (text.match(/\]/g) || []).length);
  }
});

test('the two Las Vegas threads stay separately dated', () => {
  const sands = sites.find(s => s.id === 'sands-expo');
  // The AVN-below-CES arrangement ended in January 2011.
  assert.match(sands.context, /2011 or earlier/);
  assert.match(sands.context, /Sands Expo/);
  const tower = sites.find(s => s.id === 'delano-tower');
  // Black Hat arrived at Mandalay Bay in 2014; Skyfall opened October 2015.
  assert.match(tower.summary, /since 2014/);
  assert.match(tower.summary, /October 2015/);
  assert.match(tower.context, /2016 or later/);
});

test('sourced measurements are labelled as sourced, and the rest as invented', () => {
  const sands = sites.find(s => s.id === 'sands-expo');
  assert.ok(sands.objects.some(o => /13 ft 5 in/.test(o.name)));
  assert.ok(sands.objects.some(o => /32 ft 5 in/.test(o.name)));
  assert.match(sands.interpretation, /invented/);

  const tower = sites.find(s => s.id === 'delano-tower');
  assert.ok(tower.objects.some(o => /64th-floor lounge band/.test(o.name)));
  assert.match(tower.interpretation, /not a measured elevation/);

  const lingua = sites.find(s => s.id === 'walter-e-washington');
  assert.equal(lingua.objects.filter(o => /Lingua — bronze cylinder/.test(o.name)).length, 2);
  for (const cyl of lingua.objects.filter(o => /Lingua — bronze cylinder/.test(o.name))) {
    assert.ok(Math.abs(cyl.size[1] - 4.88) < 1e-9, '16 ft ≈ 4.88 model units');
  }
  assert.match(lingua.interpretation, /boxed/);
});

test('no venue model claims attendance or navigational use', () => {
  for (const s of sites) {
    const blob = [s.summary, s.context, s.interpretation, ...s.landmarks.flat()].join(' ');
    assert.doesNotMatch(blob, /\bGreeran\b/);
    assert.doesNotMatch(blob, /\bhe attended\b/i);
  }
});
