# GeoMate.jr firmware and cache-database research

Research pass: 2026-10-06.

## Identification

The toy-like geocaching receiver described in the request is the **Geomate.jr**
(the original product was associated with Apisphere/Geomate and later Brand 44),
not the SG6 in the supplied support link. Contemporary product and review
material describes the Geomate.jr as a dedicated children's geocaching GPS with
approximately 250,000 preloaded traditional caches. The receiver exposes cache
ID, coordinates, distance, direction, difficulty, terrain, and size; the update
kit loads replacement cache lists over a proprietary USB cable.

The best primary-ish historical lead is the Geomate.jr manufacturer's account
on the Geocaching forums:

- [The Geomate.jr Update Kit](https://forums.geocaching.com/GC/index.php?/topic/230764-the-geomatejr-update-kit/)
- [page 2](https://forums.geocaching.com/GC/index.php?/topic/230764-the-geomatejr-update-kit/page/2/)
- [page 3](https://forums.geocaching.com/GC/index.php?/topic/230764-the-geomatejr-update-kit/page/3/)

The thread says the update kit was distributed through `mygeomate.com/updates`,
that the unit reported firmware versions such as `V1002 RE X2`, and that the
update process could report **“Flash Programming Failed.”** It also says the
later updater fixed a USB-hardware/configuration problem. This is evidence of a
firmware update path, but it is not itself a firmware image.

Useful corroborating references:

- [Geomate.jr review](https://techcrunch.com/2011/08/22/tc-tests-the-geomate-jr-a-geocaching-gps-unit-for-the-wee-ones/)
- [Geomate.jr product/update-kit description](https://www.amazon.com/Geomate-Jr-Geocaching-GPS-Update/dp/B002MZZX9O)
- [Offline-update report](https://spindocbob.wordpress.com/2012/01/27/have-a-geomate-jr-dont-panic/)
- [Geomate.jr manual-input discussion](https://forums.geocaching.com/GC/index.php?/topic/306156-geomatejr-manually-input-coordinates/)

The historical updater names found in those references include
`geomateQtGuiApp.exe`, `geomategui.exe`, and `geomateloadersetup.exe`. The
available descriptions indicate that the standalone loader can accept a GPX
file and upload it to the unit. That is different from the web update process,
which generated/downloaded a cache database and may also have delivered device
firmware.

## The supplied SG6 link is a different product

The supplied support article currently resolves to **SG6_v1.5.2_20251226** and
says “This is the firmware of SG6.” SG6 is a current Geomate land-survey GNSS
receiver, not the Geomate.jr geocaching toy. Its download link is a hosted
firmware package, but it must not be treated as the Geomate.jr firmware without
an explicit device match. In particular, no SG6 bytes are imported into this
repository and no SG6 update should be flashed to a Geomate.jr.

- [Supplied SG6 support article](https://support.geomate.sg/portal/en/kb/articles/sg6-1-3-5-20241015)

## What can and cannot be concluded yet

The Geomate.jr cache corpus was **not hard-coded into the executable in the
usual sense**. Public descriptions call it “preloaded”; the update-kit reports
refer separately to the unit firmware and the unit database. The likely
architecture is a firmware/application image plus a separately programmed
cache database. A decompiler pass over only the updater would therefore first
need to determine whether it contains an embedded device image, a downloader,
a database encoder, or just a USB loader.

No Geomate.jr firmware/update binary, installer, GPX export, or cache database
is present in this checkout. Therefore this pass deliberately does **not**:

- claim to have run Ghidra on the SG6 link or on a missing Geomate.jr binary;
- invent cache coordinates or cache IDs;
- copy the stale 2009–2012 preloaded corpus into the SoCal register; or
- publish a firmware image or executable in Git.

The forum and product references describe caches as ordinary geocaching.com
records, including traditional-only filtering in the original preload. Cache
coordinates and descriptions are also time-sensitive: archived caches can be
removed or moved, so an import needs a dated source and a provenance record.

## Planned static-analysis/import workflow

When the actual Geomate.jr updater or firmware package is supplied, the safe
workflow is:

1. Preserve the original file outside Git and record SHA-256, size, and source
   URL/date.
2. Identify the container/installer and extract payloads without executing
   them (`7z`, `innoextract`, or the package's documented archive format).
3. Import candidate PE/ELF/flat-ROM payloads into **Ghidra headless** with the
   matching processor/language; export strings, symbols, and decompiled code.
4. Look for USB protocol code, flash/programming commands, database signatures,
   GPX/XML strings, cache-code patterns (`GC` followed by digits), coordinate
   encodings, and version/build strings. Treat strings alone as leads, not
   decoded records.
5. Validate any recovered record against the source GPX/database format and
   keep a machine-readable extraction report with offsets and hashes.
6. Convert only records with defensible coordinates and provenance into the
   SoCal Gazetteer. They should be a separate `Geocache` class/FTT branch,
   retain their cache code and source date in the note, and never be marked as
   verified GNIS features.
7. Rebuild and test `socal-subsurface.xdc` with
   `node scripts/build-socal-subsurface-xdc.mjs`.

The existing subsurface register is GNIS-oriented (`name + feature class +
point + GNIS verification`), so geocaches should be added as a clearly
separate community/source tier rather than silently mixed into GNIS rows.
