# CTFtime date cross-reference: UCSB iCTF, Shellphish and Null Space Labs

**Reviewed 2026-11-13.** “Shellfish” in the request is checked against the CTF team **Shellphish**. This compares CTFtime's **event listings and team scoreboards** with a separately published, dated 2006 `#ictf` client log. It is not a recovered EFnet `#nsl` conversation, a claim that similarly named nicks are one person, or a copy of the third-party log. Dates in the CTFtime tables below are **the site's displayed UTC event windows**, not independently verified actual play times; the IRC logger's timezone is **not stated**.

## Date-match result: the 2006 listing conflicts with the log

| Source | Dated observation | What it supports / does not support |
| --- | --- | --- |
| [Pinned 2006 `#ictf` client log](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L1-L16) | Its first session header is **Fri 8 Dec 2006, 14:04:25**; a channel notice identifies `#ictf` and the topic “international CTF 2006” ([lines 10–13](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L10-L13)). The last session header closes **Sat 9 Dec 2006, 03:11:06** ([line 1516](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L1516)). | These are **logger-clock session bounds**, with breaks, not a contest start/end or UTC timestamps. The log discusses the game beginning on Dec 8 ([lines 92–93](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L92-L93), [lines 378–398](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L378-L398)). |
| [UCSB's 2006 iCTF archive](https://ictf.cs.ucsb.edu/archive/ictf_2006.html) and [CTFtime's UCSB iCTF series](https://ctftime.org/ctf/5/) | UCSB calls the December 2006 edition **The Hillbilly Bank** and reports **25 teams**. The series credits Giovanni Vigna/UCSB together with **Shellphish** as iCTF organizers. | Identifies the edition and the correct spelling of Shellphish. The [individual 2006 CTFtime event page](https://ctftime.org/event/81) does **not** supply an event-specific Shellphish organizer field. |
| [CTFtime UCSB iCTF 2006](https://ctftime.org/event/81) | Displays **Fri 1 Dec 2006 00:00 UTC → the identical instant**, with a **20-team** scoreboard. Its [calendar export](https://ctftime.org/event/81.ics) repeats the same zero-length interval. | **Does not date-match** the Dec 8–9 log and is not a credible contest duration. Treat this as placeholder-like/incomplete metadata, **not** as proof the contest happened at midnight on Dec 1. Its 20 scored rows are not a complete census of UCSB's reported 25 teams. |
| [Contemporary Santa Barbara Independent account](https://www.independent.com/2006/12/15/hackers-world-unite/) | Reports that the 2006 UCSB contest **ended Friday, Dec 8** and that **We_0wn_Y0u** won; the same winning team is first on the [CTFtime scoreboard](https://ctftime.org/event/81). A [TU Wien report dated Dec 10](https://www.tuwien.at/en/all-news/news/tu-vienna-takes-victory-in-virtual-bank-heist) independently names the winner and Hillbilly Bank premise. | Corroborates the **edition and Dec 8 event context**, but does not resolve the original logger's timezone or provide a trustworthy exact UTC contest window. The two reports disagree about contest duration, so neither is used to calculate one. |
| [CInsects' retrospective results list](https://cinsects.de/pages/ctf-results.html) | Labels its UCSB iCTF 2006 result **Dec 1–2, 2006**. | Another conflicting date listing, not corroboration of the Dec 8–9 original log. Its reason for differing is unknown; do not silently reconcile it with the contemporary account. |

**Bounded conclusion:** The dated log and contemporary reporting support a **Dec 8, 2006 iCTF event context**, continuing into Dec 9 on the logger's clock. CTFtime's **Dec 1, zero-duration field does not match**; there is no basis here for a minute-accurate UTC contest interval. This matches an *event/edition*, not a person to a team or an IRC channel to a different network.

In that original log, `[solo]ShdwFear` occurs in **nickname rosters** ([lines 121–122](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L121-L122)) and a **quit event** ([line 1502](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L1502)), **not a message spoken by that nick**. `[solo]` is a displayed nick prefix, not proof of a scored team or identity; neither `solo` nor Null Space Labs appears as a row on the [2006 CTFtime scoreboard](https://ctftime.org/event/81). That absence cannot exclude an unscored participant or a nickname in the larger, 25-team edition. The log's [SlashNET ban notices](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L54-L56) and [later `bergman.cs.ucsb.edu` `#ictf` pointer](https://github.com/scy/scytale.name/blob/5b4c5c255d72cca85ea0829b6371b8da9b218e29/files/2006/12/ictf/iCTF-%23ictf.log#L1289) must not be re-labelled EFnet `#nsl` or Freenode, nor taken as a per-session network attestation. Reproducibility: decoded bytes of the pinned log at review had SHA-256 `b1cf8c37cb2ea183823ee034e6732c63bfc2831770182d6d9ed69bf1169fd3cd`.

## UCSB/Shellphish iCTF events during the NSL CTF team's listed years

[Shellphish's CTFtime profile](https://ctftime.org/team/285/) explicitly lists the following as **organized** events; their individual pages give these displayed UTC windows. “2014” and “2017” are **edition labels**, not a promise that the calendar year or month matches the label. [UCSB's archive](https://ictf.cs.ucsb.edu/archive/) calls the 2016–2017 edition a delayed March 2017 execution.

| UCSB iCTF event (organizer: Shellphish) | CTFtime-listed UTC window | Date relationship to NSL's listed results |
| --- | --- | --- |
| [UCSB iCTF 2014](https://ctftime.org/event/175) | **10 Apr 2015 15:00 – 11 Apr 2015 00:00** | Label says 2014; occurs before the first NSL CTFtime result listed below. |
| [UCSB iCTF 2015](https://ctftime.org/event/256) | **4 Dec 2015 18:00 – 5 Dec 2015 18:00** | Metadata overlaps [SECCON 2015](https://ctftime.org/event/274) from Dec 5 06:00–18:00 UTC, but they are **different events**. A comment on the iCTF page says its duration was changed from 24 to 8 hours; the listed overlap need not reflect simultaneous actual play. |
| [UCSB iCTF 2017](https://ctftime.org/event/367) | **3 Mar 2017 17:00 – 4 Mar 2017 17:00** | Not the [Dec 9–10 SECCON 2017](https://ctftime.org/event/512) entry. |
| [UCSB iCTF 2018](https://ctftime.org/event/567) | **16 Mar 2018 15:00 – 17 Mar 2018 00:00** | Not the [January 2018 Insomni'hack teaser](https://ctftime.org/event/545). |
| [UCSB iCTF 2019](https://ctftime.org/event/747) | **15 Mar 2019 17:00 – 16 Mar 2019 01:00** | Not the March 23–25 or June 2019 results below. |

The [Null Space Labs CTFtime team profile](https://ctftime.org/team/17375) **does not list a UCSB iCTF result** in these years. This describes the published team's record, not all possible sign-ups or individuals. In particular, its **HITCON 2015 *qualifier*** result does not imply a place at the December HITCON final or at UCSB's iCTF.

## Null Space Labs CTF team: all 12 listed results (2015–2019)

These 12 rows are the [Null Space Labs team's CTFtime participation history](https://ctftime.org/team/17375), ordered by event date; each event link supplies the listed UTC window. Rank columns are the teams' **CTFtime scoreboard places** (also cross-checked against the [Shellphish team profile](https://ctftime.org/team/285/)), **not** proof of individual attendance, conversation, or affiliation with any IRC nick. Where both ranks are present, the teams have a **shared event scoreboard**, not a UCSB iCTF appearance by NSL.

| CTFtime event | Listed UTC window | NSL place | Shellphish place |
| --- | --- | ---: | ---: |
| [MMA CTF 1st 2015](https://ctftime.org/event/234) | 5 Sep 2015 00:00 – 7 Sep 00:00 | 203 | 2 |
| [Defcamp CTF Qualification 2015](https://ctftime.org/event/239) | 2 Oct 2015 21:00 – 4 Oct 09:00 | 37 | 14 |
| [HITCON CTF 2015 Quals](https://ctftime.org/event/245) | 17 Oct 2015 02:00 – 18 Oct 14:00 | 110 | 2 |
| [9447 Security Society CTF 2015](https://ctftime.org/event/242) | 27 Nov 2015 23:00 – 29 Nov 23:00 | 58 | 115 |
| [SECCON 2015 Online CTF](https://ctftime.org/event/274) | 5 Dec 2015 06:00 – 6 Dec 06:00 | 95 | 7 |
| [BCTF 2016](https://ctftime.org/event/264) | 19 Mar 2016 02:00 – 21 Mar 02:00 | 427 | 3 |
| [PlaidCTF 2016](https://ctftime.org/event/315) | 15 Apr 2016 21:00 – 17 Apr 21:00 | 229 | 13 |
| [SECCON 2017 Online CTF](https://ctftime.org/event/512) | 9 Dec 2017 06:00 – 10 Dec 06:00 | 423 | 6 |
| [Insomni'hack teaser 2018](https://ctftime.org/event/545) | 20 Jan 2018 10:00 – 22 Jan 02:00* | 131 | 34 |
| [0CTF/TCTF 2019 Quals](https://ctftime.org/event/736) | 23 Mar 2019 06:00 – 25 Mar 06:00 | 772 | 15 |
| [Securinets CTF Quals 2019](https://ctftime.org/event/769) | 23 Mar 2019 16:00 – 24 Mar 16:00† | 73 | — |
| [Facebook CTF 2019](https://ctftime.org/event/781) | 1 Jun 2019 00:00 – 3 Jun 00:00 | 290 | 25 |

\* [Insomni'hack's description](https://ctftime.org/event/545) says its header's end date is off and instead specifies **21 Jan 2018 23:00 CET**; the table reproduces the *header*, not a resolved actual finish. † [Securinets' description](https://ctftime.org/event/769) gives a **17:00 UTC start**, differing from its header's **16:00 UTC**. The dash means no corresponding Securinets 2019 result was found in the [reviewed Shellphish CTFtime team history](https://ctftime.org/team/285/); it is **not** an assertion that no Shellphish member was present. The two March 2019 NSL event windows themselves overlap on the calendar, but team-level results do not show which individual played when.

## Keep the three meanings of “NSL” separate

1. [CTFtime `/team/17375`](https://ctftime.org/team/17375) is a **CTF scoreboard team named Null Space Labs**, with published results starting in **2015**, nine years after the `#ictf` log. The [2006 CTFtime event](https://ctftime.org/event/81) has no NSL scoreboard row; neither fact establishes whether any 2006 nickname later used the name.
2. Null Space Labs' [wiki](https://wiki.032.la/) advertises **EFnet `#nsl`**, a **different channel/network evidence question** from the `#ictf` client log and from CTFtime. The [separate `#nsl` review](irc-nsl-shdwfear-shdwdruid-shdwelf-source-check-2026-11-13.md) recovered **no verified target-nick message** there. A shared name alone does not authenticate an IRC-to-CTF-team link.
3. `[solo]ShdwFear` is **roster/quit text in a Dec 2006 `#ictf` log**, not speech, an authenticated identity, or membership in either Shellphish or the later NSL CTFtime team. Likewise, co-listing Shellphish and NSL on a later event scoreboard is **not** evidence that their members spoke to one another.

Only publicly linked event metadata and minimal log provenance are recorded here; no raw IRC transcript or private exports were added. If a rights-cleared private log is obtained later, keep original bytes and any genuinely private conversation in owner-controlled Drive, validate network/channel/timezone and source provenance, and publish only a non-sensitive finding after review.

**Follow-on, separate from the date/identity question:** The [18-event software-artifact inventory and Facebook CTF 2019 static crypto study](ctftime-facebook-2019-software-crypto-2026-11-13.md) distinguishes event task listings from two hash-pinned organizer binaries and publishes bounded CyberChef kitchen vectors. That study makes no additional claim about who took part in, solved, or discussed any task.
