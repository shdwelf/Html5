# ADS-B Radar Scope

> **Register:** src-61 · **Original:** https://bashupload.app/fexily.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

A radar-scope view of live aircraft transponder traffic, drawn in the browser from public
ADS-B aggregation feeds.

## Feeds

`OPNSKY` · `ADS.FI` · `AIRPLANES.LIVE` · `ADSB.LOL` · `COMBO` — selectable individually or
combined.

## Display modes

`CLASSIC` · `MILITARY` · `ATC` · `RETRO` · `STEALTH`

## System status panel

FEED · TRACKS · SOURCES (1/1) · RANGE **100 NM** · UTC clock.

## Traffic summary

AIRBORNE · ON GROUND · HIGHEST · FASTEST.

## Target panel

CALLSIGN · ALT · SPD · HDG · DIST · SOURCE, plus a **Nearest tracks** list and a full target
record: ICAO24 · COUNTRY · BARO ALT · GEO ALT · GND SPEED · TRUE HDG · VERT RATE · SQUAWK ·
TYPE · STATUS · REG · SOURCE.

## Controls

`STATS` · `LIST` · `TARGET` · `RANGE 100` · `REFRESH`

## Note

The `ADSB.LOL` feed is the same public source the GODSEYE globe in this repository uses for
its aircraft layer, so this scope is the flat-panel counterpart to that globe's live traffic
view — same data, drawn as a radar instead of a sphere.

## Current interface correction

The canonical `apps/ads-b-radar-scope` is now a **tiled 4DWM-style workbench**:
controls, scope and instruments occupy separate layout cells instead of covering
one another. Narrow screens scroll; target details stay in the instrument stack.
`apps/radar_scope.html` is a source-exact browser alias, refreshed with
`node scripts/build-radar-scope.mjs` (`--check` verifies it).

The app starts with labeled **synthetic demo data and zero feed requests**.
Select **Start live** explicitly. **Direct** never falls back to any proxy.
**Explicit HTTPS proxy** uses only the selected operator, requires consent, and
is not a VPN. Changing route/revoking consent pauses and aborts pending requests;
old replies cannot replace the demo. Feed/proxy queries can reveal the area being
queried, especially if optional GPS is enabled. Sharing to Webxdc peers is manual.
Feed text is rendered inertly; keyboard-accessible track buttons mirror the canvas.
No live provider availability or owner-device/Android rendering is inferred from
browser tests using synthetic intercepted replies. This remains unsuitable for
navigation or safety-critical tracking.

Validation entrypoints: `node --test tests/radar-scope.test.mjs` and
`node --test tests/radar-scope-browser.mjs`. The latter exercises six viewport
sizes, open details, no overlap/horizontal clipping, direct failure with no proxy
fallback, explicit proxy consent and hostile-text rendering without real requests.
