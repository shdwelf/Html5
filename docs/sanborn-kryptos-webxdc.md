# Sanborn Codex & Kryptos VRML — Analysis, webxdc research, and UX/UI fixes

This note records what the two Jim-Sanborn companion apps are, what the `.xdc`
(webxdc) packaging looks like today, the issues found while researching both,
and the UX/UI fixes applied in this session.

## 1. Files

| Path | Role |
| --- | --- |
| `public/apps/sanborn-codex/index.html` | Sanborn Codex app (canonical, packaged) |
| `public/apps/sanborn-codex/manifest.toml` | webxdc manifest |
| `public/apps/sanborn-codex/webxdc.js` | browser-side webxdc shim |
| `public/apps/sanborn-codex/icon.png` | 256×256 app icon |
| `sanborn-codex.html` | byte-identical root copy (source of truth for `tools/pack_sanborn_xdc.sh`) |
| `public/apps/kryptos-vrml/index.html` | Kryptos VRML app (canonical, packaged) |
| `public/apps/kryptos-vrml/manifest.toml` / `webxdc.js` / `icon.png` | webxdc manifest / shim / icon |
| `sanborn-codex.xdc`, `kryptos-vrml.xdc` | built webxdc containers |
| `tools/pack_sanborn_xdc.sh`, `tools/pack_kryptos_xdc.sh` | shell packers |
| `scripts/build-xdc.mjs` | Node/fflate packer (packages the same two apps) |
| `test/sanborn-codex.test.ts` | regression guard |

## 2. What the apps are

**Sanborn Codex** (`≈1.6 MB`) — a single-file React 19 bundle (react-three-fiber +
drei + Tailwind) presenting **30 installations** by Jim Sanborn. Each exhibit has
an `id`, `title`, `year`, `location`, `medium`, `dimensions`, `materials`, an
`accent` color, and per-exhibit hotspot sub-models (e.g. *S-Curved Copper Screen*,
*Plutonium Pit Assembly*, *Accelerator Column*). The page also ships a **Kryptos
Cipher Lab** (keyed-Vigenère over Sanborn's `KRYPTOS…` alphabet), the physical
**26×26 tableau**, and a "save this portal as one offline HTML file" control. At
the tail of the bundle three helper scripts are injected for offline use: a
troika/unicode-font-resolver fetch shim, a CSS "zen garden" skin switcher, and a
boot watchdog that explains a failure instead of leaving a blank page.

**Kryptos VRML** (`≈65 KB`) — a dependency-free, raw-WebGL app (no three.js). It
renders **11 sculptures/sites** (Kryptos, entrance Morse slabs, Berlin Wall,
Cyrillic Projector, Coastline, Indian Run, Antipodes, Lingua, Atomic Time, the
National Cryptologic Museum, and Find the Lodestone) with custom GLSL shaders,
orbit/zoom/pan controls, a 2D cipher overlay, a minimap, an info panel with
per-sculpture research, and an interactive cipher simulator (Vigenère / columnar
transposition / Caesar / Playfair). All data (K1–K5, the 2025 Smithsonian
archives breakthrough, Elonka Dunin's research) is embedded.

## 3. webxdc (`.xdc`) research findings

Per the [webxdc container spec](https://webxdc.org/docs/spec/format.html), an
`.xdc` is a ZIP using Deflate/Store compression that **MUST** contain
`index.html` at the root, and **MAY** contain a `manifest.toml` and an
`icon.png`/`icon.jpg` (a square, usually 128–512 px, without baked-in borders or
corner shapes).

Findings for these two apps:

1. **Both containers are structurally valid.** Each `.xdc` root holds
   `index.html`, `manifest.toml`, `icon.png` (256×256), and `webxdc.js`.
2. **Manifest drift between the two build paths.** `tools/pack_sanborn_xdc.sh`
   generated its own `manifest.toml` with `source_code_url`, while
   `scripts/build-xdc.mjs` packaged `public/apps/*/manifest.toml` as-is — and
   those source manifests omitted `source_code_url` (the kryptos one entirely).
   The two packers could therefore emit different manifests for the same app.
   **Fixed:** both source manifests now declare `name`, `orientation =
   "landscape"`, and `source_code_url`, and both `.xdc` files were rebuilt from
   the reconciled sources.
3. **Offline constraint honoured.** Neither app fetches remote assets at
   runtime. The sanborn bundle keeps a stray drei HDRI *preset* string but never
   fetches it (offline build); troika font loading is satisfied by the injected
   fetch shim; the only external URL in kryptos is a content link
   (`elonka.com/kryptos/`), which is fine offline.
4. **`apps/kryptos_vrml.html` is a divergent standalone copy.** It differs from
   the canonical `public/apps/kryptos-vrml/index.html` only by the missing
   `<script src="./webxdc.js">` line, but that duplication is a maintenance
   hazard. `public/apps/…` is the canonical, packaged source.
5. `min_api` / `permissions` are intentionally unused (not required by the
   spec; the apps use no privileged webxdc APIs beyond the shim).

## 4. UX/UI fixes applied

### Kryptos VRML
- **Info panel no longer idles on "Loading…".** Initialisation called
  `createScene('kryptos')` only, so every description/encryption/plaintext
  section kept its placeholder until a tab was clicked. It now calls
  `selectSculpture('kryptos')`, which fills the whole panel (including the K4
  2025 card and clue list) immediately.
- **"CIPHER / K4 / RESEARCH" buttons no longer close the panel.** They used
  `togglePanel()`, so clicking one while the panel was open collapsed it and
  scrolled an off-screen list. A new `setPanel/openPanel` pair + `wasOpen`
  timing guarantee the panel is open before `scrollIntoView` runs.
- **Broken WebXR entry replaced.** `enterVR()` requested an `immersive-vr`
  session that never presented frames (a black screen). The button now only
  appears where VR is supported and shows an honest toast instead of entering a
  broken session.
- **Button state reflects reality on load.** INFO is marked active
  (`panelOpen=true`) with `aria-expanded`; auto-rotate is marked active
  (`autoRotate=true`) with `aria-pressed`.
- **Accessibility & discoverability.** `aria-label`/`title` on HUD buttons, a
  `role="status"` toast, and a keyboard-hint line on the loading screen
  (`I` info, `R` rotate, `1–9` sculptures, `0` reset).

### Sanborn Codex (zen-garden skin switcher)
- The skin switcher is now a `role="toolbar"` with `aria-label`s, an
  `aria-live` sheet name, `type="button"`, and `←`/`→` arrow-key navigation
  (with an `isComposing` guard), plus a `max-width` clamp so it never overflows
  narrow viewports.

## 5. Regression guard

`test/sanborn-codex.test.ts` was extended to assert: manifest `name` /
`orientation` / `source_code_url` for both apps, a square 256×256 PNG icon
(within the spec's band), and the kryptos info-panel fix markers
(`selectSculpture('kryptos')`, `function openPanel()`, `wasOpen`, `id="toast"`).

## 6. Open items for further research

- Implement real WebXR present (render loop + `WebXRManager`) in Kryptos VRML if
  headset support is wanted; today it gracefully declines.
- Deduplicate `apps/kryptos_vrml.html` (and the various `apps/sanborn-codex…`
  copies) against `public/apps/…`.
- Make shell-packaged `.xdc` builds byte-reproducible (the Node packer already
  pins a fixed mtime; `zip` does not).
- Consider `min_api` once the apps rely on newer webxdc APIs.
