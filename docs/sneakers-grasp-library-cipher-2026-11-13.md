# Sneakers press kit, layer 3: the GRASP 4.00d protected library — cipher recovered, members extracted, Xena-wrapped

**Date:** 2026-11-13 · **Branch:** `arena/cbd4749d-html5` (PR #217) · **Method:** static only — nothing from the diskette was executed, emulated, or run in a sandbox. Every number below is a byte read from the pinned ZIP or a deterministic computation over it.

This note finishes the "disassemble the Sneakers press kit" thread begun in
[`sneakers-press-kit-investigation-2026-11-11.md`](sneakers-press-kit-investigation-2026-11-11.md) and
[`sneakers-original-ghidra-wasm-2026-10-18.md`](sneakers-original-ghidra-wasm-2026-10-18.md). Those notes stopped at the runtime: `SNEAKERS.EXE` is **GRASPRT 4.00d** (Paul Mace Graphics / John Bridges, "4.00d - Jul 27 1992 Written by John Bridges", string at file offset 0x1c650) with an embedded **GL** library whose members were scrambled by an unknown byte transform. This note recovers the transform from the runtime's own code, decodes all 224 members, pins their hashes, and ships them as National Archives of Australia **Xena** `binary-object` packages.

## 1. Pinned inputs

| artefact | bytes | SHA-256 |
|---|---:|---|
| `webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip` | 2,066,643 | `b6e3d2a99de90b6de401a5d8d0023299c632e65ca98246bbe5d4842336f01eef` |
| ↳ `SNEAKERS.EXE` (GRASPRT 4.00d + GL library) | 2,219,117 | `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961` |
| ↳ `SNEAK.EXE` | 1,074,631 | `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb` |

## 2. Where the library is and how it is keyed

The MZ header of `SNEAKERS.EXE` is 0x120 paragraphs; the load module ends at file offset **121,997 (0x1dc8d)** and the GL library begins right there (GRASPRT's "bound" mode — the `GRASPRT libfile [ textnames...]` usage string at 0x1c40a is the unbound alternative).

```
u16  dirLen                          = 3825  (0x0ef1)
17-byte entries { u32 offset; char name[13]; }  × 224, then an all-zero terminator
members: { u32 length; u8 data[length]; }  back to back, first at library offset 3827
```

The protection key is hidden in plain sight: **the high 16-bit word of the first directory entry's offset** — a 32-bit field whose real value (3827) never needs the high word. Here it is `0xec70`. The runtime reads it at code offset 0x14471, zeroes it in memory (0x145c6), multiplies by `0x7cf7` with the 32-bit multiply helper at `0:0xba` (0x145d3–0x145df) and hands the product to the table builder. (Code offsets are code-segment offsets; file offset = 0x1200 + code offset.)

## 3. The cipher (GRASPRT 4.00d, from the disassembly)

| code offset | what it does |
|---|---|
| `0x1224a` (386) / `0x12274` (8086, bit-identical) | PRNG: `x = state & 0x7fffffff; x ^= x >> 13; x = (x ^ (x << 18)) & 0xffffffff; state = x; return x & 0xffff` — a 31-bit xorshift |
| `0x16024` | `perm = [0..255]; for i in 0..255: swap(perm[i], perm[rng() & 0xff])` with the PRNG seeded `key * 0x7cf7` (state at `ds:0x219e`) |
| `0x16087` | `inverse[perm[i]] = i` |
| `0xc003` / `0xc037` | DOS `INT 21h/3Fh` read wrapper: if the handle equals the library handle (`ds:0x1635`) and the table pointer (`ds:0x1633`) is set, every byte read is replaced by `table[byte]` (an `xlat` loop) |

So every byte of every member — **including the 4-byte length prefixes** — is `cipher = perm[plain]`, a single fixed byte substitution per library. There is no position dependence, no chaining and no per-member key; the only secret is the 16-bit word, i.e. 65,536 possible tables. For key `0xec70`: `perm[0x00] = 0x43`, `perm[0x3b] (';') = 0x00`, `perm[0x20] (' ') = 0x42`. The length prefixes give an immediate oracle: decoding them with the right table makes every member's length land exactly on the next directory offset — **224 of 224 are consistent** (`tools/grasp_gl_cipher.py info`).

This is why the earlier byte-operation searches (XOR/ADD/ROL, 1–3 op chains) were negative: a seeded permutation is not expressible as a short arithmetic op, but it is trivially invertible once the generator is read out of the runtime.

## 4. What is in the library (224 members, 2,092,397 bytes decoded)

| type | count | bytes | notes |
|---|---:|---:|---|
| `.txt` GRASP scripts | 29 | 156,545 | the whole press-kit program (`asintro.txt` entry, `menu.txt`, `about.txt`, `bio.txt`, `doss.txt`, `movie1/2.txt`, `titles.txt`, `snkrc1–12.txt`, `pnotes1.txt`, `prodtxt.txt`, `boxdrw.txt`, `ccf.txt`, `x1–4.txt`, `biotxt.txt`) |
| `.pic` Pictor/PCPaint pictures | 82 | 1,306,892 | all start with the Pictor magic `34 12` |
| `.clp` Pictor clippings | 65 | 551,769 | magic `34 12` |
| `.pal` palettes | 8 | 792 | magic `34 12` |
| `.prn` production notes | 35 | 62,361 | plain text: "SNEAKERS — Production Notes", cast/crew bios |
| `.set` font/char sets | 3 | 13,701 | |
| `.grp` | 2 | 337 | `int5rtn.grp` (66 B) and `harderr.grp` (271 B): tiny x86 routines loaded with GRASP `load`/`@name` (INT 5 print-screen off, critical-error handler). **Never executed here.** |

Pinned member digests (decoded bytes): `asintro.txt` 10,153 B `4184e79efdf783e8ebd1fb4bc57cd16cb7287b42ffe67cfa1d043de2d1ed9b68`; `menu.pic` 499 B `c54019c782a015be4a1805e9dc04e8b722ba5762656365e3058ed88998f794de`; `titl01.pic` 11,067 B `1a225ff268543c888c80be04544902c318b650ddaec5ce788bddad6aab158bc5`; `doss.txt` 19,697 B `ce4df1262920b15fa3b4e764ce7ef11c928e8052f66986bc8f559d5634f2e941`; `int5rtn.grp` 66 B `eceb85f8daa8783e48af6d66f65197542d895ee5242d2c97d88e27d57a1de8cb`. Aggregate SHA-256 over `name:sha256\n` for all 224 members in directory order: **`22cd34f6b71f2c238e611fc1a1a672ce97b034a882d1275df24d42e55a28ee6b`** (checked by `tests/test_grasp_gl_cipher.py`).

### 4.1 The script itself: three passwords, all anagrams

`asintro.txt` opens `; Universal Pictures' Sneakers / ; Computer Press Kit`, checks `ifvideo m videok` (VGA) and `ifmem 512000 memok`, loads `int5rtn`, and then stages the film's login scene. The password prompt (`getstr 12,13,16,"str"`) accepts exactly three strings and sets a `global access` level:

| password | level | script reaction |
|---|:-:|---|
| `SETEC ASTRONOMY` | 1 | "That's it. We're in!" (and the sidekick nags you to type it if you stall: "What are you waiting for? Type in SETEC ASTRONOMY or they'll kick us both out!") |
| `NECESSARY MOTTO` | 2 | "ACCESS GRANTED TO SECURITY LEVEL #2" |
| `STORY NOTES CAME` | 3 | "Hey! That's the master password! The following are some of the computer screens that were created exclusively for SNEAKERS!" → `link movie1` |

All three are anagrams of each other — and of the film's reveal, `TOO MANY SECRETS` (sorted letters `ACEEMNOORSSTTY` in every case). `menu.txt` later gates the menu buttons on `@access` (`if @access==1 … cload facegts2`, `if @access==3&&@first==1`, `if @access<=1`), so the "security level" decides which press-kit sections and screens are available. Wrong input twice gives "PASSWORD INCORRECT / ACCESS DENIED...". None of this was obtainable before the library cipher was solved; it is reproduced here from the decoded script text only.

Command frequency over the 29 scripts (first token per non-comment line): `text` 250, `global` 236, `if` 182, `endif` 168, `goto` 155, `set` 152, `color` 144, `return` 96, `waitkey` 95, `local` 81, `databegin` 67, `cload` 55, `mark`/`loop` 54, `putline` 51, `putup` 50, `pload` 38, `cfade` 37, `pfade` 31, `link` 24 — a typical GRASP 4 slideshow/menu program.

## 5. Tooling (all static)

* **`tools/grasp_gl_cipher.py`** — `info | manifest | extract <lib> [--offset N]` and `table <keyword>`; parses an MZ file or a bare `.GL`, derives the table, verifies length consistency, writes members plus `MANIFEST.json`. Tests: `tests/test_grasp_gl_cipher.py` (table pairs read from the runtime, xorshift path, directory/key, member digests, aggregate).
* **Kitchen ops** (`public/apps/cyberchef/index.html`, category *EXE Protection*): `graspGlTable` (table / encrypt / decrypt for any 16-bit key word) and `graspGlDirectory` (parse an MZ-bound or bare GL, list members with the consistency oracle, extract one member as text/hex/binstr). Three `RECIPE_PACKS` entries "Sneakers 1992 — …" preload them. Tests: `tests/sneakers-grasp-cyberchef.test.mjs` — it runs the *real* `SNEAKERS.EXE` bytes through the browser code and asserts the same digests as the Python tool. Registry 519 → **521** operations (cookbook, SFX and sync tests updated; `cyberchef-merged` and `cyberchef.xdc` rebuilt).
* **`tools/xena_binary_archive.py`** — see §6.

## 6. The Xena archive

Xena is the National Archives of Australia's GPL preservation normaliser (`srnsw/xena`, last master `03784b6574e8c6beab9b5604b8a0f7145015663d`, 2011-06-29). It is Java + Ant and is not built here; the **format** is reproduced from its sources (`kernel/metadatawrapper/DefaultWrapper.java`, `kernel/normalise/BinaryToXenaBinaryNormaliser.java`, `plugins/basic/doc/xena/plugin/basic/binary_schema.html`, `plugins/example/example_file1.foo_Binary.xena`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xena><meta_data>
  <meta_data_wrapper_name>Default Package Wrapper</meta_data_wrapper_name>
  <normaliser_name>au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser</normaliser_name>
  <input_source_uri>grasp-gl:SNEAKERS.EXE!/asintro.txt</input_source_uri>
  <html5_provenance>…container, gl_offset, gl_key_word, cipher…</html5_provenance>
</meta_data><content>
  <binary-object:binary-object xmlns:binary-object="http://preservation.naa.gov.au/binary-object/1.0"
      binary-object:description="The following data is a MIME-compliant (RFC 2045) PEM base64 (RFC 1421) representation of the original file contents.">
  …76-column Base64…
  </binary-object:binary-object>
</content></xena>
```

`python3 tools/xena_binary_archive.py sneakers --out DIR` writes **227 packages** (the ZIP, both EXEs, all 224 GL members; 11 MB) plus `MANIFEST.json`, deterministically (no timestamps) — aggregate SHA-256 over `name:sha256\n` = `f9bc7e14263f5088b2b7b178f956c035eb83b6dc74e8e01b524511dd598451d0`. `verify DIR` re-decodes every package and prints length + digest; `unwrap` restores the originals.

Committed (bounded evidence): `docs/xena/sneakers-grasp/MANIFEST.json` (all 227 names, lengths, content digests and `.xena` digests) and the 29 GRASP **script** packages under `docs/xena/sneakers-grasp/gl/` (356 KB). The pictures, production notes and executables are regenerated byte-identically from the ZIP already in the repository; the full tree goes to the Drive backup. `tests/test_xena_binary_archive.py` round-trips the upstream Xena sample, checks the element vocabulary, and rebuilds the archive to compare against the committed manifest and packages.

### What about GRASP 4.x itself?

The user's pointer, archive.org `Grasp_Animation`, holds only `GV.zip` (4,575,882 B, MD5 `95fe5ad446a98768e124b28c1a1f4962`, SHA-1 `ca9cc04ae711f4e4ef4132a022840049895c7dd9`) — the GRASP *viewer* and examples, not the 4.x authoring package — and the sandbox cannot reach archive.org anyway. No GRASP/Pictor source exists on GitHub. The GRASPRT 4.00d runtime embedded in `SNEAKERS.EXE` is therefore the only 4.x executable we hold, and it is now (a) pinned, (b) documented at the instruction level for the library path, and (c) wrapped as `SNEAKERS.EXE_Binary.xena` in the generated archive. If a GRASP 4.00 distribution disk image is supplied later, `tools/xena_binary_archive.py wrap` packages it the same way and `tools/grasp_gl_cipher.py` will read any protected `.GL` it contains.

## 7. Limits

* The `.grp` members are machine code and the `.pic/.clp` pictures are Pictor-compressed; neither was rendered or executed. The press-kit text is Universal's 1992 promotional material; only the engineering artefacts (scripts) are committed in decoded form.
* The permutation is per-library, not per-runtime: another GRASPRT 4.00d title with a different key word uses a different table but the same generator; `graspGlTable` accepts any key.
* Key word `0` would give the identity permutation only if the runtime also skipped the table (it checks the directory word, 0x14471); not exercised, because no such library is at hand.
