# Description matching — other GitHub projects that match each command's description (2026-10-13)

*Question asked: “Based on the command description, is there any other
projects matching description?” Answer: yes — searched GitHub by
description text (`in:description`, sorted by stars), verified each
candidate with `gh repo view`, and live-checked endpoints before adding
anything. Method + companions:
[`yubnub-opensource-backing-2026-10-13.md`](./yubnub-opensource-backing-2026-10-13.md),
[`yubnub-github-archive-research-2026-10-13.md`](./yubnub-github-archive-research-2026-10-13.md).*

## 1. Matches for Yubnub's own description — “a (social) command line for the web”

| Project | ★ | Match | Verdict |
| --- | --- | --- | --- |
| [ccheever/bunny1](https://github.com/ccheever/bunny1) | 209 | “lets you write smart bookmarks in python and then share them” — **the original bunny1 source** (Charlie Cheever), missed by the name-only search last round | Added to research lineage (Python, 2022 push — reference, not a service) |
| [sahilng/butlr](https://github.com/sahilng/butlr) | 0 | Literally “Command Line for the Web” | Exact phrase match, zero traction — catalogued, not used |
| [dohliam/yub](https://github.com/dohliam/yub) | 14 | “yub.js - A command-line for the web” | Already imported (4 commands) last round |
| [0x20F/bunny](https://github.com/0x20F/bunny) | 20 | “Smart bookmarking tool. Fast and customizable shortcuts” | bunnylol-family; doc only |
| [ph1losof/flashbang](https://github.com/ph1losof/flashbang) | 59 | “DuckDuckGo-style bang/snap redirector with 14,000+ bangs” (pushed today) | The bang-redirector niche is alive; doc only (our engine is prefix-style) |
| [mozilla/ubiquity](https://github.com/mozilla/ubiquity) | 47 | natural-language web commands | **Archived** (Mozilla GH archive) — historical, as AlternativeTo suggested |
| searx/searx (13,555★) / benbusby/whoogle-search (11,567★) | — | metasearch descriptions matching `g` | SearX is SearXNG's predecessor; **Whoogle is now archived** (checked 2026-10-13) — both noted in `g`'s backing line, neither replaces the verified SearXNG instance |

## 2. Matches per command description

| Command (description) | Matching project found | ★ / status | Action |
| --- | --- | --- | --- |
| `yt` “alternative front-end to YouTube” | [TeamPiped/Piped](https://github.com/TeamPiped/Piped) | 10,283★, pushed 2026-10-10 | **Added `piped`** — `piped.video/results?search_query=` verified live |
| `dict` “free dictionary” | [meetDeveloper/freeDictionaryAPI](https://github.com/meetDeveloper/freeDictionaryAPI) | 3,620★ | **Added `dic`** — `api.dictionaryapi.dev` verified live JSON (data itself sourced from Wiktionary — the open circle closes) |
| `xe` “currency exchange rates API” | [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) | 2,678★, 200+ currencies, no limits | **Added `rates`** — CDN JSON verified live 2026-10-13, and cross-checks Frankfurter (USD→EUR 0.8948 vs ECB 89.44/100 ✓) |
| `olrd` “reverse dictionary” | [thunlp/WantWords](https://github.com/thunlp/WantWords) (THUNLP, Tsinghua) | 7,094★, open-source online reverse dictionary | **Doc/backing only** — wantwords.net UI is form/tab-driven; no GET `%s` endpoint exists to template. Datamuse stays as the API endpoint. |
| `stock` “market data” | [ranaroussi/yfinance](https://github.com/ranaroussi/yfinance) | 25,506★ library | Backing note added (it's a Python library, not an endpoint; Stooq stays) |
| `gm` “geocoding/search on OSM data” | [osm-search/Nominatim](https://github.com/osm-search/Nominatim) 4,516★ · [komoot/photon](https://github.com/komoot/photon) 3,116★ | both pushed this week | Backing note added — these are the engines behind/behind-alternatives-to OSM web search |
| `tr` “offline translation library” | [argosopentech/argos-translate](https://github.com/argosopentech/argos-translate) | 6,560★ | Backing note (LibreTranslate's engine); [thedaviddelta/lingva-translate](https://github.com/thedaviddelta/lingva-translate) 1,850★ (Google Translate front-end, stale 2023) rejected |
| `arch` “self-hosted web archiving” | [ArchiveBox/ArchiveBox](https://github.com/ArchiveBox/ArchiveBox) 28,752★ · [webrecorder/pywb](https://github.com/webrecorder/pywb) 1,708★ · browsertrix-crawler | active | Backing note — the self-host answer to Wayback, tying back to the crawler thread (WebWhacker → ArchiveBox) |
| `wp` “Wikipedia, offline” | [kiwix/kiwix-tools](https://github.com/kiwix/kiwix-tools) (kiwix-serve) 962★ | active | Doc only — self-host tool, no public search endpoint to template |
| `g` “metasearch” | deedy5/ddgs (3,017★ library), Extravi/araa-search (333★ Google metasearch) | — | Doc only — library/tiny instance pool; SearXNG stays |
| Yubnub itself | sahilng/butlr, 0x20F/bunny, oglofus/bangs (Go/WASM bang service), kristianvld/bangs.fast (fully local bangs) | small | Catalogued — the “one keyword router” idea keeps being reinvented at small scale; bunnylol.rs + this app remain the maintained poles |

## 3. What changed in the app

- **100 commands** (was 97): `piped`, `dic`, `rates` added — each
  endpoint live-verified today, each flagged new with its GitHub backing.
- Backing lines enriched for `olrd`, `xe`, `stock`, `arch`, `gm`, `tr`,
  `g` with the description-matched projects above (visible in the
  registry + `man` pages).
- Tests still guard backing coverage for *every* command, so the new
  rows ship with research attached or not at all. **6/6 pass**,
  `yubnub.xdc` rebuilt.

## 4. Sources (2026-10-13)

GitHub description searches: `"command line for the web"`, `"smart
bookmarks"`, `yubnub`, `metasearch stars:>200`, `"reverse dictionary"`,
`"dictionary api" stars:>300`, `"exchange rates" api stars:>800`,
`"alternative front-end to YouTube"`, `"web archiving" stars:>1000`,
`wikipedia offline stars:>500`, `bangs redirect` (all `in:description`,
star-sorted) · `gh repo view` for ccheever/bunny1, ph1losof/flashbang,
benbusby/whoogle-search, thunlp/WantWords, meetDeveloper/freeDictionaryAPI,
TeamPiped/Piped, kiwix/kiwix-tools, osm-search/Nominatim, komoot/photon,
argosopentech/argos-translate, thedaviddelta/lingva-translate,
ArchiveBox/ArchiveBox, webrecorder/pywb, ranaroussi/yfinance,
fawazahmed0/exchange-api, mozilla/ubiquity · live fetches:
api.dictionaryapi.dev (JSON ✓), piped.video (✓), currency-api CDN
(✓ 2026-10-13 rates), wantwords.net (form UI, no GET endpoint ✗).
