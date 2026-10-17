/**
 * md2wiki — convert this repository's Markdown documentation into native
 * Wiki-in-a-Jar wikitext, so every *.md becomes an editable wiki page in
 * wikiinajar.html / wikiinajar.xdc (Bundled Docs, loaded from docs.json).
 *
 * Deliberately small and deterministic (no dependencies): it covers the
 * Markdown this corpus actually uses — ATX/setext headings, **bold**,
 * *italic*, `code`, ``` fences, - / 1. lists (nested, tasks), pipe
 * tables, blockquotes, rules, and [text](href) links. Links between
 * corpus .md files become [[Wiki Links]]; other relative links keep
 * their target as an inline-code annotation; remote links stay remote.
 * Anything unrecognised passes through as plain text — a converted page
 * may be plainer than its source, never broken markup.
 *
 * Used by scripts/build-wikiinajar-xdc.mjs; unit-tested in
 * tests/wikiinajar.test.mjs.
 */

export function cleanTitle(raw) {
  return String(raw)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/[`*_~]/g, "")
    .replace(/[[\]|]/g, "-")
    .replace(/:/g, " -")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90)
    .trim();
}

export function humanizeStem(stem) {
  const words = stem.replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "Untitled";
}

/** Page title for one source file: its first H1, else the filename. */
export function titleFor(source, markdown) {
  const match = String(markdown).match(/^#\s+(.+?)\s*#*\s*$/m);
  const fromHeading = match ? cleanTitle(match[1]) : "";
  if (fromHeading) return fromHeading;
  const stem = source.split("/").pop().replace(/\.md$/i, "");
  return cleanTitle(humanizeStem(stem)) || "Untitled";
}

function resolveRelative(fromSource, href) {
  const parts = fromSource.split("/").slice(0, -1);
  for (const seg of href.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/** Inline Markdown -> wikitext. linkMap: corpus source path -> page title. */
export function convertInline(text, source, linkMap) {
  const codeSpans = [];
  let out = String(text)
    // protect code spans first: their contents are literal
    .replace(/``([^`]+)``/g, (_, c) => "\u0003" + (codeSpans.push(c.trim()) - 1) + "\u0003")
    .replace(/`([^`\n]+)`/g, (_, c) => "\u0003" + (codeSpans.push(c) - 1) + "\u0003")
    // images: raster embeds, anything else degrades to its alt text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => {
      const base = src.split("/").pop();
      return /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(base)
        ? `[[image:${base}|${alt || base}]]`
        : alt || base;
    })
    // inline links
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
      const target = href.replace(/^<|>$/g, "");
      if (target.startsWith("#")) return label; // same-page anchor
      if (/^(https?:|mailto:)/i.test(target)) {
        return target.toLowerCase().startsWith("mailto:")
          ? label
          : `[[${target}|${label}]]`;
      }
      const resolved = resolveRelative(source, target.split("#")[0]);
      const title = linkMap.get(resolved);
      if (title) return label === title ? `[[${title}]]` : `[[${title}|${label}]]`;
      // non-corpus relative link: annotate with the path, unless the
      // label already is the path (a common [path](path) idiom)
      const plainLabel = label.replace(/\u0003(\d+)\u0003/g, (_, n) => codeSpans[Number(n)]);
      if (plainLabel === target || plainLabel === target.replace(/^\.\//, "")) return label;
      return `${label} (\u0003${codeSpans.push(target) - 1}\u0003)`;
    })
    // autolinks
    .replace(/<(https?:\/\/[^>\s]+)>/g, "$1")
    .replace(/<[^>\s]+@[^>\s]+>/g, (m) => m.slice(1, -1))
    // emphasis (bold before italic; underscore forms need word boundaries)
    .replace(/\*\*([^*]+)\*\*/g, "'''$1'''")
    .replace(/(?<![\w])__([^_]+)__(?![\w])/g, "'''$1'''")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "''$1''")
    .replace(/(?<![\w])_([^_\n]+)_(?![\w])/g, "''$1''")
    .replace(/~~([^~]+)~~/g, "$1")
    // leftover HTML tags keep their text; <br> becomes a space
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // backslash escapes of punctuation
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1");
  return out.replace(/\u0003(\d+)\u0003/g, (_, n) => "`" + codeSpans[Number(n)] + "`");
}

/** Block-level Markdown -> wikitext body (no footer; see buildDocs). */
export function convertMarkdown(markdown, source, linkMap = new Map()) {
  let text = String(markdown).replace(/\r\n?/g, "\n");
  text = text.replace(/^---\n[\s\S]*?\n---\n/, ""); // YAML front matter
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  const lastText = () => {
    for (let k = out.length - 1; k >= 0; k--) if (out[k].trim()) return k;
    return -1;
  };
  while (i < lines.length) {
    const line = lines[i];
    // fenced code -> space-indented pre block (0.8 preformat rule);
    // fences may be indented when nested inside a list item
    const fence = line.match(/^(\s*)```(\w*)\s*$/);
    if (fence) {
      const dedent = fence[1].length;
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        const raw = lines[i];
        const strip = Math.min(dedent, raw.match(/^\s*/)[0].length);
        out.push(" " + raw.slice(strip));
        i++;
      }
      i++; // closing fence
      out.push("");
      continue;
    }
    // ATX heading: # -> ==, ## -> ===, ###+ -> ====
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const marks = "=".repeat(Math.min(heading[1].length + 1, 4));
      out.push("", `${marks} ${convertInline(heading[2], source, linkMap)} ${marks}`, "");
      i++;
      continue;
    }
    // setext heading or horizontal rule
    if (/^=+\s*$/.test(line) || /^-+\s*$/.test(line)) {
      const k = lastText();
      if (k >= 0 && !/^(=|-|\*|#|\|| )/.test(out[k])) {
        const level = line.startsWith("=") ? "==" : "===";
        out[k] = `${level} ${out[k].trim()} ${level}`;
      } else if (line.startsWith("-")) out.push("", "----", "");
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push("", "----", ""); i++; continue; }
    // pipe table: keep rows, drop the separator row
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (!/^\|?[\s:|-]+\|?$/.test(line.trim()) || !line.includes("-")) {
        const cells = line.trim().replace(/^\||\|$/g, "").split("|")
          .map((c) => convertInline(c.trim(), source, linkMap));
        out.push("| " + cells.join(" | ") + " |");
      }
      i++;
      continue;
    }
    // blockquote: unwrap, keep the text as a paragraph
    if (/^\s*>\s?/.test(line)) {
      out.push(convertInline(line.replace(/^\s*>\s?/, ""), source, linkMap));
      i++;
      continue;
    }
    // list item (nested by 2-space indent; tasks get ballot boxes)
    const item = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (item) {
      const depth = Math.min(Math.floor(item[1].length / 2) + 1, 4);
      const ordered = /\d/.test(item[2][0]);
      let body = item[3].replace(/^\[ \]\s+/, "☐ ").replace(/^\[[xX]\]\s+/, "☑ ");
      out.push((ordered ? "#".repeat(depth) : "*".repeat(depth)) + " " + convertInline(body, source, linkMap));
      i++;
      continue;
    }
    // HTML block lines carry no text of their own
    if (/^\s*<\/?(div|span|p|br|table|thead|tbody|tr|td|th|ul|ol|li|section|article|header|footer|figure|figcaption)[^>]*>\s*$/i.test(line)) { i++; continue; }
    out.push(convertInline(line, source, linkMap));
    i++;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Convert a whole corpus. files: [{source, markdown}] in any order.
 * Returns [{title, source, bytes, body}] sorted by source, titles unique,
 * each body footered with its provenance and documentation tags.
 */
export function buildDocs(files) {
  const sorted = [...files].sort((a, b) => a.source.localeCompare(b.source));
  const linkMap = new Map();
  const used = new Map();
  for (const file of sorted) {
    let title = titleFor(file.source, file.markdown);
    const key = title.toLowerCase();
    if (used.has(key)) {
      const stem = file.source.split("/").pop().replace(/\.md$/i, "");
      title = `${title} (${stem})`;
    }
    used.set(title.toLowerCase(), file.source);
    file.title = title;
    linkMap.set(file.source, title);
  }
  return sorted.map((file) => {
    const extra = [
      file.source.startsWith("docs/") ? "docs" : "root-docs",
      file.source.includes("deep-dive") ? "deep-dive" : null,
    ].filter(Boolean).join(",");
    const body = convertMarkdown(file.markdown, file.source, linkMap)
      + `\n\n----\n''Bundled documentation — converted from \`${file.source}\` by \`tools/wikiinajar/md2wiki.mjs\``
      + ` (\`npm run build:wikiinajar\`). Edit this page to keep a local copy; your version wins on this device.''`
      + `\n[[tags:documentation,${extra}]]`;
    return { title: file.title, source: file.source, bytes: Buffer.byteLength(file.markdown, "utf8"), body };
  });
}
