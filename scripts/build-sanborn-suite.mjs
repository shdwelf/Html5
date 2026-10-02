#!/usr/bin/env node
/**
 * build-sanborn-suite.mjs — fuse the two Jim Sanborn apps into ONE webxdc app.
 *
 *   node scripts/build-sanborn-suite.mjs
 *
 * Inputs (canonical, packaged builds):
 *   public/apps/sanborn-codex/index.html   ~1.6 MB React/three.js codex, 30 installations
 *   public/apps/kryptos-vrml/index.html    ~80 KB raw-WebGL viewer, 11 source-checked site entries
 *
 * Output:
 *   public/apps/sanborn-suite/index.html   one self-contained file, both apps inlined
 *   public/apps/sanborn-suite/manifest.toml, webxdc.js, icon.png
 *
 * tools/pack_sanborn_suite_xdc.sh distributes the result under both the
 * established sanborn-suite.xdc name and sanborn-installations.xdc, whose name
 * makes the complete installation coverage explicit.
 *
 * Why inline-and-mount rather than concatenate
 * --------------------------------------------
 * Both apps are whole documents: each ships its own <head>, its own CSS reset,
 * its own global names (SCULPTURES, SHEETS, KEY, a React runtime, a raw-WebGL
 * runtime) and its own document-level key handlers. Concatenating them into one
 * document would collide on all four counts. Instead each app is carried as a
 * base64 payload inside the single output file and written into its own
 * same-origin child document on first use. Nothing is fetched: no network, no
 * extra files, one HTML file — which is what a webxdc container wants anyway.
 *
 * Base64 rather than a raw <script type="text/html"> payload is deliberate: the
 * bundles contain both `</script>` and the escaped form `<\/script>`, so any
 * textual escaping scheme is ambiguous in one direction. Base64 is not.
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "public/apps/sanborn-suite");

const APPS = [
  {
    id: "codex",
    label: "CODEX",
    title: "Sanborn Codex",
    blurb: "30 catalogued installations · React + three.js galleries · Kryptos Cipher Lab · 26×26 tableau · zen-garden skins",
    src: "public/apps/sanborn-codex/index.html",
  },
  {
    id: "vrml",
    label: "VRML VIEWER",
    title: "Kryptos VRML",
    blurb: "11 source-checked site entries · raw-WebGL scenes with custom GLSL · cipher simulator · minimap · verification panels",
    src: "public/apps/kryptos-vrml/index.html",
  },
];

/** Strip the child's own webxdc <script src>, then inject the suite bridge. */
function prepare(html, app) {
  let out = html.replace(/\s*<script\s+src=["']\.\/webxdc\.js["']\s*><\/script>/gi, "");
  if (out === html && /webxdc\.js/i.test(html)) {
    throw new Error(`${app.id}: found a webxdc.js reference that the stripper did not match`);
  }
  const bridge = `
<script>/* sanborn-suite bridge — injected at build time */
(function () {
  try { if (!window.webxdc && window.parent && window.parent !== window) window.webxdc = window.parent.webxdc; } catch (e) {}
  window.addEventListener("keydown", function (e) {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== "1" && e.key !== "2" && e.key !== "3") return;
    try { window.parent.postMessage({ sanbornSuite: "nav", key: e.key }, "*"); } catch (err) {}
  }, true);
  try {
    document.addEventListener("DOMContentLoaded", function () {
      window.parent.postMessage({ sanbornSuite: "ready", app: ${JSON.stringify(app.id)} }, "*");
    });
  } catch (e) {}
})();
</script>`;
  const head = out.match(/<head[^>]*>/i);
  if (!head) throw new Error(`${app.id}: no <head> to inject into`);
  const at = out.indexOf(head[0]) + head[0].length;
  return out.slice(0, at) + bridge + out.slice(at);
}

function b64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

const payloads = APPS.map((app) => {
  const abs = path.join(root, app.src);
  const html = readFileSync(abs, "utf8");
  const prepared = prepare(html, app);
  return { ...app, bytes: Buffer.byteLength(prepared, "utf8"), data: b64(prepared) };
});

const built = new Date().toISOString().slice(0, 10);

const shell = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>Sanborn Suite — Codex &amp; Kryptos VRML</title>
<script src="./webxdc.js"></script>
<style>
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --gold:#c9a84c; --copper:#b87333; --copper-lt:#d4956a; --verdigris:#6baa7b;
    --bg:#070a12; --panel:rgba(10,14,23,0.96); --line:rgba(201,168,76,0.18);
    --mono:'Courier New',Consolas,ui-monospace,monospace; --display:Georgia,'Times New Roman',serif;
  }
  html, body { height:100%; background:var(--bg); color:#e0d8c0; font-family:var(--mono); overflow:hidden; }
  #suite { display:flex; flex-direction:column; height:100vh; height:100dvh; }
  header {
    display:flex; align-items:center; gap:14px; flex-wrap:wrap;
    padding:8px 14px; background:var(--panel); border-bottom:1px solid var(--line); z-index:5;
  }
  .brand { font-family:var(--display); font-size:1em; letter-spacing:0.18em; color:var(--gold); white-space:nowrap; }
  .brand small { display:block; font-family:var(--mono); font-size:0.52em; letter-spacing:0.14em; color:var(--verdigris); }
  nav { display:flex; gap:6px; margin-left:auto; flex-wrap:wrap; }
  nav button {
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.09); color:#9a9384;
    font-family:var(--mono); font-size:0.68em; letter-spacing:0.12em; padding:6px 13px;
    border-radius:3px; cursor:pointer; transition:all 0.18s;
  }
  nav button:hover { border-color:rgba(201,168,76,0.45); color:var(--gold); }
  nav button[aria-current="true"] { background:rgba(201,168,76,0.12); border-color:var(--gold); color:var(--gold); }
  nav button:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
  #stage { position:relative; flex:1; min-height:0; }
  .view { position:absolute; inset:0; display:none; }
  .view.active { display:block; }
  iframe { width:100%; height:100%; border:0; display:block; background:var(--bg); }
  #boot { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; pointer-events:none; }
  #boot.gone { display:none; }
  #boot .t { font-family:var(--display); font-size:1.6em; color:var(--gold); letter-spacing:0.2em; }
  #boot .s { font-size:0.66em; letter-spacing:0.16em; color:var(--verdigris); }
  #about { overflow-y:auto; padding:26px 20px 60px; }
  .wrap { max-width:820px; margin:0 auto; }
  #about h2 { font-family:var(--display); color:var(--gold); font-size:1.25em; letter-spacing:0.12em; margin-bottom:6px; }
  #about h3 { font-size:0.72em; letter-spacing:0.18em; color:var(--verdigris); margin:22px 0 8px; text-transform:uppercase; }
  #about p, #about li { font-size:0.76em; line-height:1.8; color:#b8b0a0; }
  #about ul { padding-left:18px; margin:6px 0; }
  #about a { color:var(--copper-lt); }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:12px; margin-top:12px; }
  .card { background:rgba(201,168,76,0.05); border:1px solid rgba(201,168,76,0.14); border-radius:6px; padding:14px; }
  .card h4 { font-size:0.8em; color:var(--gold); letter-spacing:0.1em; margin-bottom:6px; }
  .card p { font-size:0.7em; }
  .card button {
    margin-top:10px; background:rgba(201,168,76,0.12); border:1px solid rgba(201,168,76,0.3); color:var(--gold);
    font-family:var(--mono); font-size:0.66em; letter-spacing:0.1em; padding:6px 14px; border-radius:3px; cursor:pointer;
  }
  .card button:hover { background:rgba(201,168,76,0.22); }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:0.7em; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.06); color:#b8b0a0; vertical-align:top; }
  th { color:var(--gold); letter-spacing:0.1em; font-weight:normal; }
  .fine { font-size:0.66em; color:#7d7768; line-height:1.8; margin-top:18px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; }
  kbd { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:3px; padding:1px 5px; font-size:0.9em; color:var(--gold); }
  @media (max-width:640px) { .brand small { display:none; } nav button { padding:6px 9px; } }
</style>
</head>
<body>
<div id="suite">
  <header>
    <div class="brand">SANBORN SUITE<small>CODEX &amp; KRYPTOS VRML &mdash; ONE CONTAINER</small></div>
    <nav aria-label="Applications">
      <button id="nav-codex" data-view="codex" aria-current="false" title="Sanborn Codex (Alt+1)">CODEX</button>
      <button id="nav-vrml" data-view="vrml" aria-current="false" title="Kryptos VRML viewer (Alt+2)">VRML VIEWER</button>
      <button id="nav-about" data-view="about" aria-current="true" title="About and source check (Alt+3)">SOURCE CHECK</button>
    </nav>
  </header>

  <main id="stage">
    <div class="view" id="view-codex"></div>
    <div class="view" id="view-vrml"></div>
    <div class="view active" id="view-about">
      <div id="about"><div class="wrap">
        <h2>Two apps, one container</h2>
        <p>
          This is the Jim Sanborn work in this workshop, fused into a single webxdc app. Both programs are
          carried whole inside this one file &mdash; nothing is fetched, nothing is served, and there is no
          second app to install. Pick one above, or use <kbd>Alt</kbd>+<kbd>1</kbd>,
          <kbd>Alt</kbd>+<kbd>2</kbd>, <kbd>Alt</kbd>+<kbd>3</kbd> from anywhere, including from inside
          either app.
        </p>
        <p>
          <b>Coverage:</b> the Codex carries its complete 30-installation catalogue and the VRML viewer
          carries all 11 of its source-checked sculpture/site entries. They remain separate catalogues on
          purpose: some entries overlap and the viewer also preserves contextual locations. This suite carries
          both complete source applications rather than dropping one list to make a misleading combined count.
        </p>
        <div class="cards">
          ${payloads.map((p) => `<div class="card">
            <h4>${p.title}</h4>
            <p>${p.blurb}</p>
            <button data-view="${p.id}">Open ${p.label} &rarr;</button>
          </div>`).join("\n          ")}
        </div>

        <h3>Why they are mounted, not merged</h3>
        <p>
          Each app is a complete document with its own CSS reset, its own global names and its own
          document-level key handlers &mdash; one is a React and three.js bundle, the other a dependency-free
          raw-WebGL renderer. Pasting them into one document would collide on every one of those. So each is
          stored here as a base64 payload and written into its own same-origin child document the first time
          you open it. Same file, same offline guarantee, no interference; state and WebGL contexts survive
          switching because a mounted app is hidden, never torn down.
        </p>

        <h3>What was source-checked</h3>
        <p>
          The viewer's installation data was checked against published sources on 28 September 2026. Every
          entry now carries a <em>verified</em> line and a source list, shown in its
          <b>SOURCES &amp; VERIFICATION</b> panel. Two errors were corrected:
        </p>
        <table>
          <tr><th>Entry</th><th>Was</th><th>Now</th></tr>
          <tr>
            <td>Lingua</td>
            <td>&ldquo;Washington D.C. Convention Center&rdquo;; &ldquo;Ethiopian&rdquo;</td>
            <td>Walter E. Washington Convention Center &mdash; installed 2002, building opened 2003, renamed 2007; script named as Ethiopic (Ge&rsquo;ez)</td>
          </tr>
          <tr>
            <td>Cyrillic Projector</td>
            <td>&ldquo;Private collection / exhibitions, 2002&rdquo;</td>
            <td>University of North Carolina at Charlotte &mdash; made early 1990s, installed 1997</td>
          </tr>
        </table>
        <p style="margin-top:10px">
          Interpretation is now labelled as interpretation on the entrance Morse slabs, the Berlin Wall
          segments, Atomic Time and the cryptologic-museum context entry. The K4 panel states the
          post-auction position: the archive sold for $962,500 on 20 November 2025 and the Smithsonian papers
          are sealed until 2075, but <b>the cipher system that produced K4 has still not been broken</b> &mdash;
          finding plaintext in an archive is not a cryptanalytic solve.
        </p>

        <h3>Build</h3>
        <ul>
          <li>Built ${built} by <code>scripts/build-sanborn-suite.mjs</code> from the two packaged apps.</li>
          ${payloads.map((p) => `<li>${p.title}: ${(p.bytes / 1024).toFixed(0)} KB of HTML inlined as ${(p.data.length / 1024).toFixed(0)} KB of base64.</li>`).join("\n          ")}
          <li>Each child receives the host's <code>window.webxdc</code>, so the container keeps one identity.</li>
        </ul>
        <p class="fine">
          Jim Sanborn's sculptures are his work; this is a research and teaching model of them, not a
          reproduction, and no ciphertext here should be read as an authorised solution. K4's plaintext is not
          published in these apps, and the reconstruction shown beside it is labelled as community
          reconstruction rather than confirmed text.
        </p>
      </div></div>
    </div>
    <div id="boot" class="gone"><div class="t">MOUNTING</div><div class="s" id="boot-label"></div></div>
  </main>
</div>

${payloads.map((p) => `<script type="application/x-sanborn-payload" id="payload-${p.id}">${p.data}</script>`).join("\n")}

<script>
(function () {
  "use strict";
  var VIEWS = ["codex", "vrml", "about"];
  var KEYMAP = { "1": "codex", "2": "vrml", "3": "about" };
  var mounted = Object.create(null);
  var boot = document.getElementById("boot");
  var bootLabel = document.getElementById("boot-label");

  function decode(id) {
    var node = document.getElementById("payload-" + id);
    if (!node) throw new Error("payload missing: " + id);
    var bin = atob(node.textContent.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function mount(id) {
    if (mounted[id]) return;
    mounted[id] = true;
    var host = document.getElementById("view-" + id);
    var frame = document.createElement("iframe");
    frame.title = id === "codex" ? "Sanborn Codex" : "Kryptos VRML viewer";
    frame.setAttribute("allow", "xr-spatial-tracking; fullscreen");
    host.appendChild(frame);
    var html;
    try {
      html = decode(id);
    } catch (e) {
      host.innerHTML = '<div style="padding:24px;font-size:0.8em;color:#fca5a5">Could not decode the ' +
        id + ' payload: ' + (e && e.message) + '</div>';
      return;
    }
    var doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    } else {
      frame.srcdoc = html; /* fallback path */
    }
  }

  function show(id) {
    if (VIEWS.indexOf(id) === -1) id = "about";
    if (id !== "about") {
      bootLabel.textContent = id === "codex" ? "SANBORN CODEX" : "KRYPTOS VRML";
      if (!mounted[id]) {
        boot.classList.remove("gone");
        setTimeout(function () { mount(id); setTimeout(function () { boot.classList.add("gone"); }, 400); }, 20);
      }
    }
    VIEWS.forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("active", v === id);
      var b = document.getElementById("nav-" + v);
      if (b) b.setAttribute("aria-current", v === id ? "true" : "false");
    });
    try { localStorage.setItem("sanborn-suite-view", id); } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-view]");
    if (t) { e.preventDefault(); show(t.getAttribute("data-view")); }
  });

  window.addEventListener("keydown", function (e) {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    var v = KEYMAP[e.key];
    if (v) { e.preventDefault(); show(v); }
  });

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.sanbornSuite !== "nav") return;
    var v = KEYMAP[d.key];
    if (v) show(v);
  });

  var start = "about";
  try {
    var saved = localStorage.getItem("sanborn-suite-view");
    if (saved && VIEWS.indexOf(saved) !== -1) start = saved;
  } catch (e) {}
  show(start);
})();
</script>
</body>
</html>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, "index.html"), shell, "utf8");

writeFileSync(
  path.join(OUT_DIR, "manifest.toml"),
  'name = "Sanborn Installations — Complete Suite"\norientation = "landscape"\nsource_code_url = "https://github.com/shdwelf/Html5"\n',
  "utf8",
);
copyFileSync(path.join(root, "public/apps/kryptos-vrml/webxdc.js"), path.join(OUT_DIR, "webxdc.js"));
copyFileSync(path.join(root, "public/apps/kryptos-vrml/icon.png"), path.join(OUT_DIR, "icon.png"));

const size = statSync(path.join(OUT_DIR, "index.html")).size;
console.log("wrote public/apps/sanborn-suite/index.html (" + size.toLocaleString() + " bytes)");
for (const p of payloads) {
  console.log("  inlined " + p.title.padEnd(14) + p.bytes.toLocaleString().padStart(10) + " B  ->  " +
    p.data.length.toLocaleString().padStart(10) + " B base64");
}
