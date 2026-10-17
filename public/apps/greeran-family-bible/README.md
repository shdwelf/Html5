# World English Bible Updated (WEBU)

This folder contains the complete WEBU verse dataset used by the Greeran Family Tree's offline “inside back cover” reader.

- **Text source:** [eBible.org — World English Bible Updated](https://ebible.org/find/details.php?id=engwebu)
- **Dataset source:** [ringletech/webu-open-bible](https://github.com/ringletech/webu-open-bible), commit `44ce9156b77649adf11c0bbcee89c1d80e2c1f1c`
- **Dataset release:** 2025.10.28; 66 books, 1,189 chapters, 31,098 verses
- **License:** CC0 1.0 / public domain. The upstream `LICENSE` and `metadata.json` are retained alongside the data.
- **Modifications:** none to the verse content; the upstream dataset notes whitespace normalization only.

The reader groups the upstream flat JSON array by book and chapter in the browser. The dataset is served locally from the XDC package; the reader makes no network request. The Bible's genealogy passages are offered as a reading trail, not as evidence of a historical or biological relationship to the Greeran family.
