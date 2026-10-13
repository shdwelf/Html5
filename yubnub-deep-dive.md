# Deep Dive: Yubnub — a (social) command line for the web

*A link-by-link crawl of [yubnub.org](https://yubnub.org) (2026-10-13), the
advanced-syntax spec, and the endpoint audit behind this repo's offline
rebuild: **[`yubnub.html`](./yubnub.html)** → **[`yubnub.xdc`](./yubnub.xdc)**
(`npm run build:yubnub`, source: `scripts/build-yubnub-xdc.mjs`).*

> **Related:** the pattern follows this repo's other single-file HTML5 →
> webxdc conversions (e.g. [`lattice-viewer.html`](./lattice-viewer.html),
> `scripts/build-cia-museum-xdc.mjs`).

---

## 0. Scope & honesty note

The sandbox shell has no arbitrary outbound network, so the crawl was done
through the browser fetch/search tooling on 2026-10-13. Pages marked
**verified** below were fetched live that day (homepage, Jeremy's Picks ×3
chunks, Advanced Syntax, Most-Used Commands ×4 chunks, Create form,
Installing Yubnub, Golden Eggs, `man xe`, `man random`). Everything else is
labelled *indexed* (confirmed via search results) or *historical*. Nothing
about link health is asserted beyond what was actually fetched — dead-service
flags in the registry are limited to well-known shutdowns (del.icio.us 2017,
Technorati 2016, A9, Google Reader 2013).

Yubnub itself is **alive**: the Most-Used page shows commands used the same
day as the crawl (`g` last used 2026-10-13 04:53, 23,429,935 uses total).

## 1. What Yubnub is

A web-based command line (Jonathan Aquino, Rails Day 2005 —
[github.com/JonathanAquino/yubnub](https://github.com/JonathanAquino/yubnub);
[jcnetdev/yubnub](https://github.com/jcnetdev/yubnub) is the frozen Rails
2.1 “v3” refactor). Type
`gim porsche 911` → Google Image search; `random 100` → random number;
anyone can `create` a command by giving a URL with `%s` in it. 10,500+
commands existed by 2006; the homepage's “Popular Searches” table
(`g`, `wp`, `am`, `weather`, `flk`, `stock`, `a`…) is still the fastest
on-ramp. Unknown commands fall back to Google search.

## 2. Link crawl — every link that matters

Homepage navigation (verified from the fetched homepage + search index):

| Link | Target | Status 2026-10-13 | Rebuilt as |
| --- | --- | --- | --- |
| What Is This Thing? | homepage explainer | live | app header + this doc §1 |
| List All Commands (`ls`) | `kernel/ls?args=%s` | live | Commands tab (`local:ls`) |
| Create a New Command | `command/new` | **verified** | Create tab (`local:create`, local save) |
| Installing Yubnub | `documentation/describe_installation` | **verified** | Syntax tab summary (§4 below) |
| Advanced Syntax | `documentation/describe_advanced_syntax` | **verified** | Syntax tab — engine implements all of it |
| Most-Used Commands | `kernel/most_used_commands[?page=N]` | **verified** (4 chunks) | `Uses*` counters, registry seed |
| Golden Eggs (`ge`) | `kernel/golden_eggs` | **verified** | `ge` filter + “Golden Egg” tags |
| Jeremy's Picks | `documentation/jeremys_picks` | **verified** (3 chunks) | registry categories |
| Parser | `parser/parse?command=%s` | live (redirect engine) | the offline engine itself |
| URL resolver | `parser/url?command=%s` | live | `local:url` / “URL ONLY” button |
| Manual pages | `kernel/man?args=%s` | **verified** (`man xe`, `man random`) | `local:man` panel |
| Echo / Split services | `example/echo?text=`, `example/split?type=t&urls=` | live (via man pages) | `local:echo`, split/mash view |
| Upcoming Features | `documentation/describe_upcoming_features` | indexed, historical | §5 notes |
| Leave a Tip ♥ / Community / Wiki / Blog / Source Code (v3) / Acknowledgements / Contact | PayPal-era tip link, Google Group (`groups-beta.google.com/group/YubNub`, defunct form), [Wikibooks](https://en.wikibooks.org/wiki/Yubnub), yubnub.blogspot.com, GitHub, mailto:jon@yubnub.org | mixed | footer credit + sources |

Per-command backing services discovered inside man/most-used pages include
`jonathanaquino.com/yubtools/split.php` (the `%` command),
`jonathanaquino.com/yubscripts/ifthen/ifthen.php` (`ifThen`),
`…/singpolymaplay/yubnub-match.php` (`match`), `…/yubnub-explode.php`,
`…/yubnub-foreach.php`, and `elzr.com` stylesheets (`lsplit`). These are
server-side helpers; the rebuild re-implements the pure ones (`%`,
`ifThen`, `explode`, `strReplace`, `strFind`…) locally instead of depending
on them.

**Installing Yubnub** (verified) is a museum of 2005–2010 browser
integration, all pointing at `parser/parse?command=%s`: Firefox search
plugin & `keyword.URL`, IE6 registry file (`yubnub-ie.reg`) & IE7 search
providers, Safari (Sogudi `@@@`, SIMBL), Opera “Create Search”, Chrome
“Edit search engines” + YubNubEx extension, Camino/CamiSearch, Maxthon,
Konqueror `\{@}`, OmniWeb `%@`, Quicksilver `*****`, LaunchBar `\*`,
Conkeror, SlickRun `$w$`, BlackBerry (Berry411 `yn:`), iPhone bookmarklets,
Linux `yubnub` shell script. The modern equivalent shipped here: point any
custom search engine at `…/yubnub.html?command=%s` — the app auto-runs it.

## 3. Advanced syntax (the spec the engine implements)

From `describe_advanced_syntax` (verified, quoted in the app's Syntax tab):

- `%s` — argument substitution; spaces → `+`, rest URL-encoded
  (`Mork & Mindy` → `Mork+%26+Mindy`).
- `${what}` / `${where=Washington, DC}` — named switches:
  `gloc -what pizza -where Poughkeepsie, NY`. Dashes are “a tribute to
  Yubnub's command-line heritage”.
- `{ nested }` pipes — `g {random 100}`; positional trick
  `gloc -what {% 1 %s} -where {% 2 %s}[no url encoding]`.
- `[no url encoding]` (Wayback), `[use %20 for spaces]` / `[use - for spaces]`,
  `[post]` (GET→POST via get2post; the app flags it, cannot POST offline).
- `switch`: `{ switch ${plat} | xbox => 13, dreamcast => 1, * => 0 }`.
- Meta-commands that build commands: `url`, `%`, `filterstring`, `ifthen`,
  `random`, `scrape`, `split/splith/splitv`, `date`, `strReplace`, `ucase`…

Engine limits (documented, deliberate): switch values end at the next
declared `-switch`; `{…}` nesting caps at 12 levels; a nested URL-command
splices its resolved URL as text (real Yubnub splices fetched text for
helper commands — only the pure helpers are reproduced locally).

## 4. Endpoint audit — new, updated, dead

Seed = Most-Used p.1 (verified counters) + Jeremy's Picks + homepage table.
In the registry each entry is flagged **updated** (endpoint modernised),
**new** (added 2026), **dead** (kept for history, app warns):

- **Updated:** `gim`/`gi` (`images.google.com/images?q=` →
  `google.com/search?…&tbm=isch`, matches live `gim`), `am`
  (`amazon.com/exec/obidos/external-search` → `amazon.com/s?k=`),
  `ebay` (`sch/items/?_nkw=` → `sch/i.html?_nkw=`), `yt`/`youtube`
  (legacy `search_type=` params → `search_query=`), `xe`
  (`xe.com/ucc/convert.cgi` → `xe.com/currencyconverter/convert/`),
  `gnws` (RSS output → News search), `wp`/`gmaps`/`leo`/… http→https,
  `e-f`/`f-e` (`translate.google.fr/#en|fr|` → `translate.google.com/?sl=&tl=`),
  `stock` (Yahoo quote page), `dict` (Answers.com → Dictionary.com).
- **Dead (historical, warned):** `deli` (del.icio.us, closed 2017),
  `tec` (Technorati, closed 2016), `a9` (A9 retired), `gread`
  (Google Reader, closed 2013 — now lands on Google News).
- **New (2026):** `bing`, `brave`, `mdn`, `so`, `gh`, `npm`, `pypi`,
  `rfc` (`rfc 2616` → the RFC text, `[no url encoding]`), `letterboxd`, `leo2`.
- **Open-source re-backed (2026-10-13):** after the per-command GitHub audit in
  [`docs/yubnub-opensource-backing-2026-10-13.md`](./docs/yubnub-opensource-backing-2026-10-13.md),
  32 commands were replaced with GitHub open-source-backed endpoints
  (SearXNG, Openverse, OpenStreetMap, Invidious, LibreTranslate, wttr.in,
  Frankfurter, MusicBrainz, Wiktionary, ICANN RDAP…) and every command now
  carries a researched `backing:` line in-app.
- **Local/offline (were server helpers):** `echo`, `random`
  (`rand -min/-max/-num`, random.org semantics), `%`, `strReplace`,
  `strFind`, `strLength`, `ucase`, `lcase`, `ifThen`, `ifEmpty`,
  `explode`, `date`, `switch`; app-meta: `ls`, `ge`, `man`, `create`,
  `url`, `split`, `mash`, `mash2`, `help`.

## 5. The rebuild

`yubnub.html` is one inline file (CSS+JS embedded, `webxdc.js` shim beside
it): command box with the homepage's own examples, a faithful parser
(§3), the curated registry with `ls`/`ge`/`man`, a Create tab mirroring
`command/new`'s four steps (name → URL → test → description; saved to
localStorage, export/import JSON, duplicate-name rejection), split/mash
panes, history, `?command=` auto-run for search-engine installation, and
webxdc `sendUpdate` sharing of executed commands. `yubnub.xdc` is the
deterministic webxdc zip (`index.html` + `manifest.toml` + `webxdc.js` +
`icon.png`) staged at `public/apps/yubnub/`; `tests/yubnub.test.mjs`
guards the registry/engine invariants.

## 6. Ecosystem follow-up

GitHub / archive.org / Blue Squirrel research (dohliam/yub's 138 engines,
bunnylol.rs, DuckDuckGo !bangs, the WikiTeam wiki dump, WebWhacker /
Grab-a-Site preservation — and why Blue Squirrel is *not* abandonware)
lives in
[`docs/yubnub-github-archive-research-2026-10-13.md`](./docs/yubnub-github-archive-research-2026-10-13.md).
Four commands from that audit (`sp`, `gmails`, `gdrive`, `ud`) were imported
into the registry.

## 7. Sources

Fetched 2026-10-13: yubnub.org `/`, `/documentation/jeremys_picks`,
`/documentation/describe_advanced_syntax`, `/documentation/describe_installation`,
`/kernel/most_used_commands` (pp.1–4 chunks), `/kernel/golden_eggs`,
`/kernel/man?args=xe`, `/kernel/man?args=random`, `/command/new`.
Indexed: Linux.com “Yubnub: A command line for the web” (2006), Lifehacker
(2007, `split`/`mash` usage), Engadget Quicksilver+YubNub (2007),
Wikibooks *Yubnub*, github.com/jcnetdev/yubnub (MIT, Rails Day 2005).
