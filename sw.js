/* SITE-K HTML5 app cache.
   The 2.6 MB ghidra_decompiler.wasm is intentionally *not* precached: the
   service worker caches it on first use, so the lab still works offline after
   one visit without slowing down install for everyone else. */
const CACHE = "sitek-html5-v14";
const PRECACHE = [
  "./",
  "./index.html",
  "./adl.html",
  "./keyspace.html",
  "./validator.html",
  "./ghidra-lab.html",
  "./art-studio.html",
  "./poetry-book.html",
  "./louisiana.html",
  "./terrarium.html",
  "./manifest.webmanifest",
  "./webxdc.js",
  "./icon.png",
  "./css/app.css",
  "./css/adl.css",
  "./css/jp-grid.css",
  "./css/terrarium.css",
  "./css/viewer.css",
  "./css/validator.css",
  "./css/viruslab.css",
  "./css/studio.css",
  "./css/poetry-book.css",
  "./css/wm.css",
  "./js/app.js",
  "./js/adl-studio.js",
  "./js/adl-map.js",
  "./js/adl-data.js",
  "./src/gazbean/gazbean.js",
  "./js/wm.js",
  "./js/jp-grid.js",
  "./js/terrarium.js",
  "./js/site-id.js",
  "./js/wx-live.js",
  "./js/terraink.js",
  "./js/vrml-export.js",
  "./js/vrml-pack.js",
  "./js/la-geo.js",
  "./js/stx-geo.js",
  "./js/ca-geo.js",
  "./js/sanctuaries.js",
  "./js/stx-nodes.js",
  "./js/ca-nodes.js",
  "./js/br-plot.js",
  "./js/stx-plot.js",
  "./js/ca-plot.js",
  "./js/viewer.js",
  "./js/validator.js",
  "./js/viruslab.js",
  "./js/virus-catalog.js",
  "./js/x86dis.js",
  "./js/ghidra-wasm.js",
  "./js/studio.js",
  "./js/studio-data.js",
  "./js/studio-fs.js",
  "./js/studio-wm.js",
  "./js/haiku-catalog.js",
  "./js/bip39.js",
  "./js/bip39-en.js",
  "./vendor/three.module.min.js",
  "./vendor/OrbitControls.js",
  "./wasm/entropy.wasm",
  "./wasm/ghidra/ghidra_decompiler.js",
  "./wasm/ghidra/processors.json",
  "./wasm/ghidra/Processors/x86/data/languages/x86.sla",
  "./wasm/ghidra/Processors/x86/data/languages/x86-16-real.pspec",
  "./wasm/ghidra/Processors/x86/data/languages/x86-16.cspec",
  "./samples/bin/michelangelo.bin",
  "./samples/bin/malmsey-habitat-13.bin",
  "./samples/bin/zippy.bin",
  "./img/site-x-badge.png",
  "./img/site-l-badge.png",
  "./img/ingen-stripe.jpg",
  "./img/app-192.png",
  "./img/app-512.png",
  "./img/apple-touch.png",
  "./driverguide.html",
  "./css/driverguide.css",
  "./js/driverguide.js",
  "./js/regparse.js",
  "./js/dll-catalog.js",
  "./js/driver-catalog.js",
  "./js/pe-version.js",
  "./vendor/fflate/index.mjs",
];

async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (res && res.ok) await cache.put(url, res);
      } catch {
        /* skip missing / blocked */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit || caches.match("./index.html"));
      return hit || net;
    })
  );
});
