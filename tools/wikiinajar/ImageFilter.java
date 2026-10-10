/*
 * WikiInAJar 0.8 — image-support render filter (SKETCH, UNCOMPILED).
 *
 * STATUS: NOT compiled and NOT verified. This sandbox has a JRE only (no javac),
 * so this could not be built or tested here. The exact method name/signature of
 * the base class (LineByLineFilter.filterLine vs. filter/process) MUST be confirmed
 * against the real org.rgse.wikiinajar.helpers.wiki.render classes before compiling.
 *
 * Intent: turn wikitext  [[Image:src|alt]]  (or [[image:src]])  into
 *   <img src="src" alt="alt" class="wiki-image"/>
 * which public/skins/default/wiki/show-article.xsl already passes through verbatim
 * (<xsl:copy-of select="content/*"/>), so no XSL change is needed.
 *
 * To integrate (requires a JDK with javac + the original source or a decompiler):
 *   1. javac -cp wiki.in.a.jar ImageFilter.java
 *   2. register `new ImageFilter()` in RenderEngine's filter chain
 *      (after WikiLinkFilter, before/with the inline filters).
 *   3. repackage wiki.in.a.jar.
 * See docs/wikiinajar-image-support.md.
 */
package org.rgse.wikiinajar.helpers.wiki.render.filters;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.rgse.wikiinajar.helpers.wiki.render.LineByLineFilter;

public class ImageFilter extends LineByLineFilter {

    // [[Image:src|alt]]  or  [[image:src]]  — alt optional
    private static final Pattern IMG =
        Pattern.compile("\\[\\[[Ii]mage:([^|\\]]+)(?:\\|([^\\]]+))?\\]\\]");

    @Override
    public String filterLine(String line) {
        if (line == null || line.indexOf("[[") < 0) return line;
        Matcher m = IMG.matcher(line);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String src = m.group(1).trim();
            String alt = (m.group(2) == null) ? src : m.group(2).trim();
            String tag = "<img src=\"" + esc(src) + "\" alt=\"" + esc(alt)
                       + "\" class=\"wiki-image\"/>";
            m.appendReplacement(sb, Matcher.quoteReplacement(tag));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
