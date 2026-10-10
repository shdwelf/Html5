# Third-party notices

## Wiki-in-a-Jar 0.8 / XRays Web Framework

The patch sources under `src/` are GPL-2.0-or-later code based on the upstream
Wiki-in-a-Jar 0.8 source mirror at
[`astecenko/Wiki-in-a-Jar`](https://github.com/astecenko/Wiki-in-a-Jar), commit
`a56cfdfc8d343f60c915825a01af24577846cede` (`v0.8 update`, 2008-11-28). The
binary package used for the local build is the 123,402-byte
`WikiInAJar-0.8-20081128-bin.zip` from the connected Google Drive backup; it is
not vendored in this repository. The modified files retain the upstream GPL
header and the application distribution remains subject to GPL terms.

## djvu-rs WebAssembly decoder

The browser reader vendors the `djvu-rs` 0.42.0 browser distribution from npm
under `public/skins/default/djvu-rs/`. Upstream: <https://github.com/matyushkin/djvu-rs>.
License: MIT; see the bundled `djvu-rs/LICENSE` file. The npm tarball SHA-1 is
`b6f0b3d414f7ae07c3a0c07f8ae76496dafdb186`.

## DjVu smoke fixture

`test/fixtures/boy.djvu` is a 4.8 KB test document borrowed from the `djvu.js`
project via the djvu-rs test corpus. The asset is distributed under the
[Unlicense](https://unlicense.org/); the original DjVu/DjVuLibre attribution is
recorded in `test/fixtures/ATTRIBUTION.md`.
