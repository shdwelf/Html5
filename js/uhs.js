/**
 * uhs.js — reader for UHS88a (Universal Hint System, 1988 format) hint files.
 *
 * Format per Stefan Wolff's public dissection ("Grokking the UHS"):
 * CRLF line-based; a 4-line header ("UHS" magic, title, first-hint line,
 * last-hint line — all line numbers in the file are relative to just after
 * the header, so add 4 for actual 1-based lines); then a tree of links
 * (encrypted label line + target line number), then the hint lines
 * (one encrypted hint per line). Labels and hints use the 88a cipher:
 *   char < 32 -> itself; 32..79 -> 2i-32; >= 80 -> 2i-127.
 * A link whose target is a hint line opens a question; its hints are the
 * lines from that target up to the next question's first hint (or the
 * header's last-hint line) — the partitioning Wolff's dissection uses.
 *
 * Newer 91a/95a/96a hunk formats are detected and refused with a pointer to
 * OpenUHS rather than misparsed. No real .uhs files are bundled with this
 * repo; bring your own (the format's distributors ask that conversions not
 * be republished — this reader renders locally, in your browser).
 */

export function decrypt88a(line) {
  let out = "";
  for (const ch of line) {
    const i = ch.charCodeAt(0);
    if (i < 32) out += ch;
    else if (i < 80) out += String.fromCharCode(2 * i - 32);
    else out += String.fromCharCode(2 * i - 127);
  }
  return out;
}

export function encrypt88a(line) {
  let out = "";
  for (const ch of line) {
    const p = ch.charCodeAt(0);
    if (p < 32) out += ch;
    else if (p % 2 === 0) out += String.fromCharCode((p + 32) / 2);
    else out += String.fromCharCode((p + 127) / 2);
  }
  return out;
}

const HEADER_LINES = 4;

export function parseUhs88a(text) {
  if (typeof text !== "string") throw new Error("UHS input must be text");
  if (text.includes("** END OF 88A FORMAT **")) {
    throw new Error("This is a UHS91a/95a/96a hunk-format file; use OpenUHS for those. This reader covers UHS88a only.");
  }
  const lines = text.split(/\r\n|\r|\n/);
  if (!lines[0] || lines[0].trim() !== "UHS") throw new Error('Missing "UHS" magic on line 1 — not a UHS88a file');
  if (lines.length < HEADER_LINES + 2) throw new Error("File too short to be a UHS88a hint file");
  const title = lines[1];
  const firstHintStored = parseInt(lines[2], 10);
  const lastHintStored = parseInt(lines[3], 10);
  if (!Number.isFinite(firstHintStored) || !Number.isFinite(lastHintStored)) {
    throw new Error("Header hint line numbers (lines 3-4) are not numbers");
  }
  // Stored line numbers are relative to after the 4-line header.
  const toActual = (stored) => stored + HEADER_LINES; // 1-based
  const firstHint = toActual(firstHintStored);
  const lastHint = toActual(lastHintStored);
  const lineAt = (actual1) => lines[actual1 - 1] ?? "";

  // Tree region: lines 5..firstHint-1, as (label, target) pairs.
  const pairs = new Map(); // actual start line of a pair -> {label, target}
  for (let ln = HEADER_LINES + 1; ln + 1 < firstHint; ln += 2) {
    const targetStored = parseInt(lineAt(ln + 1), 10);
    if (!Number.isFinite(targetStored)) throw new Error(`Link at line ${ln} has a non-numeric target`);
    pairs.set(ln, { label: decrypt88a(lineAt(ln)), target: toActual(targetStored) });
  }

  // Partition the tree region into lists: a list starts at line 5 and at
  // every line some link points to; it runs until the next list start.
  const starts = new Set([HEADER_LINES + 1]);
  for (const { target } of pairs.values()) if (target < firstHint) starts.add(target);
  const sortedStarts = [...starts].sort((a, b) => a - b);
  const listAt = new Map();
  sortedStarts.forEach((start, i) => {
    const end = i + 1 < sortedStarts.length ? sortedStarts[i + 1] : firstHint;
    const items = [];
    for (let ln = start; ln + 1 < end; ln += 2) if (pairs.has(ln)) items.push(pairs.get(ln));
    listAt.set(start, items);
  });

  // Hint groups: questions in file order, spanning to the next question.
  const questionStarts = [...new Set([...pairs.values()].map((p) => p.target).filter((tg) => tg >= firstHint && tg <= lastHint))].sort((a, b) => a - b);
  const groupAt = new Map();
  questionStarts.forEach((start, i) => {
    const end = i + 1 < questionStarts.length ? questionStarts[i + 1] - 1 : lastHint;
    const hints = [];
    for (let ln = start; ln <= end; ln++) hints.push(decrypt88a(lineAt(ln)));
    groupAt.set(start, hints);
  });

  const buildItems = (startLine, depth) =>
    (listAt.get(startLine) || []).map(({ label, target }) => {
      if (target >= firstHint) return { label, type: "question", hints: groupAt.get(target) || [] };
      if (depth > 32) throw new Error("Link tree is cyclic or absurdly deep");
      return { label, type: "section", items: buildItems(target, depth + 1) };
    });

  return { format: "UHS88a", title, items: buildItems(HEADER_LINES + 1, 0) };
}
