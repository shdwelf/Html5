import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { vrmlToScene } from "../js/ghs-viewer-three.js";

const SAMPLE = `#VRML V2.0 utf8
Shape {
  appearance Appearance { material Material { diffuseColor 0.75 0.35 0.1 } }
  geometry Box { size 80 20 80 }
}
Transform {
  translation 25 0 0
  children [ Shape {
    appearance Appearance { material Material { diffuseColor 0.1 0.65 0.85 } }
    geometry Sphere { radius 20 }
  } ]
}
`;

test("the shared renderer turns VRML primitives into a drawable scene without changing source geometry", () => {
  const result = vrmlToScene(SAMPLE);
  assert.equal(result.meshes, 2);
  assert.equal(result.stats.shapes, 2);
  assert.ok(result.triangles > 100);
  assert.equal(result.scene.background.getHexString(), "0a1410");
  let meshes = 0;
  let triangles = 0;
  result.scene.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
    assert.ok(object.material.color);
  });
  assert.equal(meshes, 2);
  assert.ok(triangles >= result.triangles);
});

test("the shared viewer exposes its renderer-side blueprint, lighting, and camera controls", () => {
  const source = readFileSync(new URL("../js/ghs-viewer-three.js", import.meta.url), "utf8");
  for (const marker of [
    "dataset.vrmlMode",
    "BLUEPRINT",
    "LIVE LIGHT",
    "AUTO ROTATE",
    "GridHelper",
    "setMode",
    "cameraDistance",
  ]) assert.ok(source.includes(marker), `shared VRML renderer is missing ${marker}`);
});
