package org.rgse.wikiinajar.helpers.wiki.render;

import net.sf.wikiinajar.xrays.ControllerResponse;

/** Small assertion-only smoke test run by build-image-support.sh. */
public final class ImageSupportSmokeTest {
    public static void main(String[] args) {
        String image = new WikiLink("img:maps/summer photo.png|Photo &amp; map", "wiki").toHtml();
        contains(image, "src=\"/image/show/maps/summer%20photo.png\"");
        contains(image, "alt=\"Photo &amp; map\"");
        contains(image, "class=\"wiki-image\"");

        String imageAlias = new WikiLink("image:diagram.webp|Diagram", "wiki").toHtml();
        contains(imageAlias, "src=\"/image/show/diagram.webp\"");

        String djvu = new WikiLink("djvu:manual.djvu|Read the manual", "wiki").toHtml();
        contains(djvu, "class=\"wiki-djvu-embed\"");
        contains(djvu, "data-djvu-src=\"/image/show/manual.djvu\"");
        contains(djvu, "Read the manual (download DjVu)");

        String djvuAlias = new WikiLink("img:scan.djv|Scanned page", "wiki").toHtml();
        contains(djvuAlias, "class=\"wiki-djvu-embed\"");

        String traversal = new WikiLink("img:../outside.png", "wiki").toHtml();
        contains(traversal, "wiki-image-error");
        excludes(traversal, "/image/show/");
        excludes(traversal, "<img");

        String unsafeAlt = new WikiLink("img:ok.png|\"><script>alert(1)</script>", "wiki").toHtml();
        contains(unsafeAlt, "&lt;script&gt;");
        excludes(unsafeAlt, "<script>");

        String remote = new WikiLink("https://example.invalid/a.png", "wiki").toHtml();
        excludes(remote, "<img");
        excludes(remote, "src=\"https://");

        String unsupported = new WikiLink("img:notes.txt|Notes", "wiki").toHtml();
        contains(unsupported, "wiki-image-error");
        excludes(unsupported, "/image/show/");

        equals("text/javascript", ControllerResponse.getMimeType("viewer.JS"));
        equals("application/wasm", ControllerResponse.getMimeType("engine.WASM"));
        equals("image/png", ControllerResponse.getMimeType("photo.PNG"));
        equals("image/vnd.djvu", ControllerResponse.getMimeType("book.DjVu"));

        System.out.println("Wiki-in-a-Jar image/DjVu smoke tests passed.");
    }

    private static void contains(String actual, String expected) {
        if (actual == null || !actual.contains(expected)) {
            throw new AssertionError("Expected output to contain: " + expected + "\nActual: " + actual);
        }
    }

    private static void excludes(String actual, String unwanted) {
        if (actual != null && actual.contains(unwanted)) {
            throw new AssertionError("Expected output not to contain: " + unwanted + "\nActual: " + actual);
        }
    }

    private static void equals(String expected, String actual) {
        if (!expected.equals(actual)) {
            throw new AssertionError("Expected <" + expected + ">, got <" + actual + ">");
        }
    }
}
