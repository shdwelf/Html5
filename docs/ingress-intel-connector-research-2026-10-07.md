# Ingress Intel connector research — 2026-10-07

Notes behind `ingress-intel.html`. Every claim is tiered: **official** (Niantic's
own surface), **community** (IITC-CE, which reverse-engineers and maintains the
client against Niantic's live deployment), **context** (general platform facts).
Where a number is a community reconstruction rather than a published spec, it says
so — that distinction is the reason the viewer has a ladder and a watermark instead
of a spinner.

## TL;DR of the connection question

1. **There is no public or third-party Intel API.** The intel map's data endpoint is
   `/r/getEntities`, same-origin, POST, JSON body, `X-CSRFToken` from the page's
   `csrftoken` cookie, plus a 40-hex per-deployment version token. Community tier,
   confirmed against IITC-CE `core/code/send_request.js`.
2. **A standalone page cannot call it.** Two independent walls: same-origin policy
   on the credentialed POST, and the CSRF token the page will not have. A public CORS
   proxy can only turn a `GET` into a `GET`, so it cannot bridge either wall.
3. **What a proxy *can* do** is fetch public permalink pages and static assets
   (`portal.ingress.com` imagery), which is why the `proxy` rung exists and is
   documented as capture-oriented rather than live.
4. **The only honest "live" rung is one the user runs**: same-origin hosting, or a
   relay holding its own session. The app therefore ships a *contract* rather than a
   claim, and prints why each rung failed.
5. Niantic is not going to fix this: **Peridot was sunset in April 2026 while
   "Ingress remains active"** — Niantic Spatial kept Ingress after the Scopely
   separation — and there is no developer surface for intel data. Official tier
   (Niantic's own sunset FAQ), context tier for what it implies.

## Sources read

Fetched through `api.github.com/repos/ingress-intel/toolkit-ios/contents/...`-style
raw reads and a `codeload` tarball, because `raw.githubusercontent.com` is blocked
from this sandbox (`curl: (35) SSL_ERROR_SYSCALL`).

| File | What it settled |
| --- | --- |
| IITC-CE `core/code/send_request.js` | POST `/r/<action>`, body `{...data, v: CURRENT_VERSION}`, `X-CSRFToken` from the `csrftoken` cookie, and the `'out of date'` error path that forces a reload when the version token rotates |
| `core/code/map_request.js` | `{tileKeys:[…]}` → `getEntities`; `MOVE_REFRESH` 0.4 s, `MAX_REQUESTS`, `TILES_PER_REQUEST`, per-tile state machine incl. `render-queue`, requeue on timeout and on `error:RETRY`, `pushRenderQueue` copying `deletedGameEntityGuids` + `gameEntities` |
| `core/code/entity_decode.js` | `parseResonator = {owner, level, energy}`, `parseMod = {owner, name, rarity, stats}`, `teamStringToId` accepting codename *or* letter, the letter-prefixed array forms, and the legacy object form |
| `core/code/map_tiles.js` | `TILES_PER_EDGE`, `ZOOM_TO_LEVEL`, `ZOOM_TO_LINK_LENGTH` defaults and the `z_x_y_level_8_100` key construction |
| `core/code/map_renderer.js` | Style defaults (`LINK {opacity:1, weight:2}`, `FIELD {fillOpacity:.25}`) and the habit of drawing the world-copy nearest the view anchor |
| `core/code/utils.js` | `geodesicPolyline` / `geodesicPolygon` behaviour, i.e. links are great circles |
| `core/code/extract_niantic_parameters.js` | How the version token is harvested: regex `"X-CSRFToken".*[a-z].v="([a-f0-9]{40})";` over the deployed intel page — the reason a relay that *can* read that page should forward live parameters instead of a stale constant |
| `core/code/json_examples/get_thinned_entities-{request,response}.js` | Real request/response shapes. Only the first three request keys matter (tile keys like `"1_32742_21790"`, the method name, the 40-hex version); the 2013 response's keyed entity objects must also decode |
| `core/code/json_examples/get_portal_details-response.js` | `{resonatorArray:{resonators:[{slot, level, energyTotal, distanceToPortal, id, ownerGuid}]}, locationE6, controllingTeam:{team}, portalV2:{linkedEdges:[{otherPortalGuid, length}]}}` — and `length` is **metres** (`plugins/linked-portals-show.js` divides by 1000 to print km) |

Legacy and adjacent surfaces, checked for anything a viewer could legitimately use:

- **RED / third-party era API** (`apis.ingress.com/?cmd=getMap&latE6=&lngE6=&zoom=&rpp=`):
  dead; the host does not resolve from here and the endpoint belongs to the 2013–2014
  third-party API era, which Niantic closed. Context tier.
- **Ingress Prime permalinks**: `intel.ingress.com/intel?ll=lat,lng&z=17`, `&pll=` for
  a highlighted portal, `&pguid=` for a portal record. Public, unauthenticated, and
  the reason `parseIntelPermalink` exists: an agent can always hand the viewer a
  link, and the viewer can always jump to it and fly the camera there.
- **Wayfarer ↔ Ingress map sync ended 23 May 2025**, and the **December 2025 intel
  outage came from an expired certificate** — both context tier, both relevant for
  the same reason: anything built against intel hosting is subject to hosting
  decisions nobody publishes in advance. The `sameorigin` rung's fix line tells the
  agent to check the map page itself before blaming this app.

## Sandbox reality check (what "try connecting" returned here)

```
$ curl -sS https://intel.ingress.com/intel?ping=1
curl: (35) OpenSSL SSL_connect: SSL_ERROR_SYSCALL      # egress allow-list, not Ingress refusing
$ curl -sS 'https://apis.ingress.com/?cmd=getMap'
curl: (6) Could not resolve host                        # dead since the third-party API closed
```

This sandbox's egress is limited to `github.com`, `codeload.github.com`,
`api.github.com`, `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`. So no
live portal dump can be obtained from here, and none was fabricated: the offline
layer is generated from this repo's USGS GNIS gazetteer and labelled `SIM`. On a
machine with a route to the intel map, the same three rungs are attempted for real,
which is what `node tests/ingress-intel-browser.mjs` asserts (each verdict must be a
sentence, each failure must carry a fix).

## The relay contract, and the 60-line relay it matches

`js/ingress-intel-feed.js` expects exactly two things from `relayBase`:

| Call | Request | Response |
| --- | --- | --- |
| handshake | `GET <base>/status`, `Accept: application/json`, optional `X-Intel-Key` | `{ok:true, upstream, version?, tileParams?{zoom,level,tilesPerEdge,minLinkKm}, head?}` — `tileParams`/`version` are adopted when present |
| tiles | `GET <base>/getEntities?tileKeys=12_1999_1585,12_1999_1586` | a `getEntities` body, verbatim (`{result:{map:{key:{gameEntities,deletedGameEntityGuids}}}}`) is fine — the app does the decoding |

Anything else is up to the author: the key is a shared secret the relay checks and the
browser echoes, `sessionStorage`-only on this side (never `localStorage`, never a
cookie), and the relay is the only party that ever sees a game session.

A relay that runs *in the same browser* as a logged-in intel tab is the smallest
honest implementation — it never stores credentials, and it dies with the tab:

```js
// relay.mjs — run next to a logged-in intel.ingress.com tab. Community-tier
// reconstruction: it depends on the exact request shape IITC-CE documents above.
const KEY = process.env.INTEL_RELAY_KEY || "";
const PORT = Number(process.env.INTEL_RELAY_PORT || 8799);
const BASE = "https://intel.ingress.com";

const send = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json",
    "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,x-intel-key",
    "access-control-allow-methods": "GET,POST,OPTIONS" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
};

// The version token rotates per deployment; scrape it from the live page so the
// relay never sends a stale `v`. Same regex the reference client uses.
let version = "";
async function refreshToken(cookieHeader) {
  const html = await fetch(`${BASE}/intel`, { headers: { cookie: cookieHeader } }).then((r) => r.text());
  version = (html.match(/"X-CSRFToken".*[a-z].v="([a-f0-9]{40})";/) || [])[1] || version;
  return html.match(/name="csrf-token" content="([^"]+)"/)?.[1] || "";
}

await new (await import("node:http")).createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, "");
  const key = req.headers["x-intel-key"] || "";
  if (KEY && key !== KEY) return send(res, 401, { ok: false, error: "bad relay key" });
  const url = new URL(req.url, "http://x");
  // The session cookie is pasted once into INTEL_COOKIE by the operator; it is
  // never logged and never leaves this process.
  const cookie = process.env.INTEL_COOKIE || "";
  if (url.pathname === "/status") {
    if (!version) await refreshToken(cookie).catch(() => {});
    return send(res, 200, { ok: true, upstream: BASE, version: version || undefined,
      tileParams: { zoom: 12, level: 3, tilesPerEdge: 8000, minLinkKm: 0.3 } });
  }
  if (url.pathname === "/getEntities") {
    const tileKeys = (url.searchParams.get("tileKeys") || "").split(",").filter(Boolean);
    if (!tileKeys.length) return send(res, 400, { ok: false, error: "tileKeys required" });
    if (!cookie) return send(res, 503, { ok: false, error: "no session cookie in the relay environment" });
    const csrf = await refreshToken(cookie).catch(() => "");
    const r = await fetch(`${BASE}/r/getEntities`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrftoken": csrf, cookie, origin: BASE, referer: `${BASE}/intel` },
      body: JSON.stringify({ tileKeys, v: version }),
    });
    const text = await r.text();
    if (!r.ok && /out of date/i.test(text)) { version = ""; return send(res, 409, { ok: false, error: "version rotated, retry" }); }
    return send(res, r.status, text);
  }
  send(res, 404, { ok: false, error: `unhandled ${url.pathname}` });
}).listen(PORT, "0.0.0.0", () => console.log(`intel relay on :${PORT}`));
```

Type `http://127.0.0.1:8799` into the FEED panel's relay base and the `relay` rung
probes it for real. The key field is optional here; set `INTEL_RELAY_KEY` if the
relay should not be an open proxy, and note that the relay, not this app, is the
thing holding a game session — with the account-owner's own consent, since Niantic's
terms treat automated intel polling as theirs to allow.

## What was deliberately *not* claimed

- **No mod/amplifier maths.** VLS / SBUL / LLR link-range bonuses and amp effects are
  left as `RULES.modifiers: null` — "unmodelled" — rather than guessed at, and the
  score panel prints that count so nobody reads the numbers as complete.
- **No fake link derivation.** Links absent from a payload but implied by a field are
  counted in `fakedLinksSkipped`, not drawn as if they existed.
- **No invented portal state.** The sim's levels, health, resonators, MU and plext
  strip come from a seeded PRNG over real *coordinates*; the coordinates and names are
  USGS, everything else is not, and every record says so.
- **No persistent credential.** The relay key lives in `sessionStorage` and is
  stripped before the rest of the config is written to `localStorage`; the app never
  touches `document.cookie` except to *read* the CSRF token when it is genuinely
  same-origin.
