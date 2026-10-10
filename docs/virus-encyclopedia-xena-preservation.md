# DOS Virus Encyclopedia — Xena-inspired preservation of the Ghidra/encryption recipes

*2026-10-09 · `tools/build_virus_xena.mjs` · `npm run build:virus-xena`*

## What is preserved

The DOS Virus Encyclopedia (`js/virus-catalog.js`, `docs/virus-encyclopedia.md`,
`docs/dr-solomon-virus-encyclopaedia-ghidra.md`) records **analysis recipes**:
boot-sector and file-infection **signatures**, the **self-decrypting loops**
(Cascade's overlapping-word XOR, the ADD-byte boot-sector decryptor, the TPE
engine's generated decryptors), and the **Ghidra decompilation notes**. This
packages those recipes — 17 of them — as a preservation object.

It preserves the *findings*, not runnable malware. The corpus stays in
`samples/` and is referenced by id; nothing is executed and no sample is
repackaged as executable code. The catalog is inert data.

## Format — Xena-inspired, not native Xena

Following the house pattern in `docs/geomate-gpx-preservation.md`, the output is
a **BagIt 1.0** bag (`RFC 8493`) with SHA-256 payload and tag manifests:

```
virus-encyclopedia-xena/
  bagit.txt
  manifest-sha256.txt              # payload hashes
  tagmanifest-sha256.txt           # tag-file hashes
  data/
    original/virus-catalog.js      # the source module, unchanged
    original/virus-catalog.json    # the inert catalog data as served
    normalized/virus-recipes.xml   # app-defined normalized rendition
    normalized/virus-recipes.json
  metadata/
    preservation-event.json        # the normalization event
```

The normalized schema (`urn:shdwelf:html5:virus-recipes:1`) is
**application-defined**. This is **Xena-inspired** in the limited sense the
GPX work uses: it retains a source object and creates a documented rendition
with a preservation-event record. It is **not processed by Xena** (the National
Archives of Australia tool, `srnsw/xena`) and is **not a native `.xena`
object** — stated plainly so the distinction is never overclaimed.

## Recipe content

Each `<recipe>` carries id, name/aka, kind, era/family, processor language,
byte length, the detection **signature**, the technique list, and an
`<analysis>` note holding the decryption/decompilation substance. Three samples
are marked `analyzable="true"` — the ones reassembled into real machine code so
the Ghidra-WASM decompiler (`tools/decompile_mz.mjs` /
`@mauricelam/ghidra-decompiler-wasm`) has something to chew on.

## Verification

```sh
npm run build:virus-xena     # writes dist/virus-encyclopedia-xena/
node --test tests/virus-xena.test.mjs
```

The test rebuilds the bag into a temp dir and checks: BagIt structure, every
payload and tag SHA-256 manifest against the files on disk, XML well-formedness
and recipe count, and that the preservation event declares the Xena
relationship honestly. `dist/` is a build artifact (gitignored); the tool and
this doc are the committed source of truth.

## References

- `srnsw/xena` — National Archives of Australia digital-preservation software (the inspiration, not a dependency).
- BagIt, RFC 8493 — package structure and manifests.
- `js/virus-catalog.js` — the recipe data; `test/virus-encyclopedia-recipes.test.ts` — the CyberChef `virusSigScan` / `dosBootSector` ops.
