#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const installRoot = process.argv[2];
if (!installRoot) {
  console.error("Usage: node patch-public.mjs <WikiInAJar-install-root>");
  process.exit(2);
}

const rootXslPath = path.join(installRoot, "public/skins/default/common/root.xsl");
const masterCssPath = path.join(installRoot, "public/skins/default/master.css");
const scriptPath = "/public/skins/default/wikiinajar-djvu-viewer.js";

let rootXsl = await readFile(rootXslPath, "latin1");
if (!rootXsl.includes(scriptPath)) {
  if (!rootXsl.includes("</head>")) {
    throw new Error(`Could not find </head> in ${rootXslPath}`);
  }
  rootXsl = rootXsl.replace(
    "</head>",
    `\t\t\t<script type="module" src="${scriptPath}"></script>\n\t\t</head>`,
  );
  await writeFile(rootXslPath, rootXsl, "latin1");
}

let masterCss = await readFile(masterCssPath, "utf8");
const cssImport = "@import 'wikiinajar-image-support.css';";
if (!masterCss.includes(cssImport)) {
  masterCss = `${masterCss.trimEnd()}\n${cssImport}\n`;
  await writeFile(masterCssPath, masterCss, "utf8");
}
