/*
 * XRays Web Framework
 *
 * Copyright (C) 2007 rico_g AT users DOT sourceforge DOT net
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License s published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 */

package net.sf.wikiinajar.xrays;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

/**
 * Serves files in the 'public' folder.
 *
 * @author rico_g AT users DOT sourceforge DOT net
 *
 */
public class PublicController {

	public static final String PUBLIC_ROOT = "./public";

	public ControllerResponse skinsAction(Request request) {
		try {
			File root = new File(PUBLIC_ROOT + "/skins").getCanonicalFile();
			String ids = request.getPath().getIds();
			if (ids == null || ids.length() == 0) {
				return request.resourceNotFoundResponse("Skin resource not found.");
			}

			File resource = new File(root, ids).getCanonicalFile();
			String rootPath = root.getPath();
			if (!resource.getPath().startsWith(rootPath + File.separator)
					|| !resource.isFile()) {
				return request.resourceNotFoundResponse("Skin resource not found.");
			}
			return request.streamResponse(resource.getName(),
					new FileInputStream(resource));
		} catch (IOException e) {
			return request.resourceNotFoundResponse("Skin resource not found.");
		}
	}

	/**
	 * Returns <code>true</code> if the directory serving static files exists.
	 *
	 * @return <code>true</code> if the doc root dir exists.
	 *
	 * @see #PUBLIC_ROOT
	 */
	public static boolean publicDocrootExists() {
		File dir = new File(PUBLIC_ROOT);
		return dir.exists() && dir.isDirectory();
	}
}
