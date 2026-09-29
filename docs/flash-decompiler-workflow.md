# Flash decompiler workflow — Behind The Dune / NATA2 targets

This repo keeps adult/NSFW SWF/ZIP/RAR binaries **out of git**. The Flash
Decompiler page (`flash-decompiler.html`) can do browser-side SWF header/tag
triage through a configurable CORS proxy, but complete ActionScript and resource
export should be done in an isolated CI run.

## Why FFDec/JPEXS

[JPEXS Free Flash Decompiler](https://github.com/jindrapetrik/jpexs-decompiler)
(FFDec) is the maintained open-source Flash decompiler. It can export AS1/AS2,
AS3, text, images and SWF resources from the command line. The manual workflow in
this branch builds FFDec from GitHub in a container, downloads selected archive
URLs into the runner's temporary workspace, exports script/text resources, and
publishes the output as a GitHub Actions artifact.

## Manual run

Default run excludes NSFW targets and only processes the safe NATA2 baseline:

```bash
gh workflow run flash-decompile.yml -f include_nsfw=false
```

To process the Behind The Dune targets as well, explicitly opt in:

```bash
gh workflow run flash-decompile.yml -f include_nsfw=true
```

Optional: restrict the run to one or more target IDs:

```bash
gh workflow run flash-decompile.yml \
  -f include_nsfw=true \
  -f only_ids=behind-dune-official-swf-2024
```

## Target manifest

Targets live in:

```text
data/flash-decompiler-targets.json
```

The browser app and the workflow read the same manifest. Each entry records:

- `id`
- display label/family/date
- raw archive URL or metadata page
- `nsfw` flag
- known size / digest where available
- notes for the timeline

Only direct SWF URLs are passed to FFDec. RAR/ZIP packages are catalogued but are
not automatically unpacked by the workflow; extract them manually or add a
separate, explicit package-unpack step if needed.

## CORS proxy notes

The browser page supports:

- direct fetch
- `https://corsproxy.io/?{url}`
- `https://api.allorigins.win/raw?url={url}`
- any custom template containing `{url}`

Large SWFs may be blocked or truncated by public proxies. That is expected; use
GitHub Actions for complete exports.

## Output hygiene

The workflow uses temporary runner storage for downloaded binaries. Artifacts are
for review only and are not committed back into the repository. Before copying
any output into git, check licensing and content policy, especially for adult
assets.
