# ViteReact → Inlined HTML5/Webxdc/PWA Suite v15.0

> **Register:** src-47 · **Original:** https://bashupload.app/jg2zgi.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

"**Zero Document-Tag Gold Standard**" — converts a Vite `dist/` or React `src/` ZIP into a
single inlined `.html`, a Delta Chat `.xdc` webxdc app, or an offline PWA (`sw.js`).

## What it does

- **Dual-engine JSX compiler:** Sucrase WASM (ES2020) + Babel Standalone (ES6), with a
  comparator verifying the JSX tree and the DOM mount ("MATCH 100%") before output ships
- **webxdc multiplayer simulator dock:** `window.webxdc` polyfill, transcript JSON export,
  peer-message simulation
- **manifest.toml settings:** valid Delta Chat spec — app name, icon, summary
- **Theme overrides:** Slate Navy (#0f172a) · Deep Cyber Black (#090d16) · Clean Light
- **Asset handling:** base64 inlining of SVG/fonts/images, asset URL auto-resolve,
  bitmap resize >1200px, whitespace trim
- **Archive file explorer** with live editor
- **Bundle size analytics**
- Sample project: `sample-vite-react-dist.zip`, 2.8 KB

*(The same pipeline this book lab uses for its own inlined edition and .xdc package.
Successor to src-48; later build of the v6.3 quine edition.)*
