# Rodger Ramrod — HTML5 App (browser DOSBox)

> **Register:** src-62 · **Original:** https://bashupload.app/2tv852.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 wrapper (software preservation)

A single-file HTML5 app that loads the **eXoDOS** package for a 1996 MS-DOS title from the
Internet Archive into a browser DOSBox runtime, extracts it locally, and boots the original
launcher.

## Metadata as presented

| Field | Value |
|---|---|
| Title | Rodger Ramrod |
| Release | 1996 · MS-DOS |
| Publisher | Nonaz Inc. |
| Rating | Mature / adult |
| Source | eXoDOS ZIP (Internet Archive) |
| Launcher | `RRR.BAT` |

The page is age-gated: "I confirm I am 18 or older. This DOS title carries an adult content
rating and not intended for minors."

## Conversion path (as documented on the page)

1. LOAD js-dos 6.22 runtime
2. FETCH eXoDOS Rodger Ramrod package
3. EXTRACT `/rodger` directory into the browser DOS drive
4. `EXEC RRR.BAT` → `STKRUN MAIN.EXE`

## Package manifest

| File | Size | Role |
|---|---|---|
| `rodger/RRR.BAT` | 29 B | Launch batch file |
| `rodger/STKRUN.EXE` | 39 KB | Runtime loader |
| `rodger/MAIN.EXE` | 642 KB | Main executable |
| `rodger/RRR.DAT` | 22.2 MB | Primary game data |
| `rodger/READ.ME` | 8.9 KB | License and adult-restriction notice |
| `rodger/*.DWM` | 95 KB | Music assets |

"This app does not alter the DOS binaries. It loads the remote ZIP, extracts these files into
the emulated drive, and starts the original batch launcher."

## Controls

Launch HTML5 App · **Download App (Quine)** · Fallback Embed · Fullscreen · Reset.

## Editorial note

Cited as a preservation artifact, not as content. The wrapper is the work described here: a
browser DOSBox harness that streams an already-public Internet Archive package and runs it
unmodified. The 1996 title itself is neither reproduced nor described beyond the metadata the
page prints.
