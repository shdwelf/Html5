/*
 * Wiki in a jar image markup support.
 *
 * Copyright (C) 2007 rico_g AT users DOT sourceforge DOT net
 * Copyright (C) 2026 shdwelf/Html5 contributors
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 */
package org.rgse.wikiinajar.helpers.wiki.render.filters;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Produces safe HTML for the {@code img:}, {@code image:}, and {@code djvu:}
 * WikiLink namespaces. WikiLinkFilter consumes {@code [[...]]} before the
 * ordinary render-filter chain, so this helper is invoked by WikiLink rather
 * than registered as a LineByLineFilter.
 *
 * Images are resolved only from {@code ./public/docs/image}; this class never
 * accepts a remote URL or a path outside that directory.
 */
public final class ImageFilter {
    private static final String IMAGE_ROUTE = "/image/show/";
    private static final Set<String> RASTER_EXTENSIONS = new HashSet<String>();

    static {
        RASTER_EXTENSIONS.add("png");
        RASTER_EXTENSIONS.add("jpg");
        RASTER_EXTENSIONS.add("jpeg");
        RASTER_EXTENSIONS.add("gif");
        RASTER_EXTENSIONS.add("webp");
        RASTER_EXTENSIONS.add("bmp");
        RASTER_EXTENSIONS.add("avif");
    }

    private ImageFilter() {
    }

    /** Render a raster image, or a DjVu reader when the file is DjVu. */
    public static String renderImage(String source, String altText) {
        return render(source, altText, false);
    }

    /** Render an explicit DjVu reader link. */
    public static String renderDjvu(String source, String altText) {
        return render(source, altText, true);
    }

    private static String render(String source, String altText, boolean requireDjvu) {
        String path = source == null ? "" : source.trim();
        if (!isSafeRelativePath(path)) {
            return error("Image path must be a safe relative file path.");
        }

        String extension = extension(path);
        boolean isDjvu = "djvu".equals(extension) || "djv".equals(extension);
        if (requireDjvu && !isDjvu) {
            return error("DjVu links must point to a .djvu or .djv file.");
        }
        if (!requireDjvu && !isDjvu && !RASTER_EXTENSIONS.contains(extension)) {
            return error("Unsupported image type.");
        }

        String url = IMAGE_ROUTE + encodePath(path);
        String label = altText == null || altText.trim().length() == 0
                ? basename(path) : altText.trim();
        if (isDjvu) {
            return renderDjvuFigure(url, label);
        }
        return "<img class=\"wiki-image\" src=\"" + escapeAttribute(url)
                + "\" alt=\"" + escapeAttribute(label)
                + "\" loading=\"lazy\" decoding=\"async\" />";
    }

    private static String renderDjvuFigure(String url, String label) {
        String escapedUrl = escapeAttribute(url);
        String escapedLabel = escapeHtml(label);
        return "<figure class=\"wiki-djvu-embed\" data-djvu-src=\""
                + escapedUrl + "\">"
                + "<a class=\"wiki-djvu-fallback\" href=\"" + escapedUrl
                + "\" download=\"download\">" + escapedLabel
                + " (download DjVu)</a>"
                + "<p class=\"wiki-djvu-status\" role=\"status\">"
                + "DjVu reader loads when this item is visible.</p>"
                + "</figure>";
    }

    private static boolean isSafeRelativePath(String path) {
        if (path.length() == 0 || path.length() > 1024
                || path.startsWith("/") || path.endsWith("/")) {
            return false;
        }
        String[] segments = path.split("/", -1);
        for (int i = 0; i < segments.length; i++) {
            String segment = segments[i];
            if (segment.length() == 0 || ".".equals(segment) || "..".equals(segment)) {
                return false;
            }
            for (int j = 0; j < segment.length(); j++) {
                char c = segment.charAt(j);
                if (c <= 0x1f || c == 0x7f || c == '\\' || c == ':'
                        || c == '?' || c == '#' || c == '*' || c == '"'
                        || c == '<' || c == '>' || c == '|') {
                    return false;
                }
            }
        }
        return true;
    }

    private static String extension(String path) {
        int slash = path.lastIndexOf('/');
        int dot = path.lastIndexOf('.');
        if (dot <= slash || dot == path.length() - 1) {
            return "";
        }
        return path.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String basename(String path) {
        int slash = path.lastIndexOf('/');
        return path.substring(slash + 1);
    }

    private static String encodePath(String path) {
        String[] segments = path.split("/", -1);
        StringBuilder encoded = new StringBuilder();
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) {
                encoded.append('/');
            }
            try {
                encoded.append(URLEncoder.encode(segments[i], "UTF-8")
                        .replace("+", "%20").replace("%7E", "~"));
            } catch (UnsupportedEncodingException impossible) {
                throw new IllegalStateException("UTF-8 is required by Java", impossible);
            }
        }
        return encoded.toString();
    }

    private static String error(String message) {
        return "<span class=\"wiki-image-error\">[" + escapeHtml(message) + "]</span>";
    }

    private static String escapeAttribute(String value) {
        return escapeHtml(value);
    }

    private static String escapeHtml(String value) {
        StringBuilder escaped = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '&': escaped.append("&amp;"); break;
                case '<': escaped.append("&lt;"); break;
                case '>': escaped.append("&gt;"); break;
                case '"': escaped.append("&quot;"); break;
                case '\'': escaped.append("&#39;"); break;
                default: escaped.append(c);
            }
        }
        return escaped.toString();
    }
}
