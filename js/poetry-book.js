/*  Blue Squirrel BPS-7 · Poetry Book Driver
 *  ---------------------------------------------------------------
 *  Type-sets a chapbook of haikus derived from BIP-39 word phrases.
 *  The driver's job is a sequence of Pages. Pages include:
 *    - cover
 *    - title
 *    - dedication
 *    - part divider
 *    - toc (two passes — front + back of a section)
 *    - poem (single or two-poem spread)
 *    - haibun / running prose
 *    - colophon
 *
 *  The CSS @page rule + .book-page elements drive native print.
 *  --------------------------------------------------------------- */

import { CATALOG } from "./haiku-catalog.js";

/* ------------------------------------------------------------------
 * 0. Inline haikus provided by the user
 * ------------------------------------------------------------------
 *  The user-supplied haiku is the FIRST EDITION. Each "verse" line
 *  below is a sequence of BIP-39 dictionary words.  The driver
 *  treats them as raw material — we verify them against the
 *  English wordlist and re-typeset them as haiku (3 lines).
 * ------------------------------------------------------------------ */

const USER_HAIKU_LINES = [
  "dawn early light fetch help make sand castle among small island escape",
  "dawn forest meadow help make sand castle spare dad small island home",
  "dawn early light case",
  "help make sand castle dad small island feel",
  "enter then panic then abandon all hope then talk black coffee endless",
  "enter then panic then abandon all hope then chat black coffee emerge",
  "enter then panic then abandon all hope then sell black coffee emerge",
  "enter then panic then abandon all hope then sell black coffee actual",
];

/* ------------------------------------------------------------------
 * 1. BIP-39 dictionary (lazy-loaded for verification only)
 * ------------------------------------------------------------------ */
let WORD_INDEX = null;
async function getWordIndex() {
  if (WORD_INDEX) return WORD_INDEX;
  const { WORDLIST } = await import("./bip39-en.js");
  WORD_INDEX = new Set(WORDLIST);
  return WORD_INDEX;
}

/* ------------------------------------------------------------------
 * 2. Tokenise + filter
 * ------------------------------------------------------------------ */
function tokenize(line) {
  return String(line ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function splitVerses(words) {
  // 12-word BIP-39 phrase → 3 verses of 4 words (haiku-like).
  // For other lengths, split into ~3 equal lines.
  if (!words.length) return ["", "", ""];
  if (words.length >= 9 && words.length % 3 === 0) {
    const third = words.length / 3;
    return [
      words.slice(0, third).join(" "),
      words.slice(third, third * 2).join(" "),
      words.slice(third * 2).join(" "),
    ];
  }
  const third = Math.round(words.length / 3);
  return [
    words.slice(0, third).join(" "),
    words.slice(third, third * 2).join(" "),
    words.slice(third * 2).join(" "),
  ];
}

function phraseCategory(text) {
  if (/dawn|forest|meadow|island|castle|escape/.test(text)) return "Dawn & Dune";
  if (/panic|abandon|coffee|enter/.test(text)) return "Dante's Café";
  return "Etc.";
}

/* ------------------------------------------------------------------
 * 3. Source haikus
 * ------------------------------------------------------------------ */
async function buildUserHaikus() {
  const idx = await getWordIndex();
  return USER_HAIKU_LINES.map((line, i) => {
    const words = tokenize(line);
    const valid = words.every((w) => idx.has(w));
    const verses = splitVerses(words);
    return {
      id: `U${String(i + 1).padStart(2, "0")}`,
      kind: "user",
      title: `First Edition · ${i + 1}`,
      theme: phraseCategory(line),
      source: line,
      words,
      verses,
      valid,
    };
  });
}

function buildCatalogHaikus() {
  // 12-word catalog entries: poetic rows only.
  const poetic = CATALOG.filter((c) => c.type.includes("poetic"));
  return poetic.map((c, i) => {
    const words = tokenize(c.text);
    const verses = splitVerses(words);
    return {
      id: `C${String(i + 1).padStart(3, "0")}`,
      kind: "catalog",
      title: `Catalog · ${i + 1}`,
      theme: phraseCategory(c.text),
      source: c.text,
      words,
      verses,
      valid: true,
    };
  });
}

/* ------------------------------------------------------------------
 * 4. Page composer
 * ------------------------------------------------------------------ */
const PAGES = [];

function addPage(p) { PAGES.push(p); }

function buildBook(userHaikus, catalogHaikus) {
  PAGES.length = 0;

  // -- Cover
  addPage({ kind: "cover" });

  // -- Half-title
  addPage({
    kind: "title",
    title: "Dawn Coffee Castle",
    subtitle: "a small book of haiku from the BIP-39 edge",
    byline: "A First Edition",
    edition: "1 of 1",
  });

  // -- Dedication
  addPage({
    kind: "haibun",
    kicker: "Note to the reader",
    title: "How to use a printer for a poem",
    paragraphs: [
      "Each poem in this book is also a recovery phrase. Every twelve words in the BIP-39 dictionary form a complete seed; the thirteenth word of a real wallet is its checksum. We keep the checksum word out of the verses and print it on the colophon as an honest signature.",
      "Read these aloud like weather. <em>Dawn early light case.</em> <em>Help make sand castle dad small island feel.</em> The voice is the printer, the paper is the page, the ink is the only promise.",
    ],
    signature: "Blue Squirrel · BPS-7",
  });

  // -- Part I divider
  addPage({
    kind: "part",
    roman: "PART ONE",
    name: "Dawn & Dune",
    glyph: "castle",
  });

  // -- Part I poems (user + catalog ones tagged "Dawn & Dune")
  const partI = [
    ...userHaikus.filter((h) => h.theme === "Dawn & Dune"),
    ...catalogHaikus.filter((h) => h.theme === "Dawn & Dune"),
  ];
  composePoemPages(partI);

  // -- Part II divider
  addPage({ kind: "part", roman: "PART TWO", name: "Dante's Café", glyph: "coffee" });

  // -- Part II poems
  const partII = [
    ...userHaikus.filter((h) => h.theme === "Dante's Café"),
    ...catalogHaikus.filter((h) => h.theme === "Dante's Café"),
  ];
  composePoemPages(partII);

  // -- Etc. part with remaining catalog
  const etc = catalogHaikus.filter(
    (h) => h.theme !== "Dawn & Dune" && h.theme !== "Dante's Café"
  );
  if (etc.length) {
    addPage({ kind: "part", roman: "PART THREE", name: "Etc.", glyph: "leaf" });
    composePoemPages(etc);
  }

  // -- Colophon
  addPage({ kind: "colophon" });
}

function composePoemPages(haikus) {
  // 1 haiku per page (cleaner print) — single-poem layout.
  // For the very long run, we can group on the same page; but the
  // user wanted a *book*, so we want generous page-by-page layout.
  for (const h of haikus) addPage({ kind: "poem", poem: h });
}

/* ------------------------------------------------------------------
 * 5. Renderers
 * ------------------------------------------------------------------ */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const EMBLEMS = {
  castle: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="100" width="120" height="60" stroke="currentColor" stroke-width="1.2"/>
    <path d="M40 100 L40 80 L55 80 L55 90 L70 90 L70 80 L85 80 L85 90 L100 90 L100 80 L115 80 L115 90 L130 90 L130 80 L145 80 L145 90 L160 90 L160 100" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <rect x="90" y="125" width="20" height="35" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <line x1="20" y1="160" x2="180" y2="160" stroke="currentColor" stroke-width="1.2"/>
    <path d="M85 100 Q100 70 115 100" stroke="currentColor" stroke-width="1.2" fill="none"/>
  </svg>`,
  coffee: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M55 80 H140 V130 Q140 160 110 160 H85 Q55 160 55 130 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <path d="M140 95 Q165 95 165 115 Q165 135 140 135" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <path d="M75 65 Q75 50 80 45 M95 60 Q95 45 100 40 M115 65 Q115 50 120 45" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <line x1="20" y1="180" x2="180" y2="180" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="100" cy="120" r="3" fill="currentColor" opacity=".6"/>
  </svg>`,
  leaf: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 30 Q60 60 60 110 Q60 150 100 170 Q140 150 140 110 Q140 60 100 30 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <line x1="100" y1="30" x2="100" y2="170" stroke="currentColor" stroke-width="1.2"/>
    <path d="M100 70 L80 90 M100 90 L75 110 M100 110 L80 130 M100 70 L120 90 M100 90 L125 110 M100 110 L120 130" stroke="currentColor" stroke-width="1.2" fill="none"/>
  </svg>`,
  squirrel: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 130 Q50 100 70 80 Q90 65 110 70 Q140 80 145 110 Q148 130 130 145 Q110 155 90 152 Q70 148 60 130 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <path d="M55 120 Q35 90 50 60 Q70 35 100 45 Q120 55 125 75" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <path d="M120 60 Q145 45 150 70 Q152 95 130 95" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <circle cx="120" cy="115" r="2" fill="currentColor"/>
    <circle cx="135" cy="115" r="2" fill="currentColor"/>
    <path d="M125 130 Q132 132 140 130" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <path d="M65 135 Q60 155 75 160" stroke="currentColor" stroke-width="1.2" fill="none"/>
  </svg>`,
};

function renderCover(p, n, total) {
  const page = el("div", { class: "book-page cover", "data-page": n });
  page.appendChild(el("div", { class: "page-inner" }, [
    // top
    el("div", {}, [
      el("div", { class: "chip" }, [
        el("i"), el("b", {}, "Blue Squirrel"), " · BPS-7 Poetry Book Driver",
      ]),
      el("div", { class: "device-mark" }, [
        el("div", {}, ["DEVICE"]),
        el("div", {}, ["FW 0.7.2"]),
        el("div", {}, ["INK 92%"]),
        el("div", {}, ["TRAY A5 · 6×9"]),
      ]),
    ]),
    // title
    el("div", { class: "title-block" }, [
      el("h1", { html: "Dawn <em>Coffee</em><br/>Castle" }),
      el("div", { class: "sub" }, "a small book of haiku from the BIP-39 edge"),
    ]),
    // emblem watermark
    el("div", { class: "emblem", html: EMBLEMS.squirrel }),
    // colophon
    el("div", { class: "colophon" }, [
      el("div", { class: "stack" }, [
        el("div", { html: "PRINTED <b id='curDate'>—</b>" }),
        el("div", {}, `LOT ${(n).toString().padStart(4, "0")} / ${total}`),
      ]),
      el("div", { class: "stack", style: "text-align:right" }, [
        el("div", {}, "PRESS · BLUE SQUIRREL"),
        el("div", {}, "ART STUDIO · SITE-K"),
      ]),
    ]),
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]));
  return page;
}

function renderTitlePage(p, n, total) {
  const page = el("div", { class: "book-page title", "data-page": n });
  page.appendChild(el("div", { class: "page-inner" }, [
    el("div", { class: "title-block" }, [
      el("h1", { html: p.title.replace("Coffee", "<em>Coffee</em>") }),
      el("div", { class: "imprint" }, p.subtitle || ""),
      el("div", { class: "byline" }, [el("b", {}, p.byline || "")]),
    ]),
    el("div", { class: "stack" }, [
      el("div", { class: "sig" }, [el("i"), "BLUE SQUIRREL · BPS-7", el("i")]),
      el("div", { class: "sig" }, [el("i"), p.edition || "1 of 1", el("i")]),
    ]),
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]));
  return page;
}

function renderHaibun(p, n, total) {
  const page = el("div", { class: "book-page title", "data-page": n });
  const paragraphs = (p.paragraphs || []).map((t, i) => {
    const pEl = el("p", { html: t });
    if (i === 0) pEl.classList.add("lead");
    return pEl;
  });
  page.appendChild(el("div", { class: "page-inner" }, [
    el("div", { class: "running-prose" }, [
      el("div", { class: "byline", style: "margin-bottom:0.4in; text-align:center" }, [
        el("b", {}, p.kicker || "Note"),
      ]),
      el("h1", {
        style: "font-style:italic; font-size:24px; text-align:center; margin:0 0 0.4in; color:#2a1f0c; font-weight:400;",
        html: p.title || "",
      }),
      ...paragraphs,
    ]),
    el("div", { class: "stack", style: "margin-top:auto; text-align:center" }, [
      el("div", { class: "sig" }, [el("i"), p.signature || "Blue Squirrel · BPS-7", el("i")]),
    ]),
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]));
  return page;
}

function renderPart(p, n, total) {
  const page = el("div", { class: "book-page title", "data-page": n });
  const glyph = EMBLEMS[p.glyph] || EMBLEMS.leaf;
  page.appendChild(el("div", { class: "page-inner" }, [
    el("div", { class: "part" }, [
      el("div", { class: "roman" }, p.roman || ""),
      el("div", { class: "name" }, p.name || ""),
      el("div", { class: "glyph", style: "width:1.6in; color:#8a6c34", html: glyph }),
    ]),
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]));
  return page;
}

function renderPoem(p, n, total, opts) {
  const page = el("div", { class: "book-page", "data-page": n });
  const h = p.poem;
  const verseHtml = (h.verses || ["", "", ""])
    .filter((v) => v && v.trim().length)
    .map((v, i) => {
      // Capitalise first letter for typographic correctness,
      // but keep BIP-39 lowercase identity.
      const pretty = v.charAt(0).toUpperCase() + v.slice(1);
      return `<div>${escapeHtml(pretty)}</div>`;
    })
    .join("");

  const left  = h.words.slice(0, 6).join(" ");
  const right = h.words.slice(6).join(" ");

  const pageInner = el("div", { class: "page-inner" }, [
    el("div", { class: "running left" }, "DAWN · COFFEE · CASTLE"),
    el("div", { class: "running right" }, h.id),
    el("div", { class: "poem" }, [
      el("div", { class: "number" }, h.id),
      el("div", {
        class: "verse",
        html: `<div class="drop">${escapeHtml(h.verses[0]?.charAt(0).toUpperCase() || "")}</div>${verseHtml}`,
      }),
      el("div", { class: "divider" }),
      el("div", { class: "theme" }, h.theme || ""),
    ]),
    el("div", { class: "phrase-strip", html:
      `<b>PHRASE</b> · ${left} · <b>CS</b> · ${right || "—"}`
    }),
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]);

  page.appendChild(pageInner);
  return page;
}

function renderColophon(p, n, total) {
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10);
  const page = el("div", { class: "book-page colophon-page", "data-page": n });
  page.appendChild(el("div", { class: "page-inner" }, [
    el("div", { class: "colophon-inner" }, [
      el("h2", {}, "Colophon"),
      el("p", {}, "This book was set in Iowan Old Style and SFMono. The cover was painted in CSS. The haikus are BIP-39 word phrases, twelve words apiece, drawn from the curated haiku-catalog of SITE-K."),
      el("p", {}, "Each poem is one seed. The checksum word is intentionally omitted; the colophon keeps the form of the press but not the key. To re-print with a different voice, change the paper size and the ink and call window.print() again."),
      el("p", { html: "Driver: <b>Blue Squirrel BPS-7</b> · Paper: 6×9 in · Ink: deep brown · Edition: 1 of 1" }),
      el("div", { class: "stack" }, [
        el("div", { html: `PRINTED · <b>${ymd}</b>` }),
        el("div", {}, "PRESS · BLUE SQUIRREL"),
        el("div", {}, "STUDIO · SITE-K · HTML5"),
      ]),
    ]),
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]));
  return page;
}

function renderEmpty(n, total, label) {
  const page = el("div", { class: "book-page empty", "data-page": n });
  page.appendChild(el("div", { class: "page-inner" }, [
    el("div", { class: "folio bottom-center" }, `PAGE ${n} / ${total}`),
  ]));
  return page;
}

/* ------------------------------------------------------------------
 * 6. Renderer dispatcher
 * ------------------------------------------------------------------ */
function renderAll() {
  const stage = document.getElementById("stage");
  const spread = el("div", { class: "spread" });
  const total = PAGES.length;

  for (let i = 0; i < PAGES.length; i++) {
    const p = PAGES[i];
    const n = i + 1;
    let node;
    switch (p.kind) {
      case "cover":     node = renderCover(p, n, total); break;
      case "title":     node = renderTitlePage(p, n, total); break;
      case "haibun":    node = renderHaibun(p, n, total); break;
      case "part":      node = renderPart(p, n, total); break;
      case "poem":      node = renderPoem(p, n, total); break;
      case "colophon":  node = renderColophon(p, n, total); break;
      default:          node = renderEmpty(n, total, p.kind);
    }
    spread.appendChild(node);
  }

  stage.replaceChildren(spread);
  // back-fill cover date
  const d = document.getElementById("curDate");
  if (d) d.textContent = new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------
 * 7. Driver controls (paper, ink, layout, type)
 * ------------------------------------------------------------------ */
const STATE = {
  paper: "six-nine",        // six-nine | a5 | pocket
  ink: "brown",             // brown | black | blue
  typeScale: 22,            // base font size in px
  density: 0,               // 0 = one poem per page, 1 = two
  showPhrase: true,
  showRunning: true,
  source: "all",            // all | user | catalog
  search: "",
  selected: null,           // currently focused source row id
};

const PAPER = {
  "six-nine": { w: "6in", h: "9in", pad: "0.7in", name: "6 × 9 in (US trade)" },
  "a5":       { w: "5.83in", h: "8.27in", pad: "0.6in", name: "A5 (148×210 mm)" },
  "pocket":   { w: "4.25in", h: "6.87in", pad: "0.5in", name: "Pocket (107×175 mm)" },
};

function applyPaper() {
  const p = PAPER[STATE.paper] || PAPER["six-nine"];
  document.querySelectorAll(".book-page").forEach((node) => {
    node.style.width = p.w;
    node.style.minHeight = p.h;
    node.style.setProperty("--page-pad", p.pad);
  });
}

function applyInk() {
  const map = {
    brown:  { color: "#2a1f0c", accent: "#5a3a14" },
    black:  { color: "#111",    accent: "#333" },
    blue:   { color: "#0a1f3a", accent: "#1d4e8a" },
  };
  const ink = map[STATE.ink] || map.brown;
  const css = `:root { --bs-ink: ${ink.color}; } .poem .verse em, .poem .verse .drop { color: ${ink.accent}; }`;
  let style = document.getElementById("ink-style");
  if (!style) {
    style = document.createElement("style");
    style.id = "ink-style";
    document.head.appendChild(style);
  }
  style.textContent = css;
}

function applyType() {
  const size = STATE.typeScale;
  const css = `.poem .verse { font-size: ${size}px; line-height: 1.55; } .poem .verse .drop { font-size: ${Math.round(size * 1.45)}px; }`;
  let style = document.getElementById("type-style");
  if (!style) {
    style = document.createElement("style");
    style.id = "type-style";
    document.head.appendChild(style);
  }
  style.textContent = css;
}

function applyFlags() {
  const showPhrase = STATE.showPhrase;
  const showRunning = STATE.showRunning;
  const css = `
    .phrase-strip { display: ${showPhrase ? "block" : "none"}; }
    .running { display: ${showRunning ? "block" : "none"}; }
  `;
  let style = document.getElementById("flag-style");
  if (!style) {
    style = document.createElement("style");
    style.id = "flag-style";
    document.head.appendChild(style);
  }
  style.textContent = css;
}

/* ------------------------------------------------------------------
 * 8. Driver UI
 * ------------------------------------------------------------------ */
function paintSourceList(haikus) {
  const list = document.getElementById("sourceList");
  const search = STATE.search.toLowerCase();
  const filtered = haikus.filter((h) => {
    if (STATE.source === "user" && h.kind !== "user") return false;
    if (STATE.source === "catalog" && h.kind !== "catalog") return false;
    if (!search) return true;
    return h.source.toLowerCase().includes(search);
  });
  list.replaceChildren(
    ...filtered.slice(0, 200).map((h) =>
      el("div", {
        class: "item" + (STATE.selected === h.id ? " on" : ""),
        onclick: () => {
          STATE.selected = h.id;
          // scroll to that poem
          const node = document.querySelector(`.book-page[data-poem-id="${h.id}"]`);
          if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
          paintSourceList(haikus);
        },
      }, [
        el("span", { class: "n" }, h.id),
        el("span", { class: "t" }, h.verses[0] || h.source),
        el("span", { class: "tag" }, h.theme),
      ])
    )
  );
}

function setupDriver(haikus) {
  // Paper
  bindSeg("paperSeg", (val) => { STATE.paper = val; applyPaper(); });
  // Ink
  bindSeg("inkSeg", (val) => { STATE.ink = val; applyInk(); });
  // Type scale
  const size = document.getElementById("typeSize");
  const sizeVal = document.getElementById("typeVal");
  size.addEventListener("input", () => {
    STATE.typeScale = parseInt(size.value, 10);
    sizeVal.textContent = `${STATE.typeScale}px`;
    size.style.setProperty("--p", `${((STATE.typeScale - 14) / (32 - 14)) * 100}%`);
    applyType();
  });
  size.value = STATE.typeScale;
  size.dispatchEvent(new Event("input"));

  // Density
  bindSeg("densitySeg", (val) => {
    STATE.density = parseInt(val, 10);
    // Density affects whether we group poems. For simplicity we
    // keep it as a flag for now; re-render is not needed because
    // the page layout is already sparse.
  });

  // Toggles
  const phraseT = document.getElementById("togglePhrase");
  const runningT = document.getElementById("toggleRunning");
  phraseT.classList.toggle("on", STATE.showPhrase);
  runningT.classList.toggle("on", STATE.showRunning);
  phraseT.addEventListener("click", () => {
    STATE.showPhrase = !STATE.showPhrase;
    phraseT.classList.toggle("on", STATE.showPhrase);
    applyFlags();
  });
  runningT.addEventListener("click", () => {
    STATE.showRunning = !STATE.showRunning;
    runningT.classList.toggle("on", STATE.showRunning);
    applyFlags();
  });

  // Source
  bindSeg("sourceSeg", (val) => { STATE.source = val; paintSourceList(haikus); });

  // Search
  const search = document.getElementById("sourceSearch");
  search.addEventListener("input", () => {
    STATE.search = search.value;
    paintSourceList(haikus);
  });

  // Print
  document.getElementById("btnPrint").addEventListener("click", () => {
    window.print();
  });
  // Reload
  document.getElementById("btnReload").addEventListener("click", async () => {
    await rerender();
  });
  // Page count
  const jobEl = document.getElementById("jobPages");
  if (jobEl) jobEl.textContent = `${PAGES.length} pages`;
}

function bindSeg(id, fn) {
  const root = document.getElementById(id);
  root.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      root.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      fn(b.dataset.val);
    });
  });
}

/* ------------------------------------------------------------------
 * 9. Bootstrap
 * ------------------------------------------------------------------ */
let lastUser = [], lastCat = [];
async function rerender() {
  lastUser = await buildUserHaikus();
  lastCat = buildCatalogHaikus();
  buildBook(lastUser, lastCat);
  renderAll();
  applyPaper();
  applyInk();
  applyType();
  applyFlags();
  // attach poem id to .book-page elements that render poems
  document.querySelectorAll(".book-page").forEach((node, idx) => {
    const p = PAGES[idx];
    if (p && p.kind === "poem") node.dataset.poemId = p.poem.id;
  });
  paintSourceList([...lastUser, ...lastCat]);
  const jobEl = document.getElementById("jobPages");
  if (jobEl) jobEl.textContent = `${PAGES.length} pages`;
}

async function main() {
  await rerender();
  setupDriver([...lastUser, ...lastCat]);
  document.getElementById("curDate").textContent = new Date()
    .toISOString()
    .slice(0, 10);
}

main().catch((err) => {
  console.error(err);
  const stage = document.getElementById("stage");
  if (stage) {
    stage.replaceChildren(
      el("div", { style: "padding:40px;color:#ff8c9d;font-family:monospace" }, err.message || String(err))
    );
  }
});
