# GODSEYE — God's Eye View · HTML5 / webxdc conversion

A static, keyless, offline-first conversion of
[bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view) (MIT)
into this repository's HTML5 + webxdc app family.

Open `godseye.html` in any browser, or load `godseye.xdc` into a messenger that
speaks webxdc (e.g. Delta Chat). No API keys, no server, no build step.

## What's on the globe

| Layer      | Source | Key | Status model |
|------------|--------|-----|--------------|
| Satellites | Celestrak GP (TLE) + SGP4 via vendored [satellite.js](https://github.com/shashwatak/satellite-js) (MIT) | 🟢 none | LIVE / OFFLINE |
| ISS        | same feed, NORAD 25544, dedicated marker | 🟢 | LIVE |
| Aircraft   | [adsb.lol](https://adsb.lol) v2 regional snapshot (250 nm around view) | 🟢 none | LIVE / OFFLINE |
| MIL AIR    | adsb.lol `/v2/mil` military transponders | 🟢 none | LIVE / OFFLINE |
| Quakes     | USGS `all_day.geojson` | 🟢 none | LIVE / OFFLINE |
| Ships      | modeled shipping lanes (AIS streams require a private key) | 🟢 none | always labeled SIM |

The basemap is a Natural Earth (public domain, 110m) vector landmass drawn to a
canvas texture — fully offline. When the network allows, a remote NASA Blue
Marble equirectangular image is fetched as a photoreal upgrade (clearly
attributed in the top bar).

## Controls

- drag / wheel / pinch — orbit, zoom
- click a contact — camera locks on, trail draws, telemetry card opens
- `1`–`6` — sensor optics (STANDARD / CRT / NVG / FLIR / NOIR / SNOW)
- `R` — reset globe · `Esc` — release track
- command bar: `help`, `go tokyo`, `fly lax`, `track ISS`, `track DLH123`,
  `sats|flights|mil|quakes|ships on|off`, `style flir`, `share`, `reset`

## webxdc

`webxdc.sendUpdate` broadcasts the current view (camera subpoint, distance,
optics, tracked target) to everyone in the chat; their EYES panels list it and
`JUMP` flies your camera to the same eye. In a plain browser a local stub
(`webxdc.js`) provides the same API surface.

## Packaging

```sh
sh tools/pack_godseye.sh   # -> godseye.xdc  (standalone webxdc)
sh tools/pack_xdc.sh       # -> sitek.xdc    (SITE-K hub incl. GODSEYE)
```

## Attribution

- Original concept and name: God's Eye View (Bilawal Sidhu), MIT.
- satellite.js (Shashwat Kandpal et al.), MIT — vendored at `vendor/satellite/`.
- three.js, MIT — vendored; see `vendor/THREE_LICENSE`.
- Natural Earth country polygons — public domain, `vendor/world/`.
- Feeds: USGS Earthquake Hazards Program · CelesTrak · adsb.lol (community receivers).
