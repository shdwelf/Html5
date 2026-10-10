# ACME httpd (Acme.Serve / TJWS2) — compile status with the ECJ toolchain

"Try acme httpd instead of NanoHTTPD." The ACME Java web server on GitHub is the
`Acme.Serve` package; the maintained lineage is **TJWS2** (`github.com/drogatkin/TJWS2`,
`1.x/src/Acme/Serve/`: `Serve.java`, `Main.java`, `FileServlet.java`, acceptors,
`CgiServlet`, `WarDeployer`, …). Found via the code-search REST API
(`gh api search/code?q="package Acme.Serve"`); `gh search code` itself is broken here.

## Result

- Fetched TJWS2 via `codeload` (93 `.java` files: `Acme/Serve`, `rogatkin/web`,
  `rogatkin/wskt`, `jasper*`, a `javax/servlet` compatibility layer).
- Compiled the core (`Acme/Serve` + `rogatkin/web` + the bundled `javax/servlet`) with
  `tools/java-compiler/javac.sh` (ECJ 3.10 + Java 7 `rt.jar`): **37 classes built.**
- Errors remain because the bundled `javax/servlet` is a **stub** (e.g. it lacks
  `HttpServletResponse.SC_NOT_IMPLEMENTED`). Swapping in an external
  `javax.servlet-api.jar` (fetched `pigeonwx/JavaCodeForTest`, 63 KB) raised errors
  (437) because `rogatkin/web` also depends on TJWS's own compatibility classes — so the
  container needs a **version-matched servlet API + its full module set**, i.e. a real
  project build, not a one-shot `javac`.

## Bottom line

The **compiler is solved** (`tools/java-compiler/`, ECJ from GitHub, verified). ACME httpd
is a legitimate target and partly compiles with it; bringing TJWS2 up as a running servlet
container is a follow-on build (align the servlet-api version with TJWS2's expectation and
compile the whole module set). The classic single-file `Acme.Serve.WebServer` is not present
in reachable repos — only the TJWS servlet-container form.
