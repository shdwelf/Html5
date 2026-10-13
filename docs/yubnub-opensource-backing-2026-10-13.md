# Per-command open-source backing audit (2026-10-13)

*For every command in [`../yubnub.html`](../yubnub.html): what proprietary
service backed it, what open-source code on GitHub backs it now, and what
was actually read to decide. Method: `gh repo view` / GitHub raw API for
each candidate repo (stars/push dates as observed 2026-10-13), plus live
endpoint checks noted inline. Companion:
[`yubnub-github-archive-research-2026-10-13.md`](./yubnub-github-archive-research-2026-10-13.md).*

**Result: 32 commands replaced, 3 added, every one of the 97 commands now
carries a `backing:` line in the app (open / api / local / proprietary* /
dead), guarded by `tests/yubnub.test.mjs`.**

---

## 1. Replaced — proprietary endpoint → GitHub open-source backing

| Command | Was | Now | Repo read (2026-10-13) |
| --- | --- | --- | --- |
| `g`, `gg` | google.com/search | **SearXNG** public instance `search.inetol.net/search?q=` | `searxng/searxng` 38,328★, pushed same day. Instance verified live via fetch (no PoW wall, unlike searx.tiekoetter.com which served a Portico proof-of-work — rejected for that reason). Self-host per SearXNG docs; instance list: searx.space. |
| `gim`, `gi` | google.com/search?tbm=isch | **Openverse** `openverse.org/search/image?q=` | `WordPress/openverse` 382★ monorepo, pushed same day. Openly-licensed media only — a real semantic change, noted in-app. |
| `gnews`, `gn`, `gnws` | news.google.com (+RSS) | SearXNG `&categories=news` | as `g`. |
| `gde` | google.de | SearXNG `&language=de` | as `g`. |
| `gfl` | google btnI | DuckDuckGo lucky `?q=%5C…` | `duckduckgo/duckduckgo` is **archived (2022)** — recorded honestly as `api:`, not `open:`. |
| `yt`, `youtube` | youtube.com/results | **Invidious** `inv.nadeko.net/search?q=` | `iv-org/invidious` 25,401★, pushed same day. yewtu.be **rejected** (antibot wall on fetch); nadeko.net verified returning results. Instances rotate — app links api.invidious.io. |
| `gm`, `gmaps`, `gmap` (+ new `osm`) | maps.google.com | **OpenStreetMap** `openstreetmap.org/search?query=` | `openstreetmap/openstreetmap-website` 2,846★ Rails, pushed 2026-10-12. Open data + OSS site. |
| `xe` | xe.com/ucc/convert.cgi | **Frankfurter API** `api.frankfurter.dev/v1/latest?amount=&from=&to=` | Repo **moved**: `hakanensari/frankfurter` → `lineofflight/frankfurter` 1,975★ Ruby. README read (`api.frankfurter.dev`, Docker self-host). **Live-verified**: `amount=100&from=USD&to=EUR` → `{"amount":100.0,"base":"USD","date":"2026-10-12","rates":{"EUR":89.44}}` (ECB reference rates; JSON result instead of a converter page). |
| `stock` | finance.yahoo.com | Stooq CSV `stooq.com/q/l/?s=%s.us&i=d` | Researched Yahoo chart API (unofficial), Tiingo/AlphaVantage (API key) — Stooq is the only keyless endpoint; free **data**, code not OSS, recorded as `api:` not `open:`. |
| `onelook`, `dict` | onelook.com / dictionary.com | **Wiktionary** `en.wiktionary.org/wiki/` | `wikimedia/mediawiki` 5,201★ — Wikipedia/Wiktionary are themselves OSS. |
| `thes` | thesaurus.com | `en.wiktionary.org/wiki/Thesaurus:` | as above. |
| `olrd` | onelook reverse dictionary | Datamuse API `api.datamuse.com/words?ml=` | Free documented API returns JSON; service code not OSS → `api:`. |
| `allmusic` | allmusic.com/search | **MusicBrainz** `musicbrainz.org/search?query=&type=all` | `metabrainz/musicbrainz-server` 1,101★ Perl, pushed same day; open data. |
| `flk`, `fl` | flickr.com/search | **Openverse** | as `gim`. |
| `weather`, `w`, `wu` | weather.com / wunderground.com | **wttr.in** `wttr.in/%s` | `chubin/wttr.in` 30,658★ Go, pushed 2026-09-07; one-line + full forecast pages, self-hostable. |
| `e-f`, `f-e`, `tr` | translate.google.com | **LibreTranslate** `libretranslate.com/?source=&target=&q=` | `LibreTranslate/LibreTranslate` 17,067★, pushed 2026-10-12. Deeplink params **confirmed in source**: `libretranslate/templates/app.js.template` reads `source`/`target`/`q` (found via code search). Canonical API is POST `/translate`; the UI link is the drop-in. |
| `whois` | whois.com | ICANN RDAP `lookup.icann.org/rdap/domain/` | RDAP is the open IETF protocol (RFC 9082) replacing WHOIS port-43 scraping. |
| `froogle`, `gbs` | Google Shopping / Blog Search | SearXNG general | Froogle has been Google Shopping for a decade; Blog Search retired — both recorded dead-proprietary upstream, replaced by `g`'s engine. |

## 2. Already open — endpoint kept, backing recorded

`wp`, `wiki`, `wpde`, `wpms`, new `wd` (Wikimedia/MediaWiki) · `arch`
(Internet Archive) · `rfc` (IETF) · `php` (php/web-php) · `mdn`
(mdn/content, CC-BY-SA) · new `ol` (`internetarchive/openlibrary` 6,746★) ·
`pypi` (pypi/warehouse) · `ddg` (HTML endpoint; OSS repo archived → `api:`).

## 3. Local — server helpers replaced by code in this file

`echo`, `random`, `%`, `strReplace`, `strFind`, `strLength`, `ucase`,
`lcase`, `ifThen`, `ifEmpty`, `explode`, `date`, `switch`, `ls`, `ge`,
`man`, `create`, `url`, `split`, `mash`, `mash2`, `help`. The originals
were closed PHP on jonathanaquino.com (`yubtools/split.php`,
`ifthen.php`, `stringmanip.php`, `yubnub-explode.php`) or yubnub.org
Rails endpoints; semantics were taken from the live man pages (fetched
2026-10-13) and cross-checked against `dohliam/yub`'s client-side
reimplementations. These now run offline — strictly better backing than
either.

## 4. Researched, no open drop-in — kept, flagged `proprietary*`

`am` (Amazon — books covered by new `ol`), `ebay`, `bing`/`y`/`brave`
(company indexes; open alternative is `g`), `imdb`/`letterboxd` (open data
cousin: `wd`), `cnn`/`espn` (headlines via `gn`), `fb`, `gmails`/`gdrive`
(account services from the yub.js audit), `gma`, `/.`, `so` (CC content,
proprietary engine), `gh` (the platform itself), `npm` (registry service;
`npm/cli` is OSS), `groups`, `gs` (open cousin: OpenAlex API), `mw`,
`leo`/`leo2`, `sp`, `ud`, `streetview` (open street imagery — Mapillary /
KartaView — is coordinate-based; no address-text drop-in exists),
`tpb`. Each app `man` page names the open alternative where one exists.

## 5. Dead — kept for history

`deli` (del.icio.us †2017), `tec` (Technorati †2016), `a9`, `gread`
(Google Reader †2013).

## 6. Caveats

Public instances (SearXNG, Invidious, LibreTranslate demo) are community
infrastructure and rotate/break — the repo links in each `backing:` line
are the durable artifact, and SearXNG/Invidious/LibreTranslate/wttr.in are
all self-hostable, which is the point of the exercise. Two semantic
changes to be aware of: Openverse searches openly-licensed media (not the
whole Flickr/Google index), and Frankfurter returns ECB reference-rate
JSON (not xe.com's mid-market converter page).
