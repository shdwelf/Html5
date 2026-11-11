# Investigation & Architectural Triage: Offline Viewer, 3D VRML Pipeline, DEM Stitching, and Cryptographic Hardware Backlog

**Date:** 2026-11-11<br>
**Branch:** `arena/1c7359a3-html5`<br>
**Base Commit:** `926d0453717934ee4fdaf4b480cc1fb9501f686a`<br>

---

## 1. HTML5 Offline Viewer & Internal Storage (`internal-storage.7z`)

### 1.1 Curated vs. Exhaustive Offline Packaging
In PR #191 / #192, the offline viewer (`offline-viewer.html`, `scripts/build-private-html5-offline-viewer.py`, `apps/html5-offline-launcher`) was intentionally designed with an allowlisted privacy-first model:
- The base `offline-viewer.html` bundles the repository's standalone offline astronomy and mathematics engines (`helios-observatory` and `prime-viewer`) with zero external network calls.
- The user's query references `internal-storage.7z` from `shdwelf/Html5-sync-incoming`, noting that only 2 of the apps (`helios-observatory` and `prime-viewer`) are visible in the curated list while 93 offline apps exist across `public/apps/`.
- **Resolution Path**:
  - The local XDC player (`xdc-viewer.html`) is embedded directly into the offline viewer via `fflate` and WebXDC runtime shims, allowing any `.xdc` package (including `keyspace.xdc`, `sanborn-suite.xdc`, `red-october-command-viewer.xdc`, and `wikiinajar.xdc`) to be loaded and run in memory without network access.
  - To support the full offline suite, `offline-viewer.html` is upgraded with an expanded catalog profile including `keyspace`, `wikiinajar`, `kryptos-vrml`, `planet-viewer`, `sanborn-codex`, and `red-october-command-viewer`.

---

## 2. Keyspace Viewer Integration

### 2.1 Artifact State
- `keyspace.html` and `keyspace.xdc` exist at repository root and are packaged via `tools/pack_keyspace.sh`.
- The Keyspace Viewer implements an interactive 2D/3D entropy visualizer, BIP-39 mnemonic spacefill curves, and elliptic curve topology (`secp256k1` / `ed25519`).
- **Integration**:
  - Stage `public/apps/keyspace/` with `index.html`, `manifest.toml`, `icon.png`, and `webxdc.js` so it automatically participates in the offline launcher catalog and tests.

---

## 3. Planet Viewer DEM Stitching & Zooming Engine

### 3.1 Problem Diagnosis
- In `public/apps/planet-viewer/index.html` and `js/planet-viewer-4dwm.js`:
  - When switching between plates (`chey`, `ange`, `lawrence`), the camera resets framing (`frame()`).
  - The Lawrence plate carries an 8×8 sparse control grid (`js/city-dem-grid-lawrence.js`), which previously displayed only city gazetteer labels without smooth multi-plate bilinear stitching and continuous zoom.
- **Resolution**:
  - Integrate multi-scale control point blending across adjacent bounding boxes.
  - Add explicit scroll wheel and touch-pinch sensitivity tuning in `OrbitControls` to prevent camera clipping at fine zoom levels (`camera.minDistance = 0.5`, `camera.maxDistance = 2500`).

---

## 4. VRML Engine Comparison: Sanborn Codex vs. Kryptos VRML vs. Red October

### 4.1 Shader and Rendering Pipeline Discrepancies
- **VRML Button & Camera Perspective**:
  - In `public/apps/kryptos-vrml/` and `apps/kryptos_vrml.html`, the VRML engine utilizes standard perspective projection matrices (`M4.perspective`) with wireframe and texture layers.
  - In `public/apps/sanborn-codex/index.html`, four shader modes are exposed:
    1. `patina` (Copper / physical material)
    2. `wireframe` (VRML Grid)
    3. `projector` (Live / Light - including crackling lightning bolt effects)
    4. `blueprint` (Stylized cyan architectural schematic)
  - **The Issue**: In the Sanborn VRML engine, while camera perspective switching functions cleanly, the `projector` ("Live / Light") and `blueprint` shaders suffer from lighting attenuation and material roughness clipping under Three.js WebGL rendering contexts when certain HDR gainmap assets fail to load offline.
- **Fix**:
  - Ensure local shader fallback uniforms (`#38bdf8` blueprint ambient and direct point light sources for live lightning) render reliably offline without external gainmap requests.

---

## 5. OnlyKey & Cryptographic Backlog Status
- The OnlyKey hardware authentication ops (`onlyKeyChallengeRes`, `onlyKeyDeriveSsh`, `onlyKeyBackupAuth`) are verified against RFC 2104 / RFC 2202 in CyberChef and the cryptographic cookbook.
- Microphone permissions and ANC Web Audio inputs were resolved in commit `0dcd8a6`.

---

## 6. Verification Plan
- Run offline launcher regression suite: `node --test tests/html5-offline-launcher.test.mjs`.
- Run offline viewer suite: `node --test tests/offline-viewer.test.mjs`.
- Run Red October suite: `node --test tests/red-october.test.mjs tests/red-october-command-viewer.test.mjs`.
- Run Sanborn suite: `node --test tests/sanborn-codex-lighting.test.mjs tests/sanborn-codex-renderer.test.mjs tests/sanborn-suite.test.mjs`.
