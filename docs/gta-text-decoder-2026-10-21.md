# GTA text decoder (asc()+1) — 21 Oct 2026

**Request:** “Create grand theft auto decoder — its asc()+1, the ASCII character
number plus one.” Deliverable: a CyberChef-lab codec operation that reverses the
trivial Grand Theft Auto text obfuscation in which **every stored byte is the
character's code plus one** (BASIC: `asc(c)+1`), so decoding is `chr$(asc(c)-1)`
per byte.

Op: `gtaText` — **GTA Text (asc+1)**, category *Text*, in
`public/apps/cyberchef/index.html`. Recipe pack: **“Retro Text — GTA asc+1 Codec”**.
Tests: `tests/cyberchef-round5-ops.test.mjs` (“gtaText decodes the asc()+1 form…”).

## 1. Codec spec

| Direction | Rule |
| --- | --- |
| **Decode** | for each input character: `chr(ord(c) − 1)` |
| **Encode** | for each input character: `chr(ord(c) + 1)` |

Arithmetic is byte-wise **mod 256** (Latin-1 semantics): encoded byte `0x01` decodes
to NUL, `0x21` (`!`) decodes to space, and a decoded `0xFF` came from `0x00`.
Both directions are total functions over byte strings, so `decode(encode(x)) == x`
for every byte string (pinned in tests).

## 2. Pinned pairs

| Plain | Encoded (stored) | Note |
| --- | --- | --- |
| `GOURANGA` | `HPVSBOHB` | the famous GTA-1 cheat word (G→H, O→P, U→V, R→S, A→B, N→O) |
| `GRAND THEFT AUTO` | `HSBOE!UIFGU!BVUP` | note `space(0x20) → !(0x21)` |
| ` ` (space) | `!` | edge case |
| `The quick brown fox; 0123456789 [brackets] {braces}` | (round-trip) | arbitrary printable sample |

## 3. Provenance & honest labelling

- The **algorithm is requester-specified** (this conversation): “its asc()+1, the
  ASCII character number plus one”. The implementation and tests pin exactly that
  rule; round-trip and the pairs above are verified in
  `tests/cyberchef-round5-ops.test.mjs` (8/8 suite green with the round-5 ops).
- For contrast, the *other* well-documented GTA text container — the **GXT** family
  used from GTA 2 through IV — is a different format (fixed 16-bit wide chars with
  game-specific character tables; see the [gxter](https://github.com/slashdevslashurandom/gxter)
  format description). This op is **not** a GXT parser; it is the per-byte `asc+1`
  codec as specified. If a specific GTA asset's strings are `asc()+1`-wrapped
  (mission text, .CMP/.SCR resources, etc.), feed them straight to `gtaText`.
- No external data files were used; the op has no network or vendor dependencies.

## 4. Usage

Recipe: **Retro Text — GTA asc+1 Codec** (`gtaText`, default `Decode (asc-1)`),
or call directly: `OPERATIONS.find(o => o.id === 'gtaText').run(storedText,
{ mode: 'decode' })`. Encode mode is the exact inverse for authoring/round-trips.
