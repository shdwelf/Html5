# urln/ln — an `ln` rewrite for URL targets

Stock symbolic links do **not** download anything:

```sh
ln -s https://example.com/file.zip file.zip
# creates a symlink whose target is the literal text
# "https://example.com/file.zip" (a path that does not exist)
```

Transparent URL files are normally done with a FUSE filesystem such as
httpfs/simple-httpfs. This tool is the smaller drop-in version: it
rewrites `ln` so a URL target is downloaded once with `curl` (with a
plain-HTTP `nc` fallback when curl is absent), stored in a cache
directory, and the symlink points at the downloaded local file.

## Usage

```sh
# Local behaviour is the same idea as ln(1):
tools/urln/ln -s /path/to/file my-link
tools/urln/ln -sfn /opt/app/releases/2.1.0 /opt/app/current

# URL behaviour (this is the new part; -s is required):
tools/urln/ln -s https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.2_build/ghidra_12.2_PUBLIC_20261016.zip ./ghidra.zip

# Choose the download store, or force a fresh copy:
tools/urln/ln --cache-dir ./downloads -s https://example.com/tool.tar.gz ./tool.tar.gz
tools/urln/ln --refresh -s https://example.com/tool.tar.gz ./tool.tar.gz
```

Default download store: `$URLN_CACHE` or `~/.cache/urln`.
Downloaded files are named `<sha256(url)[0:20]>-<basename>` inside the
store, so different URLs do not collide and repeat links reuse the
cached file unless `--refresh` is given.

## Notes and limits

- URL targets require `-s`: hard links cannot point at network files.
- `curl` is the primary downloader. `nc` is only a fallback for
  `http://` (netcat cannot do TLS); install curl for `https://`/`ftp://`.
- This is an eager download, not an on-demand FUSE mount. Opening the
  symlink reads the cached local file; use `--refresh` to replace it.
- GitHub check while building this: the latest Ghidra release
  (`Ghidra_12.2_build`) publishes a single cross-platform asset,
  `ghidra_12.2_PUBLIC_20261016.zip`, so one URL link is enough — there
  are not four separate OS-specific Ghidra downloads to link.
