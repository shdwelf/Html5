# SIMGIRLS Flash disassembly research

Last checked: 2026-09-29

## Scope and handling

This note maps verifiable releases and preservation containers for SimMan's
**SIMGIRLS** series. It intentionally does not mirror adult assets. The shared
manifest marks every series target `nsfw: true`, so browser retrieval and CI
analysis require an explicit opt-in. “Disassembly” here means static SWF/AVM1 or
AVM2 inspection; no Flash content is executed.

## Verified preservation records

| Release record | Container | Size | Integrity | Analysis status |
|---|---:|---:|---|---|
| Simgirls 5.24 English | `Simgirls 5.24 [English].swf` | 9,568,667 B | MD5 `5f4f23cfb781e0a3c32634b8aa89827b`; SHA-1 `1135272f8214a959f5d891a97eb1b165c342c28a` | Direct SWF; ready for opt-in FFDec export |
| Sim Girls 6.6 English | `sim661.swf.arc` | 13,825,244 B | MD5 `e0f09527eb193b9a0b5564bda70a2859`; SHA-1 `2d3bc88281622d25c27db749145992430ff41eb6` | IA ARC container; extract member first |
| Simgirls (Full Version) | Newgrounds portal `594476` | not established | not established | Landing page verified; no stable raw asset URL recorded |

The dates attached to the two Internet Archive records are **upload dates**, not
claims about original release dates. The Newgrounds page identifies the full
version; its portal date is 2012-04-25.

### Sources

- [Internet Archive item metadata, v5.24](https://archive.org/metadata/SimGirlsV5.24EnglishSWF)
- [Internet Archive item metadata, v6.6](https://archive.org/metadata/SimGirlsV6.6EnglishSWF)
- [Newgrounds portal 594476, “Simgirls (Full Version)”](https://www.newgrounds.com/portal/view/594476)

## Important container distinction

The v6.6 archive does **not** currently expose `sim661.swf` as an ordinary
Shockwave Flash file. Its original is `sim661.swf.arc`, format “Internet Archive
ARC,” and the item records `CDXIndex:unknown:sim661.swf.arc`. Passing that file
directly to FFDec will fail. A future extraction step should:

1. download the ARC into temporary storage;
2. enumerate ARC records without executing content;
3. select a record only after confirming its payload starts `FWS`, `CWS`, or
   `ZWS`;
4. hash the extracted payload separately from the container;
5. pass only that payload to FFDec.

Until those checks exist, v6.6 remains catalog-only in the automated workflow.

## Reproducible v5.24 analysis

The existing manual workflow can select the direct v5.24 SWF:

```bash
gh workflow run flash-decompile.yml \
  -f include_nsfw=true \
  -f only_ids=simgirls-v524-ia-2019
```

Expected workflow behavior is script and text export only. After download,
verify the manifest digest before decompilation:

```bash
sha1sum 'Simgirls 5.24 [English].swf'
# 1135272f8214a959f5d891a97eb1b165c342c28a
```

## Static-analysis questions for the next pass

Once the opt-in artifact is available, record these facts rather than relying on
playthrough lore:

- SWF signature, SWF version, stage size, frame rate, and compression;
- AVM generation (`DoAction`/`DoInitAction` for AVM1 versus `DoABC` for AVM2);
- frame labels and the main timeline's state transitions;
- save/load mechanism (`SharedObject`, cookies, or encoded variables);
- external network calls, `getURL`, `loadMovie`, and hard-coded domains;
- version strings and build markers embedded in scripts or text;
- differences in variable names, route gates, and endings between 5.24, 6.6,
  and the full release.

Do not infer a version relationship solely from archive upload order: v5.24 was
uploaded later than v6.6 even though its version number is lower.

## Current limitations

A sandbox retrieval attempt for the 9.6 MB v5.24 binary failed during TLS setup,
so this pass does not claim a locally verified SWF header or tag inventory. The
size and checksums above come from Internet Archive's file metadata and should be
rechecked against downloaded bytes in CI. No claim is made yet about AVM1 versus
AVM2, cheats, hidden routes, or code-level differences.
