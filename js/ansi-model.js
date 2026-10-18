/**
 * ANSI/VT100 screen model for the BBS viewer.
 *
 * BBS screens from the Wildcat! and Telegard era are byte streams: printable
 * text interleaved with CSI sequences that move the cursor and set attributes.
 * Rendering one means emulating enough of a terminal to place every character
 * where the BBS put it.
 *
 * This is deliberately a model, not a terminal. It holds a screen buffer and
 * advances it from a byte stream; it has no pty, no input, and no network. The
 * viewer page and the netcat capture harness both sit on top of it, and the
 * tests exercise it directly.
 *
 * Scope, stated so nobody is surprised: the 16-colour SGR set, cursor movement,
 * erase in line/display, and CR/LF/BS/TAB. Not implemented: alternate screen
 * buffer, scroll regions (DECSTBM), truecolour, mouse reporting, charset
 * selection, or DEC private modes. Unsupported sequences are consumed and
 * discarded rather than echoed, which is what a terminal does.
 */

export const DEFAULT_COLS = 80;
export const DEFAULT_ROWS = 25;

/** The 16 SGR colours, in the order the 30-37 / 40-47 codes address them. */
export const ANSI_COLORS = [
  "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
];

export const SGR = {
  RESET: 0, BOLD: 1, UNDERLINE: 4, BLINK: 5, REVERSE: 7,
  FG_DEFAULT: 39, BG_DEFAULT: 49,
};


/**
 * The upper half of code page 437 (bytes 0x80-0xFF), indexed from 0.
 *
 * BBS box-drawing and block art is CP437, not Unicode. Reading a capture as
 * latin-1 or UTF-8 turns every border into punctuation, which is exactly the
 * failure this table prevents. Only the glyphs a BBS screen actually uses are
 * given; the rest are the standard CP437 set.
 */
export const CP437_HIGH = [
  "\u00c7","\u00fc","\u00e9","\u00e2","\u00e4","\u00e0","\u00e5","\u00e7",
  "\u00ea","\u00eb","\u00e8","\u00ef","\u00ee","\u00ec","\u00c4","\u00c5",
  "\u00c9","\u00e6","\u00c6","\u00f4","\u00f6","\u00f2","\u00fb","\u00f9",
  "\u00ff","\u00d6","\u00dc","\u00a2","\u00a3","\u00a5","\u20a7","\u0192",
  "\u00e1","\u00ed","\u00f3","\u00fa","\u00f1","\u00d1","\u00aa","\u00ba",
  "\u00bf","\u2310","\u00ac","\u00bd","\u00bc","\u00a1","\u00ab","\u00bb",
  "\u2591","\u2592","\u2593","\u2502","\u2524","\u2561","\u2562","\u2556",
  "\u2555","\u2563","\u2551","\u2557","\u255d","\u255c","\u255b","\u2510",
  "\u2514","\u2534","\u252c","\u251c","\u2500","\u253c","\u255e","\u255f",
  "\u255a","\u2554","\u2569","\u2566","\u2560","\u2550","\u256c","\u2567",
  "\u2568","\u2564","\u2565","\u2559","\u2558","\u2552","\u2553","\u256b",
  "\u256a","\u2518","\u250c","\u2588","\u2584","\u258c","\u2590","\u2580",
  "\u03b1","\u00df","\u0393","\u03c0","\u03a3","\u03c3","\u00b5","\u03c4",
  "\u03a6","\u0398","\u03a9","\u03b4","\u221e","\u03c6","\u03b5","\u2229",
  "\u2261","\u00b1","\u2265","\u2264","\u2320","\u2321","\u00f7","\u2248",
  "\u00b0","\u2219","\u00b7","\u221a","\u207f","\u00b2","\u25a0","\u00a0",
];

function defaultAttrs() {
  return { fg: null, bg: null, bold: false, underline: false, blink: false, reverse: false };
}

function newCell(ch = " ") {
  return { ch, ...defaultAttrs() };
}

export function createScreen({ cols = DEFAULT_COLS, rows = DEFAULT_ROWS } = {}) {
  if (!Number.isInteger(cols) || cols < 1) throw new RangeError(`cols must be a positive integer, got ${cols}`);
  if (!Number.isInteger(rows) || rows < 1) throw new RangeError(`rows must be a positive integer, got ${rows}`);
  const grid = [];
  for (let y = 0; y < rows; y++) {
    const line = [];
    for (let x = 0; x < cols; x++) line.push(newCell());
    grid.push(line);
  }
  return {
    cols, rows, grid,
    x: 0, y: 0,
    attrs: defaultAttrs(),
    saved: null,
    /** Characters placed, for measuring how much of a capture was text. */
    written: 0,
    /** CSI sequences seen and understood, for the same reason. */
    sequences: 0,
  };
}

/* ------------------------------------------------------------------ internals */

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function scrollUp(s, n = 1) {
  for (let i = 0; i < n; i++) {
    s.grid.shift();
    const line = [];
    for (let x = 0; x < s.cols; x++) line.push(newCell());
    s.grid.push(line);
  }
  s.y = clamp(s.y - n, 0, s.rows - 1);
}

function put(s, ch) {
  if (s.x >= s.cols) { s.x = 0; newline(s); }
  const cell = s.grid[s.y][s.x];
  cell.ch = ch;
  Object.assign(cell, s.attrs);
  s.x++;
  s.written++;
}

function newline(s) {
  if (s.y >= s.rows - 1) {
    // scrollUp moves the cursor up with the content, which is right for an
    // explicit SU but wrong here: a line feed at the bottom row must leave the
    // cursor ON the bottom row, or the next line overwrites the one above.
    scrollUp(s, 1);
    s.y = s.rows - 1;
  } else {
    s.y++;
  }
}

/** Apply one SGR parameter list. Unknown codes are ignored, as a terminal does. */
function applySgr(s, params) {
  if (params.length === 0) params = [0];        // ESC[m means ESC[0m
  for (const p of params) {
    if (p === SGR.RESET) s.attrs = defaultAttrs();
    else if (p === SGR.BOLD) s.attrs.bold = true;
    else if (p === SGR.UNDERLINE) s.attrs.underline = true;
    else if (p === SGR.BLINK) s.attrs.blink = true;
    else if (p === SGR.REVERSE) s.attrs.reverse = true;
    else if (p >= 30 && p <= 37) s.attrs.fg = ANSI_COLORS[p - 30];
    else if (p === SGR.FG_DEFAULT) s.attrs.fg = null;
    else if (p >= 40 && p <= 47) s.attrs.bg = ANSI_COLORS[p - 40];
    else if (p === SGR.BG_DEFAULT) s.attrs.bg = null;
  }
}

function eraseLine(s, y, mode) {
  const row = s.grid[y];
  const from = mode === 1 ? 0 : mode === 2 ? 0 : s.x;
  const to = mode === 1 ? s.x + 1 : s.cols;
  for (let x = from; x < to; x++) row[x] = newCell();
}

/* ----------------------------------------------------------------------- feed */

/**
 * Advance the screen through a byte stream. Accepts a string or a Uint8Array.
 * Bytes above 0x7F are taken as CP437 box-drawing characters if a table is
 * supplied, otherwise passed through; BBS art depends on them.
 */
export function feed(screen, data, { cp437 } = {}) {
  const bytes = typeof data === "string"
    ? [...data].map((c) => c.codePointAt(0))
    : Array.from(data);

  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];

    if (b === 0x1b) {                                   // ESC
      if (bytes[i + 1] === 0x5b) {                      // ESC [  -> CSI
        i += 2;
        const start = i;
        while (i < bytes.length && bytes[i] >= 0x30 && bytes[i] <= 0x3f) i++;  // params
        const paramStr = String.fromCharCode(...bytes.slice(start, i));
        const final = bytes[i];
        i++;
        screen.sequences++;
        const params = paramStr === "" ? []
          : paramStr.split(";").map((t) => (t === "" ? 0 : Number.parseInt(t, 10)));
        if (Number.isNaN(final)) break;                 // truncated stream
        applyCsi(screen, String.fromCharCode(final), params);
        continue;
      }
      if (bytes[i + 1] === 0x37) { screen.saved = { x: screen.x, y: screen.y, attrs: { ...screen.attrs } }; i += 2; continue; }
      if (bytes[i + 1] === 0x38 && screen.saved) {
        screen.x = screen.saved.x; screen.y = screen.saved.y;
        screen.attrs = { ...screen.saved.attrs }; i += 2; continue;
      }
      i += 2;                                           // any other escape: drop both bytes
      continue;
    }

    if (b === 0x0a) { newline(screen); i++; continue; }             // LF
    if (b === 0x0d) { screen.x = 0; i++; continue; }                // CR
    if (b === 0x08) { screen.x = clamp(screen.x - 1, 0, screen.cols - 1); i++; continue; }  // BS
    if (b === 0x09) {                                               // TAB to next stop of 8
      screen.x = clamp(Math.floor(screen.x / 8 + 1) * 8, 0, screen.cols - 1);
      i++; continue;
    }
    if (b < 0x20) { i++; continue; }                    // other C0: ignore

    const ch = cp437 && b >= 0x80 && cp437[b - 0x80] ? cp437[b - 0x80] : String.fromCharCode(b);
    put(screen, ch);
    i++;
  }
  return screen;
}

function applyCsi(s, final, params) {
  const n = (k, dflt) => (params.length > k && Number.isFinite(params[k]) ? params[k] : dflt);
  switch (final) {
    case "m": applySgr(s, params); return;
    case "H": case "f":                                  // CUP: 1-based row;col
      s.y = clamp(n(0, 1) - 1, 0, s.rows - 1);
      s.x = clamp(n(1, 1) - 1, 0, s.cols - 1);
      return;
    case "A": s.y = clamp(s.y - Math.max(1, n(0, 1)), 0, s.rows - 1); return;
    case "B": s.y = clamp(s.y + Math.max(1, n(0, 1)), 0, s.rows - 1); return;
    case "C": s.x = clamp(s.x + Math.max(1, n(0, 1)), 0, s.cols - 1); return;
    case "D": s.x = clamp(s.x - Math.max(1, n(0, 1)), 0, s.cols - 1); return;
    case "J": {                                          // ED
      const mode = n(0, 0);
      if (mode === 2 || mode === 3) {
        for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) s.grid[y][x] = newCell();
        if (mode === 2) { s.x = 0; s.y = 0; }
        return;
      }
      if (mode === 1) {
        for (let x = 0; x <= s.x; x++) s.grid[s.y][x] = newCell();
        for (let y = 0; y < s.y; y++) for (let x = 0; x < s.cols; x++) s.grid[y][x] = newCell();
        return;
      }
      for (let x = s.x; x < s.cols; x++) s.grid[s.y][x] = newCell();
      for (let y = s.y + 1; y < s.rows; y++) for (let x = 0; x < s.cols; x++) s.grid[y][x] = newCell();
      return;
    }
    case "K": eraseLine(s, s.y, n(0, 0)); return;         // EL
    case "d": s.y = clamp(n(0, 1) - 1, 0, s.rows - 1); return;   // VPA
    case "G": s.x = clamp(n(0, 1) - 1, 0, s.cols - 1); return;   // CHA
    case "S": scrollUp(s, Math.max(1, n(0, 1))); return;  // SU
    case "@": {                                          // ICH: insert blanks
      const count = clamp(Math.max(1, n(0, 1)), 0, s.cols - s.x);
      const row = s.grid[s.y];
      for (let k = 0; k < count; k++) row.pop();
      for (let k = 0; k < count; k++) row.splice(s.x, 0, newCell());
      return;
    }
    case "P": {                                          // DCH: delete chars
      const count = clamp(Math.max(1, n(0, 1)), 0, s.cols - s.x);
      const row = s.grid[s.y];
      row.splice(s.x, count);
      while (row.length < s.cols) row.push(newCell());
      return;
    }
    default: return;                                     // unsupported: consumed, not echoed
  }
}

/* --------------------------------------------------------------------- output */

/** The screen as plain text, trailing blanks trimmed per line. */
export function plainText(screen) {
  return screen.grid.map((row) => row.map((c) => c.ch).join("").replace(/\s+$/, "")).join("\n");
}

const CSS_FG = { black: "#000", red: "#a00", green: "#0a0", yellow: "#a50",
  blue: "#00a", magenta: "#a0a", cyan: "#0aa", white: "#aaa" };

function cellCss(c) {
  const parts = [];
  const fg = c.reverse ? (c.bg ? CSS_FG[c.bg] : "#aaa") : (c.fg ? CSS_FG[c.fg] : null);
  const bg = c.reverse ? (c.fg ? CSS_FG[c.fg] : "#000") : (c.bg ? CSS_FG[c.bg] : null);
  if (fg) parts.push(`color:${fg}`);
  if (bg) parts.push(`background:${bg}`);
  if (c.bold) parts.push("font-weight:bold");
  if (c.underline) parts.push("text-decoration:underline");
  return parts.join(";");
}

/** Render to HTML. Cells are grouped into spans so output stays small. */
export function toHtml(screen) {
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const out = [];
  for (const row of screen.grid) {
    let cur = null, buf = "", line = "";
    const flush = () => {
      // Guard on the buffer, not on the current style. Testing `cur` here
      // discarded every run of unattributed text, which is most of a BBS
      // screen, and rendered it blank.
      if (buf === "") return;
      line += cur ? `<span style="${cur}">${esc(buf)}</span>` : esc(buf);
      buf = "";
    };
    for (const cell of row) {
      const css = cellCss(cell);
      if (css !== cur) { flush(); cur = css; }
      buf += cell.ch;
    }
    flush();
    out.push(`<div class="bbs-line">${line || "&nbsp;"}</div>`);
  }
  return out.join("");
}
