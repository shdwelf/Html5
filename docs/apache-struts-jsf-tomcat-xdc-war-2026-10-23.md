# Apache Struts, Jakarta Faces (JSF), and Tomcat — for webxdc WARs

*2026-10-23 · investigation requested alongside an xdc→WAR conversion of this
repository's 55 webxdc apps. Built: `tools/build_xdc_wars.mjs` (54 WARs +
viewer WAR in `dist/wars/`), `xdc-viewer.html`. No JVM exists in this
sandbox, so WARs are structurally validated (ZIP, descriptor, byte-faithful
repackaging, deterministic hashes); running them needs any Tomcat 9/10.*

## The question, answered first

**Do these WARs need Struts or JSF? No — and adding either would be a
security downgrade.** A webxdc app is already a complete client-side web
app (`index.html` + static assets); Tomcat's default servlet serves it with
a five-line `web.xml`. Struts and Faces are server-side MVC frameworks for
apps whose HTML is *generated* on the server. Bolting one onto a static app
adds a large, historically CVE-rich runtime to execute zero of its pages.
The generated `WEB-INF/web.xml` therefore declares no servlets, filters, or
framework listeners at all (a test enforces this), and the viewer is a
static page for the same reason.

## Apache Struts — state of the art (Oct 2026)

| Line | Requires | Container | Status |
| --- | --- | --- | --- |
| Struts 7.x (7.4.0, Oct 2026) | Java 17+, Jakarta Servlet 6 | Tomcat 10.1+ | current; `javax`→`jakarta` + `com.opensymphony.xwork2`→`org.apache.struts2` renames vs 6.x |
| Struts 6.x (6.12.0, Oct 2026) | Java 8+, Servlet 3.1 | Tomcat 9 | maintenance line |
| Struts 2.5 and older | — | — | end-of-life; do not deploy |

The security record is the operative fact for a deployment decision:
Struts' OGNL expression evaluation has produced a decade of critical RCEs
(CVE-2017-5638 — the Equifax breach vector — through a continuing cadence
of S2 bulletins; S2-068 / CVE-2025-64775, Dec 2025, is a multipart-upload
disk-exhaustion DoS fixed in 6.8.0/7.1.1). A Struts deployment is a
commitment to track S2 bulletins and upgrade promptly. That cost buys
server-side actions, validation, and templating — none of which a webxdc
app can use, because its UI and `window.webxdc` update flow live entirely
in the browser. **Verdict: not used.** If a future repo service genuinely
needs server-side Java MVC on Tomcat, Struts 7 on Tomcat 10.1+/Java 17 is
the only defensible starting point, with the S2 feed subscribed.

## Jakarta Faces (JSF) — state of the art

JSF is now **Jakarta Faces**: 4.0 (Jakarta EE 10, 2022) and 4.1 (EE 11,
July 2025), implemented by Eclipse Mojarra. Two facts decide its fit here:

- **Faces requires CDI.** Since Faces 2.3, CDI is mandatory (4.x removed
  the old `@ManagedBean` world; Mojarra's minimums are Java 17, Servlet
  6.x, CDI 4.x+). Tomcat is a servlet container and ships neither Faces
  nor CDI — on Tomcat you must bundle Mojarra + Weld (+ EL, JSTL, JSON-P)
  in `WEB-INF/lib` and nurse `IllegalStateException: CDI is not available`
  class errors, or move to a full Jakarta EE server (TomEE, WildFly,
  Payara) that integrates them.
- **Faces is a server-rendered component model** (Facelets, view state,
  postbacks). A webxdc app is the opposite: static files + a JS API. There
  is nothing for Faces to render.

**Verdict: not used**, for the same reason as Struts, plus a heavier
Tomcat integration tax. Faces remains a reasonable choice for a
form-heavy intranet CRUD app on a Jakarta EE server — a different project
from serving webxdc bundles.

## The ArcaneChat angle, and the viewer

ArcaneChat (`ArcaneChat/android`, with `server` and a WIP TUI) is a
Delta Chat-family client: encrypted email-based chat with first-class
webxdc support — i.e., it is one of the runtimes these `.xdc` files were
built for. The webxdc project's own `webxdc/webxdc-dev` is a development
*server* for webxdc apps, and `webxdc/webxdc-test` probes interpreters.
What this repository lacked was a viewer that works with *its own* fleet
without a chat account or a dev checkout, so `xdc-viewer.html` is built in
that lineage:

- **Catalogue mode** (when served from `xdc-viewer.war`): reads the
  builder-generated `catalogue.json` and links every app's Tomcat context.
- **Local player**: opens any `.xdc` in the browser (fflate unzip), shows
  its manifest, and launches it in a sandboxed iframe with an in-memory
  `window.webxdc` shim (`sendUpdate`/`setUpdateListener`/`getAllUpdates`,
  a stub realtime channel, `sendToChat` honestly unavailable) plus an
  update log — the same contract ArcaneChat/Delta Chat implement natively.
- Stated limits: blob-URL asset rewriting covers typical webxdc layouts;
  apps fetching relative files from scripts, or needing real multi-user
  sync, belong in a chat client or their deployed WAR context.

## What was built

| Piece | Notes |
| --- | --- |
| `tools/build_xdc_wars.mjs` (`npm run build:xdc-wars`) | repo-root `*.xdc` → `dist/wars/<app>.war` + `xdc-viewer.war` + `catalogue.json`; byte-faithful entries, deterministic ZIP timestamps (stable SHA-256), `WEB-INF/xdc-origin.json` provenance per WAR |
| 54 WARs | every repo app converts; `lattice-viewer` gets its named HTML as welcome-file |
| 1 skip, reported | `greeran-book.xdc` is not a ZIP at all (NUL-framed concatenation — no webxdc client could load it either); batch builds skip-and-report, targeted builds fail closed |
| `xdc-viewer.html` | catalogue + local player above; also the root of `xdc-viewer.war` |
| `tests/xdc-war.test.mjs` | faithful-repackaging, metadata-only delta, no-servlet descriptor, origin hash, determinism, viewer-WAR contents, fail-closed probe (3/3) |

Deployment is: copy `dist/wars/*.war` into Tomcat's `webapps/`, open
`/xdc-viewer/`. Tomcat 9 or 10 both work — the descriptor is Servlet 4.0
with no framework classes to trip the `javax`/`jakarta` divide.

## Sources

- Apache Struts announcements & migration notes (struts.apache.org,
  announce-2025/2026; Struts 7 requires Java 17 + Jakarta Servlet 6;
  S2-068/CVE-2025-64775)
- Eclipse Mojarra (github.com/eclipse-ee4j/mojarra) minimum requirements:
  Java 17, Servlet 6.x, CDI 4.x+; "if the server doesn't ship with Jakarta
  Faces built-in, you need to manually install…"
- Jakarta Faces specification & update history (4.0 2022; 4.1 2025-07-01)
- GitHub: `ArcaneChat/android`, `ArcaneChat/server`, `webxdc/webxdc-dev`,
  `webxdc/webxdc-test` (surveyed 2026-10-23)
- House context: `docs/arcanechat-xdc-games-research-2026-10-02.md`

Backlog: this closes the Java-server deployment question for S8/T8.2's
xdc-port family (WAR path shipped; TI-calc/F-Droid paths remain as
recorded). "Finish backlog" status overall: the remaining partial/open
streams (S2–S5, S7, S8 device work, S10/S11 remainders) are gated on
external captures, physical devices, or multi-round builds — itemised in
`docs/agent-backlog-2026-10-21.md`.
