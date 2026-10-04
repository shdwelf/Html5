# Satellite launch windows & launch opportunities — research continuation — 2026-10-04

Continues `docs/satellite-constellations.md` (research of 2026-09-30). This
pass adds the *launch* half of the story to the constellations viewer: why
windows exist, how long each mission class gets, what is launching in the
near term, and one new orbit layer (`transfer`) that draws the orbits
launches actually fly through.

## Window mechanics (the taxonomy shipped in `LAUNCH_WINDOWS.types`)

A launch **period** is the run of days a mission can fly; the launch
**window** is the slice of a single day. The window length is set by orbital
geometry — the tightest constraint wins, and the more specific the target,
the shorter the window:

| Mission class | Typical window | Dominant driver |
|---|---|---|
| ISS / crewed rendezvous | instantaneous (seconds) | pad must rotate into the station's plane; RAAN is set by launch time because in-flight plane changes are prohibitively expensive |
| Sun-synchronous | minutes, once daily | required local time of ascending node (LTAN) |
| GEO via transfer orbit | 1–4 hours, near-daily | transfer geometry + Sun angle |
| LEO constellation | hours, flexible | broad plane tolerance; phasing finished on orbit |
| Lunar | tens of minutes–~2 h on select days | Moon position + vehicle thermal/lighting constraints |
| Mars (Hohmann-class) | weeks of days, every ~26 months | Earth–Mars synodic period (~780 days) |

Key mechanics verified across sources:

- **Instantaneous windows** exist because achieving a specific RAAN is done
  by *waiting for Earth to rotate* the pad into the target plane; guidance
  leaves RAAN as the free variable otherwise.
- Shuttle-era ISS flights added a **beta-angle cutoff** (launches avoided
  when the ISS beta angle exceeded ~60°) — a thermal/power constraint, not a
  geometric one, narrowing the launch *period*.
- Interplanetary windows repeat on the **synodic period**: ~26 months for
  Mars, ~13 months for Jupiter.

## Launch opportunities at research time (shipped in `LAUNCH_WINDOWS.opportunities`)

- **Mars window, Nov → Dec 2026** — opens in November 2026, closes roughly a
  month later; the next viable period is late 2028/early 2029.
- **JAXA MMX (Martian Moons eXploration)** — NET Nov 2026 from Tanegashima,
  riding that window; Phobos sample return with Mars/Phobos/Deimos
  observation. The launch period is reported as late Oct–Dec 2026.
- **NASA Artemis II** — crewed lunar free-return; April 2026 attempt
  reporting showed the daily-window shape for lunar missions (e.g. April 1
  window 5:24–7:24 pm CT — about two hours, on select days only).
- **ISS cadence** — every crew/cargo flight demonstrates the instantaneous
  window; a scrub costs a full day.
- **SSO ride-share cadence** — Earth-observation stacks launch in
  once-daily, minutes-long windows pinned to their LTAN.

## New orbit layer: `transfer` (launch & transfer orbits)

Two **illustrative orbit classes** (explicitly labeled "not a fleet"):

1. **GTO transfer ellipse** — 250 × 35,786 km at 27°: apogee kisses the GEO
   belt ring already drawn in the reference layer; inclination echoes the
   launch-site latitude, which is exactly why GEO windows and site choice
   matter. Period ≈ 10.5 h, e ≈ 0.73.
2. **Molniya-type HEO** — 600 × 39,750 km at the 63.4° critical inclination
   (perigee drift frozen), argument of perigee 270° so apogee hangs over the
   north. Period ≈ 12 h (semi-synchronous).

Renderer change: `orbitalPoint()` now supports `perigeeKm`/`apogeeKm` shells
via the conic equation r(ν) = a(1−e²)/(1+e·cos ν) with an `argPerigeeDeg`
rotation. The anomaly is still advanced linearly in time (no Kepler-equation
solve), which is called out in code — this remains an orbit-*shape* theater,
not an ephemeris. The dossier for elliptical shells reports perigee × apogee,
eccentricity, the period from the semi-major axis, and horizon/light-time at
apogee.

A new **LAUNCH WINDOWS PiP** lists the taxonomy table (row tooltips carry the
driver explanations) and the dated opportunity register; each opportunity
opens a sourced dossier.

## Sources consulted (this pass)

- Orbital Radar — launch window glossary — `https://orbitalradar.com/glossary/launch-window`
- Launch window / launch period mechanics (RAAN, instantaneous windows, ISS beta cutoff) — `https://everything.explained.today/Launch_window/`
- NASA Earth Observatory — Catalog of Earth Satellite Orbits (GTO, Molniya, critical inclination) — `https://earthobservatory.nasa.gov/features/OrbitsCatalog`
- The Space Review — 2026 Mars window / MMX reporting — `https://www.thespacereview.com/article/5230/1`
- Space Calendar — MMX NET Nov 2026, Tanegashima, window late Oct–Dec 2026 — `https://spacecalendar.com/events/category/launch/`
- 19FortyFive — Mars window opens Nov 2026, closes ~1 month later, next 2029 — `https://www.19fortyfive.com/2026/08/the-mars-launch-window-opens-in-november-2026-and-closes-about-a-month-later-the-next-one-is-in-2029/`
- Adler Planetarium — Artemis II launch window updates (April 2026; window shapes) — `https://www.adlerplanetarium.org/news/artemis-ii-nasa-crewed-moon-mission/`
- JAXA MMX — `https://www.mmx.jaxa.jp/en/`
- NASA Artemis II — `https://www.nasa.gov/mission/artemis-ii/`

## Caveats

1. Dates ("NET Nov 2026", "April 2026") are the sources' statements at check
   time, not a live schedule; the panel prints its retrieval date.
2. The GTO/Molniya entries are orbit classes. No operator fleet, count, or
   status is claimed; `currentSatellites` holds the marker count only.
3. The elliptical animation advances true anomaly linearly — apogee dwell is
   *not* reproduced in motion (satellites do not visibly slow). The dossier
   says "perigee-fast / apogee-slow (vis-viva)" so the physics is stated even
   though the animation is schematic.
4. No porkchop plots, C3 energies, or day-by-day window tables are computed
   or implied.
