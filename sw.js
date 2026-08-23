/* SITE-K HTML5 app cache */
const CACHE = "sitek-html5-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./keyspace.html",
  "./louisiana.html",
  "./terrarium.html",
  "./manifest.webmanifest",
  "./webxdc.js",
  "./icon.png",
  "./css/app.css",
  "./css/jp-grid.css",
  "./css/terrarium.css",
  "./css/viewer.css",
  "./js/app.js",
  "./js/jp-grid.js",
  "./js/terrarium.js",
  "./js/site-id.js",
  "./js/wx-live.js",
  "./js/terraink.js",
  "./js/vrml-export.js",
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
  "./js/bip39.js",
  "./js/bip39-en.js",
  "./vendor/three.module.min.js",
  "./vendor/OrbitControls.js",
  "./wasm/entropy.wasm",
  "./img/site-x-badge.png",
  "./img/site-l-badge.png",
  "./img/ingen-stripe.jpg",
  "./img/app-192.png",
  "./img/app-512.png",
  "./img/apple-touch.png",
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
            caches.open(CACHE).then((c) => c.put("./index.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"))
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
