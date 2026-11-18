# 2600 / HOPE / Neuron Edition / SnapSafe — public-source software collation

Round 80 follows the requested magazine and software leads without treating a
search hit as a vetted dependency. **This is a sampled, source-linked inventory,
not a complete index of every 2600 article or Hacker Digest.** No full magazine
PDF/EPUB or APK was obtained, redistributed or installed. Scratch downloads and
compiler outputs remain in ignored `.cache/backlog-80/`, not in the app or Git.

## Primary-source trail and coverage

- [2600's public code index](https://www.2600.com/code/) links issues from
  Spring 2004 through Autumn 2026. The issue indices sampled were
  [21:1](https://www.2600.com/code/211/),
  [22:1](https://www.2600.com/code/221/),
  [42:4](https://www.2600.com/code/424/),
  [43:1](https://www.2600.com/code/431/) and
  [43:3](https://www.2600.com/code/433/). An index read is not an article read.
- The official [Winter 2025–2026 table of contents](https://store.2600.com/products/winter-2025-2026)
  explicitly connects SnapSafe, “Neuron Intelligence in Cyber Security
  Software, Part One,” ROS 2, wpUsers.sh and HOPE_16. Their inclusion does not
  establish that all the corresponding software has been tested here.
- The [Hacker Digest volume 42 announcement](https://www.2600.com/content/volume-42-hacker-digest-released)
  describes a compilation of the **2025** issues and official DRM-free PDF/EPUB
  editions. Only the announcement and public TOC/code pages were read, not the
  full digest. Older licensed issues or user-supplied copies remain a source
  gate for a systematic article-by-article catalogue.
- The requested [Shadow Libraries front page](https://shadowlibraries.github.io/)
  yielded only a download-method prompt and an image. It supplied **no usable
  recipe or software provenance**; nothing was imported from it.

## Software inventory and disposition

“Reviewed” below means the named listing or source files, not a complete audit.
Public availability is not a blanket redistribution licence.

| Issue / source | Software or listing | Review / build result | Reuse decision |
| --- | --- | --- | --- |
| 21:1, Spring 2004, [issue index](https://www.2600.com/code/211/) | Perl/CGI AIM loggers, provider-IP scripts, Pascal `avs.pas`, VBS and login-form examples | Index metadata only; no builds or execution | Historical catalogue leads, not active tools; obtain licence and review each source before importing |
| 22:1, Spring 2005, Redbird, [Magnetic Stripe Reading](https://www.2600.com/code/221/) | [`dab.c`](https://www.2600.com/code/221/dab.c) (Aiken biphase), `dmsb.c` | `dab.c` source read; MIT notice; requires libsndfile/OSS-era audio interfaces. No build or card/device run | Keep as a historical signal-decoding lead. Bounds checks in the sample-processing loops need review before use; no real card data was collected |
| 42:4, Gazza, [Without Further Ado, ROS 2](https://www.2600.com/code/424/) | [`commands1`](https://www.2600.com/code/424/commands1), `commands2`, [`doom.yaml`](https://www.2600.com/code/424/doom.yaml), `stella_vslam` | Read first command listing and camera configuration; no ROS/SLAM build | Robotics/vision dependency and dataset gate, not a cryptography recipe. Source command is an unpinned clone; pin upstream and verify the camera model before a build |
| 42:4, Greg “Dial Tone” Norcie | [`wpUsers-code`](https://www.2600.com/code/424/wpUsers-code) | Read the short Bash/curl/jq pipeline; no requests to third-party WordPress sites | Defensive exposure-review lead only, on owned/authorized sites; not silently added to an offline kitchen |
| 43:1, [issue index](https://www.2600.com/code/431/) | Historical/malware-related examples | Index/source triage only; not executed | Do not indiscriminately compile or run magazine code; keep execution separate from bibliographic discovery |
| 43:3, H, Writing Software in Machine Code From Scratch | [`code1`](https://www.2600.com/code/433/code1) (NASM DOS COM) and [`code2`](https://www.2600.com/code/433/code2) (Python byte writer) | **Assembled and byte-compared successfully**, details below; DOS program not executed | Existing static byte/hexdump operations composed into a source-labelled recipe. Full listings/binaries not shipped |
| 43:3, russellnomer, The Code Wall: Binary Propaganda on a Parking Garage | [`python`](https://www.2600.com/code/433/python) | Public seven-byte binary example independently decoded to `INSPIRE`; the text extractor flattened the Python formatting, so no upstream Python compilation claim | Existing `fromBinary` operation gets a tested, source-labelled pack |
| 43:3, steganolock | [`encrypt-dot-bat`](https://www.2600.com/code/433/encrypt-dot-bat), related decrypt/batch listings | Encrypt listing read; Windows/PowerShell/7-Zip not run | Do not adopt as a safe default: it uses `-sdel`, can proceed without a password, passes a password on the command line, and appends an archive to a host file. No new encryption/security promise |
| 43:3, Torvald Johnson; other index entries | BizHawk Lua/N64 experiment, sudo and client-side-validation examples | Index only, not full code review or execution | Emulator/platform and safe-lab gates; no network probing or privilege changes |
| Winter 2025–2026 TOC / linked project | YAWNING-TITAN Neuron Edition | Canonical README and fake-server source read; no full install or biological run | Track separately from the GitHub upstream simulator; see below |
| Winter 2025–2026 TOC / linked project | SnapSafe Android v4.2.0 | Pinned release/source and SECV format review; no Android build, install or forensic validation | Bounded **passive format inspector**, not a decryptor or security endorsement |

## Actual historical build: 31-byte DOS Hello World

The two public 43:3 listings were transcribed into local scratch files from the
fetched text. They are not claimed to be byte-identical raw HTTP downloads
(comments/line endings are not a source-signature check). No full source was
vendored because no explicit licence was found on those short listing pages.

Environment: Linux x86-64; CPython 3.11.2; the scratch
`nasm-runtime-linux-x64@3.2.0` package supplies **NASM/NDISASM 3.02**, compiled
September 29, 2026. The npm wrapper version and assembler version differ.
The package was unpacked without installation hooks, its manifest/NOTICE were
inspected, and its tools were invoked directly; no project dependency changed.
The wrapper is Apache-2.0 and its NOTICE retains NASM's BSD terms.

Package tarball SHA-256:

`79bfe2c575c385ce6d927d699bbd4d2050bbd2bee30998415d8ddece93e16c54`

Commands, inside the scratch directory after obtaining/reviewing the listings:

```sh
./nasm/package/bin/nasm -Wall -w-reloc-abs-word -Werror -f bin \
  433-code1.asm -o hello-assembled.com
python3 -I -S -m py_compile 433-code2.py
python3 -I -S 433-code2.py
cmp hello-assembled.com hello-manual.com
./nasm/package/bin/ndisasm -b 16 -o 0x100 hello-assembled.com
```

NASM's initial strict run rejected its `reloc-abs-word` warning at `mov dx,
hello`. The final command disables **only that warning** for this fixed-ORG
16-bit COM example; all other enabled warnings remain errors. Both methods then
produced **31 identical bytes**, SHA-256:

`d9f17e47afc1c6b1dca6ec9cf156ddfc83ad76d3e0daa37639aebb6ad79146cd`

Static disassembly confirms the initial DOS print-string/exit instructions and
message pointer `0x110`. The Python program was syntax-compiled and run only as
a reviewed binary-file writer in scratch. The resulting **DOS COM executable
was not run**; no emulator/runtime success is claimed. The Kitchen test contains
only the tiny diagnostic byte fixture and inspects it, never executing it.

## YAWNING-TITAN: distinguish simulation from biological evidence

Canonical requested project:
[YAWNING-TITAN_Neuron-Edition](https://git.logicalhacking.com/BiologicalAI/YAWNING-TITAN_Neuron-Edition),
pinned review at `a1ff0e2b5270a7e163f811118211691a012ac0d1`:

- Its [README](https://git.logicalhacking.com/BiologicalAI/YAWNING-TITAN_Neuron-Edition/raw/commit/a1ff0e2b5270a7e163f811118211691a012ac0d1/README.md)
  states MIT licensing and the Python 3.8/3.9/container workflow. The productive
  neuron server requires Cortical Labs' backend and the environment-specific
  `cl` package. Neither is available or substituted here.
- The actual stub is
  [`NeuronServer/neuron_fake_server.py`](https://git.logicalhacking.com/BiologicalAI/YAWNING-TITAN_Neuron-Edition/raw/commit/a1ff0e2b5270a7e163f811118211691a012ac0d1/NeuronServer/neuron_fake_server.py),
  not a lowercase `neuron_server/` path. It emits random channels and elapsed
  timestamps packed as little-endian `<QB` records (9 bytes). Its comment says
  UDP, but the implementation uses `SOCK_STREAM`/TCP and binds `0.0.0.0`.
  There is no authentication/framing-length negotiation in that stub. It was
  **not started**, and no public neuron service was exposed.
- For any later transport test, restrict it to a local isolated environment,
  account for partial/coalesced TCP reads, record seed/timing/protocol versions,
  and label outcomes **simulated**. Random spikes cannot demonstrate biological
  learning or effectiveness of a cyber-defence policy.
- The GitHub [upstream simulator](https://github.com/dstl/YAWNING-TITAN/tree/db25f45309dd37f61c157283fa459151a2afa465)
  was separately inspected at `db25f45309dd37f61c157283fa459151a2afa465`.
  Its `pyproject.toml` requires Python `>=3.8,<3.11` and legacy pinned Gym,
  stable-baselines3, Torch and Django dependencies. This session's Python 3.11
  is not a supported full-install environment. No dependency-stack migration,
  simulator build or training run was attempted.

## SnapSafe v4.2.0: verified format facts, not blanket guarantees

[Release v4.2.0](https://github.com/SecureCamera/SecureCameraAndroid/releases/tag/v4.2.0)
was published October 8, 2026; the tag resolves to
`826bf51357c8ca81bad9e81c045107fd6671e633`. GitHub reports these asset digests:

| Release asset | Published SHA-256 (not locally verified) |
| --- | --- |
| `app-full-release.apk` | `1ed8c3f81a967545534144b9aca0bc799340e6dff93c67e150224aabcc534f67` |
| `app-oss-release.apk` | `c908b13326c251e65db835dd9c60dbdeb4311b56e428f4b4611c847968951b99` |

Neither APK was downloaded; these hashes are **API metadata**, not local
hashing, Android signing-certificate verification or a reproducible-build result.
The source repository's MIT licence was read.

Read at the pinned commit: `docs/Video Encryption.md`,
`SecvFileFormat.kt`, `ChunkedStreamingEncryptor.kt`,
`ChunkedStreamingDecryptor.kt`, `StreamingEncryptionScheme.kt` and
`VideoEncryptionHelper.kt` under
[`security/streaming`](https://github.com/SecureCamera/SecureCameraAndroid/tree/826bf51357c8ca81bad9e81c045107fd6671e633/app/src/main/kotlin/com/darkrockstudios/app/securecamera/security/streaming).

SECV v1 has a 64-byte little-endian header:

| Offset | Width | Field |
| ---: | ---: | --- |
| 0 | 4 | ASCII `SECV` |
| 4 | 2 | Version = 1 |
| 6 | 4 | Plaintext chunk size; default 1,048,576 bytes |
| 10 | 8 | Total chunks |
| 18 | 8 | Original plaintext size |
| 26 | 4 | Final chunk plaintext size |
| 30 | 34 | Reserved, normally zero |

Each chunk is a 12-byte random IV, ciphertext of the same length as plaintext,
and a 16-byte GCM tag. Full chunk `i` starts at `64 + i × (chunk_size + 28)`;
expected file length is `64 + original_size + 28 × total_chunks`.

Important limits from **source review**:

1. The [video document](https://github.com/SecureCamera/SecureCameraAndroid/blob/826bf51357c8ca81bad9e81c045107fd6671e633/docs/Video%20Encryption.md)
   and helper explicitly describe a temporary **unencrypted MP4** during
   CameraX recording, followed by encryption and deletion. The
   [security page's](https://snapsafe.org/security.html) “never unencrypted”
   photo/thumbnail claims must **not** be generalized to video. App-private
   storage/FBE is not equivalent to proving that plaintext never existed or
   that flash blocks were physically erased.
2. The reviewed encrypt/decrypt paths call AES-GCM without `updateAAD`; the
   header and chunk index are not explicitly supplied as associated data in
   those methods. This is a reason to investigate whole-file integrity,
   header tampering, truncation and equal-size chunk reordering in an upstream
   test harness. It is not a demonstrated exploit or a complete app audit.
3. The documentation labels size fields unsigned; Kotlin reads `Int`/`Long`.
   The new passive parser conservatively accepts only positive/nonnegative
   signed size/offset ranges, checks chunk arithmetic, and uses BigInt for
   exact large values. It does not mirror permissive source-reader behaviour
   as a claim of validity.
4. No Android SDK, device/TEE, forensic image, key-management audit, panic-PIN
   test or secure-deletion experiment was available. JDK/Kotlin binary download
   attempts were blocked at GitHub's release-asset redirect host. No APK build
   is claimed. Legal compulsion rules vary by jurisdiction and facts; the
   marketing page's categorical US-PIN statement is not legal advice.

## HOPE_16 leads

The requested [HOPE_16 site](https://xvi.hope.net/) is a **historical 2025**
conference, August 15–17, not an upcoming event. Only public programme abstracts
were consulted, not every talk or recording. Relevant
[talk abstracts](https://xvi.hope.net/talks.html) include ARTS/reproducible
science, Bitpart/Signal threat modelling, Cyd's user-controlled data tools, and
privacy/decentralization discussions. These are discovery leads, not software
validation. No Signal accounts, browser profiles or private user data were
connected to a demo. A later pass should follow the speakers' actual repositories
and licences, pin commits, and test benign local fixtures before proposing ports.

## Kitchen deliverables and reproducible limits

Canonical source remains `public/apps/cyberchef/index.html`; the existing
AST-based merge tool was inspected, not rerun against a missing sibling checkout.
The Kitchen now has **524 operations** and three additional source-labelled packs:

- **2600 — Code Wall binary to UTF-8 (43:3)**: existing `fromBinary`; the
  seven groups in the public listing decode exactly to `INSPIRE`.
- **2600 — DOS Hello World bytes (43:3, hex to static hexdump)**: existing
  `fromHexdump` in raw-byte-string mode → `toHexdump`. Input is **spaced hex
  bytes or a conventional hexdump**, not a contiguous hex string. Tested for
  byte-exact round trip; does not execute instructions.
- **2600 — SnapSafe SECV v1 header (42:4, passive only)**: new `snapSafeSecv`.
  Default input is exactly 64 bytes of plain hex (whitespace permitted).
  Small-file mode accepts at most 1 MiB and checks only the structural length.
  No decryption, GCM authentication, PIN guessing, remote request or erasure
  proof occurs. Counts/offsets beyond JS's safe-integer range are decimal
  strings. Empty files, exact-full final chunks, malformed headers, unknown
  versions, length mismatches, signed overflows and oversize input are tested.

A structurally plausible file filled with fake tag bytes is deliberately accepted
as **layout-only**, with `authentication_verified: false`; a matching length is
never sold as cryptographic verification. The pre-existing AES `gf256` Kitchen
operation also now labels the inverse of zero undefined.

Verification commands and final suite results are recorded in
[round 80](backlog-execution-round-80-2026-11-17.md). Follow-up work remains
source/licence acquisition, safe platform-specific builds, Android/biological
hardware, and broader historical-issue coverage—not an unchecked “compile all”
queue or a production wallet/security endorsement.
