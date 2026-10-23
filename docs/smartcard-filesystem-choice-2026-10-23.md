# T9.1 — smartcard filesystem choice (2026-10-23)

The S9 strand asks which on-card filesystem the virtual reader should
serve. The strand's budget context: the reader side (Lantronix XPort
Pro, docs/lantronix-xportpro-research.md) offers ~4 MB of serial-flash
filestore for the off-card image; the issuer side (S.S.E.-in-a-URL
work, js/quine-sse.js) assumes a hard 2 MB ceiling for what can be
transferred as a sealed URL. An on-card profile therefore has to be
small *and* portable, in that order.

## Candidates

| Candidate | Model | Tooling reality | Verdict |
|---|---|---|---|
| ISO/IEC 7816-4 MF/DF/EF | TLV-free tree: one master file, dedicated files as directories, elementary files (transparent/cyclic) as leaves, 2-byte file IDs, per-file access conditions, SELECT / READ BINARY / UPDATE BINARY / VERIFY | OpenSC and essentially every card middleware speak it; MxNIM/Maxim-era readers already in this repo's research (docs/RESEARCH_SMARTCARD.md) are 7816-4 devices | **Chosen** |
| ZeitControl BasicCard filesystem | "Directory-based, PC-like file system" inside the card OS, driven by ZC-Basic P-Code commands (CLA/INS pairs called like procedures); Professional cards add RSA/ECC and extended APDUs | Vendor SDK is Windows-only (LWN, 2016); behaviour requires executing ZC-Basic — a language runtime, out of scope for the reader exactly as a JVM is (js/cardreader.js header) | Rejected as the format; the 2-byte command-id dispatch shape is borrowed for applet routing |
| JavaCard (applets, no filesystem) | The platform defines no filesystem at all: an applet selected by AID owns persistent objects and answers proprietary INS bytes; some vendors (JCOP lineage) additionally expose a 7816 filesystem beside the applets | The norm in modern deployments, and the reason "the card" is usually a program, not a disk | Borrowed for behaviour (AID-selected applets in cardreader.js); cannot be the storage format because it standardises none |
| FAT12/16 image on-card | Block filesystem in EEPROM | Nothing on a real card serves this; wear and atomicity are wrong for byte-addressable EEPROM; code size alone eats the budget | Rejected |

## Decision

**The card image is an ISO/IEC 7816-4 MF/DF/EF tree; behaviour beyond
file service is AID-selected applets with first-refusal on proprietary
INS bytes.** That is precisely the model `js/cardreader.js` already
implements (tests/cardreader.test.mjs, 6/6): SELECT by file ID and by
AID, PIN-gated UPDATE with sticky lockout, read-only file enforcement,
fail-closed reads. Splitting the choice this way keeps three doors
open at once:

1. **Real cards.** A profile authored against the virtual reader ports
   to physical 7816-4 cards (and to OpenSC tooling) without a format
   translation step.
2. **The XPort budget.** A full example image (MF + two DFs + PIN file
   + applets) is a few hundred bytes of structured data — the entire
   demo FS in the test suite serialises smaller than one QR-borne
   S.S.E. block. The 4 MB constrain
...[truncated 911 chars]