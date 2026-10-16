# CyberChef Aztec, Avery LabelPro, and CueCat support

## Generate Aztec codes and Avery labels

CyberChef's Barcode category has an **Aztec Code** operation and an Aztec option
in the Avery 5160, 5161, 5163, 5392, and custom label layouts. It uses the
locally bundled `bwip-js` **4.7.0** browser renderer to generate SVG; no barcode
service or network request is involved. Aztec error correction is a percentage
(default 23%), separate from the QR error-correction selector.

The Avery renderer places each Aztec symbol inside the label's printable box,
with optional human-readable text below. The Avery 5392 (2 × 4 name-badge)
recipe is a larger sample. Print at actual size / 100% and test on plain paper
first: printer margins and the particular stock can differ, so the template is a
layout aid rather than a printer-calibration guarantee.

## Decode an Aztec image

The **Aztec Code — Decode Image** operation uses the bundled ZXing JavaScript
**0.21.3** reader. Choose **Load File**, select a PNG/JPEG/WebP (or another
browser-readable image), add the decode operation, and bake. It also accepts a
Base64-encoded image or image data URL by changing the operation's input-format
setting. Decoding happens locally; there is no upload or remote service.

The operation returns the first detected Aztec symbol. For a multi-label Avery
sheet, crop the image to one label before decoding. The automated Chromium check
rasterizes the generated Avery 5392 SVG and independently decodes both sample
payloads, `SITE-K` and `WIKI-IN-A-JAR`. This verifies the generated vector art and
CyberChef image-decoding path; it does **not** certify any physical printer,
stock alignment, camera, or scanner. If a printed label is missed, confirm that
the reading device supports Aztec (not just QR or linear barcodes), print at
100%, use a sharp high-contrast crop, and try increasing the symbol's physical
size or error-correction percentage.

## CueCat is a different input format

A CueCat is a legacy keyboard-wedge scanner whose scan stream uses a modified
Base64 alphabet. CyberChef's **CueCat Scan Decoder** accepts one encoded section
or the three dot-delimited sections from a complete scan (serial, type, and
barcode data). The implementation reuses the locally documented algorithm and
published vectors in `js/makint.js` / `tests/13-makint.mjs`.

CueCat data is **not Aztec Code**. The decoder can recover the payload from a
raw CueCat scan string when the scanner has already read a barcode it supports;
it cannot turn CueCat data into an Aztec decoder or read the printed Aztec
symbol itself.

## Curated CyberChef recipes

- **Aztec Code — direct symbol** — generate a sample Aztec symbol.
- **Avery LabelPro — Aztec Code** — render `SITE-K` and `WIKI-IN-A-JAR` on the
  Avery 5392 layout.
- **Aztec Code — decode image** — decode an image loaded with the file picker.
- **CueCat — modified Base64 scan decoder** — decode the supplied full-stream
  vector; replace it with a scan string from a compatible reader.

The pinned renderer is at `public/apps/cyberchef/vendor/bwip-js.min.js`, with
its MIT license beside it. The ZXing reader and its license are in the same
folder. `cyberchef.xdc` packages both libraries. The standalone SFX download
inlines them so the one-file HTML remains offline-capable.
