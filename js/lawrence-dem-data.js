/**
 * GENERATED from data/lawrence/dem-anchors.json by
 * scripts/build-lawrence-dem-data.mjs — do not edit by hand.
 *
 * Sparse 8x8 USGS 3DEP control grid, not a full-resolution DEM. The source
 * resolution and interpolation limitations are disclosed in DEM_META.
 */
export const DEM_META = Object.freeze({
  "name": "Lawrence, Kansas minimal 3DEP control grid",
  "source": "USGS 3DEP dynamic ImageServer getSamples",
  "sourceUrl": "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples",
  "retrieved": "2026-10-08",
  "method": "esriGeometryEnvelope sampleCount=64, returnFirstValueOnly=true, interpolation=RSP_BilinearInterpolation; source metadata spot-checked with outFields=Source,VerticalDatum,ProductName,URL",
  "sourceRasterResolutionMeters": 1,
  "sourceRasterIds": [
    96387,
    126863,
    130079,
    133962
  ],
  "sourceProduct": "USGS_3DEP 1 m project rasters (including KS_SCentral_L1_2015 and KS_Statewide_2018_A18)",
  "verticalDatum": "North American Vertical Datum of 1988 (NAVD 88), reported for checked source rasters",
  "metadataSpotChecks": [
    {
      "lon": -95.3,
      "lat": 39.03,
      "elevM": 253.916244507,
      "rasterId": 96387,
      "source": "USGS",
      "verticalDatum": "NAVD 88",
      "product": "USGS_3DEP"
    },
    {
      "lon": -95.16,
      "lat": 39.03,
      "elevM": 285.219940186,
      "rasterId": 130079,
      "source": "USGS",
      "verticalDatum": "NAVD 88",
      "product": "USGS_3DEP",
      "project": "KS_Statewide_2018_A18"
    },
    {
      "lon": -95.3,
      "lat": 38.89,
      "elevM": 311.926452637,
      "rasterId": 133962,
      "source": "USGS",
      "verticalDatum": "NAVD 88",
      "product": "USGS_3DEP",
      "project": "KS_SCentral_L1_2015"
    },
    {
      "lon": -95.24,
      "lat": 38.97,
      "elevM": 258.216278076,
      "rasterId": 126863,
      "source": "USGS",
      "verticalDatum": "NAVD 88",
      "product": "USGS_3DEP",
      "project": "KS_SCentral_L1_2015"
    }
  ],
  "horizontalDatum": "NAD83 (geographic coordinates; EPSG:4326 output)",
  "gridSpacing": "0.02 degrees: about 1.7 km east-west and 2.2 km north-south at 39 N",
  "disclosure": "This is an 8x8 sparse sample grid from the USGS 3DEP mosaic, not a 1 m raster. The 1 m value describes the source raster reported by the service; spatial detail between sample nodes is lost. The viewer bilinearly interpolates the samples for display. A more detailed resampled raster can be generated with scripts/fetch-lawrence-dem.py. EPQS/3DEP point samples are not surveyed control elevations."
});

export const DEM_GRID = Object.freeze({
  lon0: -95.3, lat0: 38.89,
  lon1: -95.16, lat1: 39.03,
  nx: 8, ny: 8,
  units: "meters",
  data: new Float32Array([253.9,252.7,253.9,255,258.5,301.1,326.6,285.2,266.6,252.7,249.9,250,248.9,251.3,262.9,271.9,286.7,272.4,260.2,247.9,250.3,249.6,247.7,272.6,307.8,303.5,300.7,258.2,248.8,248.4,246.8,248,291.5,281,291,268.3,264.4,266.4,248.8,248.1,256.1,253.6,262,253.5,266.4,260.6,254,248.1,254.6,253.1,251.8,251.5,254,250.8,247.4,254.3,311.9,271.8,275.2,259.4,263.1,249.3,270,269.2]),
});
