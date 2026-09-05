/* SITE-K HTML5 app cache */
const CACHE = "sitek-html5-v17";
const PRECACHE = [
  "./",
  "./index.html",
  "./keyspace.html",
  "./cylinder-sync.html",
  "./config/cylinder-z3950.json",
  "./validator.html",
  "./art-studio.html",
  "./haiku.html",
  "./louisiana.html",
  "./terrarium.html",
  "./godseye.html",
  "./manifest.webmanifest",
  "./webxdc.js",
  "./icon.png",
  "./img/godseye-icon.png",
  "./css/app.css",
  "./css/cylinder-sync.css",
  "./css/godseye.css",
  "./js/godseye.js",
  "./css/jp-grid.css",
  "./css/terrarium.css",
  "./css/viewer.css",
  "./css/validator.css",
  "./css/studio.css",
  "./css/haiku.css",
  "./css/wm.css",
  "./js/app.js",
  "./js/cylinder-sync.js",
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
  "./js/studio.js",
  "./js/studio-data.js",
  "./js/studio-fs.js",
  "./js/studio-wm.js",
  "./js/haiku-workbench.js",
  "./js/enso-id.js",
  "./js/syllables.js",
  "./js/haiku-catalog.js",
  "./js/bip39.js",
  "./js/bip39-en.js",
  "./js/formal.js",
  "./js/lens-draw.js",
  "./js/lens-3d.js",
  "./vendor/three.module.min.js",
  "./vendor/OrbitControls.js",
  "./vendor/world/countries.geo.json",
  "./vendor/satellite/index.js",
  "./vendor/satellite/constants.js",
  "./vendor/satellite/dopplerFactor.js",
  "./vendor/satellite/ext.js",
  "./vendor/satellite/io.js",
  "./vendor/satellite/propagation.js",
  "./vendor/satellite/transforms.js",
  "./vendor/satellite/propagation/dpper.js",
  "./vendor/satellite/propagation/dscom.js",
  "./vendor/satellite/propagation/dsinit.js",
  "./vendor/satellite/propagation/dspace.js",
  "./vendor/satellite/propagation/gstime.js",
  "./vendor/satellite/propagation/initl.js",
  "./vendor/satellite/propagation/propagate.js",
  "./vendor/satellite/propagation/sgp4.js",
  "./vendor/satellite/propagation/sgp4init.js",
  "./wasm/entropy.wasm",
  "./img/site-x-badge.png",
  "./img/cylinder-tops.jpg",
  "./img/site-l-badge.png",
  "./img/ingen-stripe.jpg",
  "./img/app-192.png",
  "./img/app-512.png",
  "./img/apple-touch.png",
  "./img/haiku-icon.png",
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
