/**
 * Gazetteer packs composed by Planet Viewer.
 *
 * The city viewer originally loaded only the five city registers, which left
 * the Cheyenne and San Gabriel terrain plates without their own names. Reuse
 * the existing Cheyenne GNIS register and the synced SoCal register instead of
 * inventing labels or copying a second Angeles list. Coordinates and source
 * tiers remain exactly as recorded in their source packs.
 */
import { GAZ_ROWS as atlanta } from "./city-gazetteer-data-atlanta.js";
import { GAZ_ROWS as buffalo } from "./city-gazetteer-data-buffalo.js";
import { GAZ_ROWS as kansasCity } from "./city-gazetteer-data-kansascity.js";
import { GAZ_ROWS as lawrence } from "./city-gazetteer-data-lawrence.js";
import { GAZ_ROWS as toronto } from "./city-gazetteer-data-toronto.js";
import { GAZ_ROWS as polynesia } from "./city-gazetteer-data-polynesia.js";
import { GAZ_ROWS as socal } from "./socal-gazetteer-data.js";
import { GAZETTEER as cheyenne } from "./cheyenne-data.js";

const FTT_FOR_CLASS = {
  Range: "phys.range",
  Ridge: "phys.ridge",
  Summit: "phys.summit",
  Valley: "phys.valley",
  Basin: "phys.basin",
  Flat: "phys.flat",
  Glacier: "phys.glacier",
  Pillar: "phys.pillar",
  Crater: "phys.crater",
  Lava: "phys.lava",
  Cape: "phys.cape",
  Gap: "phys.gap",
  Falls: "hydro.falls",
  Lake: "hydro.lake",
  Reservoir: "hydro.reservoir",
  Spring: "hydro.spring",
  Stream: "hydro.stream",
  Canal: "manmade.canal",
  Mine: "manmade.mine",
  Oilfield: "manmade.oilfield",
  Tunnel: "manmade.tunnel",
  "Populated Place": "pop.ppl",
  Census: "pop.census",
  Locale: "pop.locale",
  Park: "admin.park",
  Reserve: "admin.reserve",
  Military: "admin.military",
};

const withSource = (rows, source) => rows.map((row) => [...row, row[10] ?? source]);

function cheyenneRows(records) {
  return records.map(([name, lon, lat, fclass]) => {
    const ftt = FTT_FOR_CLASS[fclass];
    if (!ftt) throw new Error(`No feature type mapping for Cheyenne Gazetteer class: ${fclass}`);
    return [
      name,
      fclass,
      ftt,
      "",
      lat,
      lon,
      null,
      null,
      0,
      "USGS GNIS geonames MapServer point from the Cheyenne/Angeles register. docs/cheyenne.md records a July 2026 refresh, but the GNIS query date is unverified in the retained source notes; do not infer it from adjacent 2026-10-02 3DEP/MRDS pull dates. This is the first point of the returned feature geometry. The retained four-column register has no GNIS FEATURE_ID, so none is asserted here.",
      "js/cheyenne-data.js",
    ];
  });
}

/** [name, class, FTT, area, lat, lon, elevation, GNIS id, verified, note, source] */
export const PLANET_GAZ_ROWS = [
  ...cheyenneRows(cheyenne.chey),
  ...withSource(socal, "js/socal-gazetteer-data.js"),
  ...withSource(atlanta, "js/city-gazetteer-data-atlanta.js"),
  ...withSource(buffalo, "js/city-gazetteer-data-buffalo.js"),
  ...withSource(kansasCity, "js/city-gazetteer-data-kansascity.js"),
  ...withSource(lawrence, "js/city-gazetteer-data-lawrence.js"),
  ...withSource(toronto, "js/city-gazetteer-data-toronto.js"),
  ...withSource(polynesia, "js/city-gazetteer-data-polynesia.js"),
];

export const PLANET_GAZETTEER_META = Object.freeze({
  sources: Object.freeze([
    "Cheyenne/Pikes Peak USGS GNIS subset (js/cheyenne-data.js)",
    "Synced SoCal GNIS-oriented register (js/socal-gazetteer-data.js)",
    "Five city registers and the Bora Bora name-only locality register",
  ]),
  cheyenneGnisQueryDate: null, // unverified in the retained GNIS source notes
  cheyenneRows: cheyenne.chey.length,
  socalRows: socal.length,
});
