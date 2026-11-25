# OpenRCE ISO, Kr0meCorp riddle, and the Intelligence Lecture Hall

**Checked:** 2026-11-01  
**Question:** Is there a new `openrce.iso` or Kr0meCorp-riddle finding that should update the cipher-machine suite's Intelligence Lecture Hall?

## Finding

There is a **real RCE CD ISO** in the Internet Archive, but the exact filename is **`ReverseCodeEngineeringRceCdsandman2000.iso`**, not `openrce.iso`. The Archive.org record calls it *Reverse Code Engineering RCE CD +sandman 2000*, credits +sandman, dates the CD to 2000, and describes it as 50+ web pages for reverse-engineering newcomers from roughly 1999–2000. Its published metadata lists 712,343,552 bytes, SHA-1 `b12b847879f5ac22d830be9085f1a98ffe08b99c`, and a filecount of 14,633. Archive.org says it is a user-contributed item and marks the uploaded CD as checked for malware; that is not a substitute for our own inspection.

This is **not evidence that the disc is from OpenRCE.org**: the site says OpenRCE launched in 2005, while the CD is a 2000 +sandman/newbies-forum compilation. Nor did I find evidence that the CD contains the Kr0meCorp riddle. The image is about 679 MiB; it was not downloaded or mounted in this pass. Therefore the careful status is: **a relevant neighboring archive has been identified; whether its disc contains Kr0meCorp material is unverified.** Do not rename or cite it as `openrce.iso` without a source establishing that alias.

## Kr0meCorp riddle: current source-backed state

The Intelligence Lecture Hall (`Pc[]`) already contains a primary-source Kr0meCorp record with the transcript, capture digest, corrected candidate, and open-case verdict. However, the adjacent Archive Research Monograph (`Wc[]`) still said no primary riddle transcript had surfaced. That stale contradiction is superseded by the already cataloged, SHA-1-gated 1998-12-06 Wayback capture of `members.tripod.com/~retrotech/hidden.html` in `js/krome-catalog.js` and the detailed write-up in `docs/dss-casefiles-riddle-warrick.md`.

The captured page gives the riddle's own instruction—four numbers forming an IP address, with their order supplied by the riddle—then these lines:

> Follow the path of the one who hath her face covered;  
> clothed in white, holding in her left hand, four keys.  
> One is the red Servant, contrary to the King;  
> One is the white Jayre; dying, and recreated;  
> One is the Camelion; something more sublime  
> than the King, the last One; but fugitive.  
> — Kv QW n df

The capture identifier is `19981206004351`; the expected SHA-1 digest in the recovery record is `MMOS2TQI5722PUSYVTROIMSZEYIJH5G4` (base32 form). The surviving evidence supports an **order-corrected alchemical/atomic-number candidate** `47.26.47.80` (silver/Moon, iron/Mars, silver/Moon, mercury), but not a confirmed solution. The older `26.47.79.80` reading is rejected because it puts the King (the comparison figure) into the address and violates the text's ordering hint. Later captures and fan mail did not reveal a posted solution; the case remains **OPEN**, not solved.

The lecture-hall record itself was already current; the stale statement lived in the adjacent Archive Research Monograph pane. The actionable sync is to remove that contradiction and attach the RCE CD as a clearly qualified, separate lead in the hall record—without implying that it contains the riddle or changes any cipher-machine mechanism.

## What changed in this checkout

- Confirmed the Intelligence Lecture Hall record already carries the recovered riddle and corrected but unconfirmed reading.
- Updated the neighboring embedded Archive Research Monograph so it no longer contradicts the capture catalog and dossier.
- Added the RCE CD record as a related but distinct preservation lead, including its filename, archive metadata, hash, date, and unresolved contents status.
- Kept the candidate marked unconfirmed and the riddle case open. No disc image was downloaded, mounted, or executed.

## Sources

- [Internet Archive item — Reverse Code Engineering RCE CD +sandman 2000](https://archive.org/details/ReverseCodeEngineeringRceCdsandman2000)
- [Internet Archive item metadata (file name, size, digests, descriptive fields)](https://archive.org/metadata/ReverseCodeEngineeringRceCdsandman2000)
- [OpenRCE.org](https://www.openrce.org/) — site banner identifies it as a read-only archive and says it launched in 2005.
- [Kr0meCorp research and riddle provenance](dss-casefiles-riddle-warrick.md#1-the-kr0mecorp-riddle-is-real-and-still-open)
- [`js/krome-catalog.js`](../js/krome-catalog.js) — capture timestamp, digest, transcript, reading, and hunt verdict.
- Exact-name searches for `openrce.iso` did not surface a result in this pass; that negative search is not proof that no such file exists elsewhere.
