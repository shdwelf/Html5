# Warrick-method recovery, applied to the lost Cicada web layer (T12.1) — 2026-10-23

## The Warrick method
Warrick (Frank McCown & Michael Nelson, Old Dominion University; JCDL 2006,
CACM 2009 "What happens when websites go missing?") reconstructs a lost
website from the *web infrastructure* — the copies other systems already
made. Given a seed URL it:

1. asks web repositories what archived copies (**mementos**) exist — the
   original tool polled the Internet Archive plus Google/MSN/Yahoo caches;
   the current implementation (`oduwsdl/warrick`) discovers mementos via
   **Memento TimeMaps** (RFC 7089), with the Wayback CDX index as the
   stable per-archive fallback;
2. saves the best copy of each resource (original format where possible,
   archive branding stripped);
3. mines recovered HTML for links and recurses — **only into URLs at or
   beneath the seed**;
4. logs every resource as `ORIGINAL URI => MEMENTO URI => LOCAL FILE`,
   with a resume file so a quota-stopped job can continue.

Warrick's own documented limits bound any honest application: it can only
recover what crawlers could see (no robots-blocked, login-walled,
JS/Flash/session-driven or never-crawled pages), never server-side logic,
and the Archive leg lags the live web by months while search caches expire
in days — hence "run it as soon as possible, and re-run over weeks."

## What this repo ships
`js/warrick-plan.js` + `tests/warrick-plan.test.mjs` (4/4): a **plan
builder**, not a fetcher (external fetching in this repo goes through the
fetch-runner/capture channel; the plan is the reviewable artifact first).
For each seed it emits the Memento TimeMap and Wayback CDX discovery
queries, the fetch/link-mining passes, log and resume file conventions,
politeness settings, and the packaging rule — recovered trees are bagged
as **BagIt 1.0 (RFC 8493)** with an original→memento→local→sha256 mapping
table, matching the house preservation format. Unrecoverable seeds are
refused in code: `.onion` (no mementos exist, by design), credentialed
URLs, non-http(s) schemes.

## Application: the Cicada 2012 web layer
The recoverable target class is the **public website that carried the
2012 countdown page** (the page that published the 14 coordinates on
2012-01-09 17:00 UTC; see
`cicada-3301-qr-locations-2026-10-23.md`). A concrete plan:

- seed: the site's root and the countdown/announcement paths, http/https;
- discovery: Wayback CDX (`from=2011&to=2013`, `filter=statuscode:200`,
  `collapse=digest`) and a Memento TimeMap query targeted at
  `20120109170000`;
- passes: fetch captures closest to the target date, mine for in-scope
  links (announcement images and static assets beneath the seed), log
  FAILED lines rather than silently skipping;
- packaging: BagIt bag with capture timestamps preserved as metadata —
  the bag documents *what the public web showed*, which is the
  historical-network pack's evidentiary standard.

Executing the fetch leg is a runner job (the sandbox cannot reach
web.archive.org), and is **not** done here; the plan artifact is the
deliverable, ready to hand to that channel.

## Boundaries (unchanged from the Cicada pack decisions)
- **No puzzle content**: recovery targets the site's public pages as
  historical record — no QR payloads, no solution material, nothing from
  the still-unsolved Liber Primus.
- **No onion recovery**: the puzzle's later stages lived behind onion
  services; those are unrecoverable by design and the planner refuses
  such seeds rather than pretending otherwise.
- **Posters are still gone**: this recovers web captures, not the
  physical layer; every poster row in the pack continues to say so.

## Remaining in T12.1
The cipher-machine Hall-of-Fame lecture material (shared with T10.2) —
an editorial/research artifact, not a tooling one. With this doc, the
Warrick half of T12.1 is closed: method researched, planner built and
tested, Cicada application specified to the point a runner can execute it.
