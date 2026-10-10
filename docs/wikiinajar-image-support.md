# WikiInAJar 0.8 — investigation + image-support design

Date 2026-10-10. Requested: get `wiki.in.a.jar` from Drive, investigate the source
(openhub.net/p/wiki-in-a-jar), and add image support — in that order.

## 1. Retrieved from Google Drive (done)

`WikiInAJar-0.8-20081128-bin.zip` (123,402 B, Drive id `1uKnAjh5zlgq_4iAQZ3Hw_CsNFPAEc2br`)
→ `google_drive/WikiInAJar-0.8-20081128-bin.zip`, extracted to `google_drive/wiaj/`.
Layout: `wiki.in.a.jar/` (dir) → `wiki.in.a.jar` (the 98,464 B jar), `bin/start.sh|cmd`,
`public/` (XSL skins, views, CSS, PNG). No `.java` source is shipped in the binary zip.

## 2. Ran it on the Temurin JRE (done, verified)

```
$(JAVA_HOME)/bin/java -jar wiki.in.a.jar 3003
```
Boots, binds `0.0.0.0:3003`, and `GET /wiki → 200` (1893 B) returning the wiki XML page
(`<?xml-stylesheet ... master.xsl?>` + `<page>…`). Running as a live preview on port 3003.
JRE = `jdk4py` Temurin 25.0.2.1+11.

## 3. Source investigation

**openhub.net is unreachable from this sandbox (`000`)**, so the openhub page could not be
fetched. The architecture was mapped directly from the jar instead:

- `Main-Class: org.rgse.wikiinajar.server.Server`; 63 classes.
- HTTP layer: a bundled **NanoHTTPD** (`net.sf.wikiinajar.xrays.NanoHTTPD`), MVC-ish
  (`ActionMapping`, `ControllerResponse`, controllers under `org.rgse.wikiinajar.controllers`).
- Wikitext render pipeline: `org.rgse.wikiinajar.helpers.wiki.render.RenderEngine` drives a
  **filter chain** (`filters/`): `BreakFilter, HeadingFilter, HrFilter, HtmlTagsFilter,
  IntendedFilter, ListFilter, NoWikiCapture/InsertFilter, SectionFilter, Strong/Stronger/
  StrongestFilter, TableFilter, UrlFilter, WikiLinkFilter` (all extend `LineByLineFilter`,
  implement `Filter`). `WikiLink` handles `[[links]]`.
- Presentation: `public/skins/default/wiki/show-article.xsl` does
  `<xsl:copy-of select="content/*"/>` — *"just copy everything as it is expected to be HTML."*

**Finding: WikiInAJar 0.8 has NO image support.** The jar has zero `image`/`img`/`picture`/
`attach` references and no `ImageFilter`. The XSL already passes rendered HTML straight
through, so the missing piece is purely a render filter that emits `<img>`.

## 4. Image-support design (the extension point)

Add one filter to the chain that turns image wikitext into an `<img>`; the existing
`show-article.xsl` passthrough then renders it with no XSL change.

- Syntax: `[[Image:src|alt]]` (and/or `[[image:src]]`), mirroring the `WikiLinkFilter` style.
- Output: `<img src="SRC" alt="ALT" class="wiki-image"/>` (escape `src`/`alt`).
- Registration: append `new ImageFilter()` to the filter list built in `RenderEngine`.
- Serving the bytes is a separate concern: reference already-served files (e.g. under
  `public/`) or add an upload/attachment route — out of scope for the render filter alone.

Sketch (see `tools/wikiinajar/ImageFilter.java`):

```java
package org.rgse.wikiinajar.helpers.wiki.render.filters;

import java.util.regex.*;
import org.rgse.wikiinajar.helpers.wiki.render.LineByLineFilter;

public class ImageFilter extends LineByLineFilter {
    private static final Pattern IMG =
        Pattern.compile("\\[\\[[Ii]mage:([^|\\]]+)(?:\\|([^\\]]+))?\\]\\]");
    @Override public String filterLine(String line) {
        Matcher m = IMG.matcher(line);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String src = m.group(1).trim();
            String alt = m.group(2) == null ? src : m.group(2).trim();
            m.appendReplacement(sb, Matcher.quoteReplacement(
                "<img src=\"" + esc(src) + "\" alt=\"" + esc(alt) + "\" class=\"wiki-image\"/>"));
        }
        m.appendTail(sb);
        return sb.toString();
    }
    private static String esc(String s) {
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;");
    }
}
```

## 5. Blocker — cannot compile here

Producing a rebuilt jar with image support needs a Java **compiler** and a way to edit
`RenderEngine`, and this sandbox has neither:

- **No `javac`.** `jdk4py` ships a **JRE** (`bin/` = java, jcmd, jfr, jinfo, jmap, jps,
  jrunscript, jstack, jstat, jwebserver, keytool, rmiregistry — no `javac`/`jar`/`javap`).
  PyPI `jdk` = "a small example package", `zulu` = a datetime library (both unrelated);
  `install-jdk` downloads a JDK from the **blocked** Adoptium CDN; Adoptium/GitHub release
  assets are `000`. So no full JDK is obtainable.
- **No Java decompiler.** To register the filter I must modify `RenderEngine.class`; the
  real decompilers (CFR/Vineflower/Procyon) are not on PyPI under usable names (`cfr` on PyPI
  is a climate-science package) and their real hosts are blocked.
- **openhub source unreachable** (`000`), so I can't rebuild from original `.java` either.

The `ImageFilter.java` above is therefore an **uncompiled sketch** — the exact `Filter`/
`LineByLineFilter` method signatures must be confirmed against the real classes when a JDK is
available. To finish: obtain a JDK with `javac` **and** either the original source or a Java
decompiler, then `javac -cp wiki.in.a.jar ImageFilter.java`, add `new ImageFilter()` to
`RenderEngine`'s chain, and repackage the jar.
