/*
 * Wiki in a jar image support.
 *
 * Copyright (C) 2007 rico_g AT users DOT sourceforge DOT net
 * Copyright (C) 2026 shdwelf/Html5 contributors
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 */
package org.rgse.wikiinajar.controllers;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Locale;

import net.sf.wikiinajar.xrays.ControllerResponse;
import net.sf.wikiinajar.xrays.Request;

/** Serves local wiki images and DjVu documents from {@code public/docs/image}. */
public class ImageController {
    private static final String DOC_ROOT_PROPERTY = "wikiinajar.docroot";
    private static final String DEFAULT_DOC_ROOT = "./public/docs";

    public ControllerResponse showAction(Request request) {
        try {
            File docsRoot = new File(System.getProperty(DOC_ROOT_PROPERTY,
                    DEFAULT_DOC_ROOT)).getCanonicalFile();
            File imageRoot = new File(docsRoot, "image").getCanonicalFile();
            if (!imageRoot.isDirectory()) {
                return notFound(request);
            }

            String relative = request.getPath().getIds();
            if (relative == null || relative.length() == 0) {
                return notFound(request);
            }

            String[] segments = relative.split("/", -1);
            File target = imageRoot;
            for (int i = 0; i < segments.length; i++) {
                if (!isSafeSegment(segments[i])) {
                    return notFound(request);
                }
                target = new File(target, segments[i]);
            }

            target = target.getCanonicalFile();
            String rootPath = imageRoot.getPath();
            String targetPath = target.getPath();
            if (!targetPath.startsWith(rootPath + File.separator)
                    || !target.isFile() || !isSupportedExtension(target.getName())) {
                return notFound(request);
            }

            return request.streamResponse(target.getName(), new FileInputStream(target));
        } catch (IOException e) {
            return notFound(request);
        }
    }

    private static boolean isSafeSegment(String segment) {
        if (segment == null || segment.length() == 0 || ".".equals(segment)
                || "..".equals(segment)) {
            return false;
        }
        for (int i = 0; i < segment.length(); i++) {
            char c = segment.charAt(i);
            if (c <= 0x1f || c == 0x7f || c == '/' || c == '\\'
                    || c == ':' || c == '?' || c == '#' || c == '*'
                    || c == '"' || c == '<' || c == '>' || c == '|') {
                return false;
            }
        }
        return true;
    }

    private static boolean isSupportedExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return false;
        }
        String extension = fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
        return "png".equals(extension) || "jpg".equals(extension)
                || "jpeg".equals(extension) || "gif".equals(extension)
                || "webp".equals(extension) || "bmp".equals(extension)
                || "avif".equals(extension) || "djvu".equals(extension)
                || "djv".equals(extension);
    }

    private static ControllerResponse notFound(Request request) {
        return request.resourceNotFoundResponse("Image not found.");
    }
}
