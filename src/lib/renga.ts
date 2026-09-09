import { countSyllables } from "./syllables";
import { validateMnemonic, WORDLIST } from "./wallet";

/** Gen2 Poetry engine treats renga as a five-line 5-7-5-7-7 (hokku + wakiku). */
export const RENGA_PATTERN = [5, 7, 5, 7, 7] as const;

/**
 * Featured 18-word BIP-39 phrase. The words are all on the English wordlist
 * and the checksum is valid; they also partition exactly into tan-renga.
 */
export const CANONICAL_RENGA_MNEMONIC =
  "morning brief captain suspect great weather again chronic leaf harvest other night rookie erase rival web design domain";

export interface VerseLine {
  words: string[];
  syllables: number;
}

export interface RengaStanza {
  type: "hokku" | "wakiku";
  label: string;
  lines: VerseLine[];
}

export interface RengaSplit {
  words: string[];
  lines: VerseLine[];
  counts: number[];
  stanzas: RengaStanza[];
  remainder: string[];
  valid: boolean;
}

function takeExact(words: string[], start: number, target: number): { next: number; line: VerseLine } | null {
  let acc = 0;
  const taken: string[] = [];
  for (let i = start; i < words.length; i++) {
    const n = countSyllables(words[i]);
    if (n <= 0 || acc + n > target) return null;
    taken.push(words[i]);
    acc += n;
    if (acc === target) return { next: i + 1, line: { words: taken, syllables: acc } };
  }
  return null;
}

function takeTargets(
  words: string[],
  start: number,
  targets: readonly number[],
): { next: number; lines: VerseLine[] } | null {
  const lines: VerseLine[] = [];
  let i = start;
  for (const target of targets) {
    const taken = takeExact(words, i, target);
    if (!taken) return null;
    lines.push(taken.line);
    i = taken.next;
  }
  return { next: i, lines };
}

/**
 * Pack a word sequence into linked verse: hokku 5-7-5, wakiku 7-7, repeating.
 * Cuts are unique because the words stay in order and each line must land
 * exactly on its syllable target.
 */
export function packRenga(words: string[]): RengaSplit {
  const cleaned = words.map((w) => w.toLowerCase().trim()).filter(Boolean);
  const stanzas: RengaStanza[] = [];
  const lines: VerseLine[] = [];
  let i = 0;
  let hokkuTurn = true;

  while (i < cleaned.length) {
    if (hokkuTurn) {
      const taken = takeTargets(cleaned, i, [5, 7, 5]);
      if (!taken) break;
      stanzas.push({ type: "hokku", label: "hokku 5-7-5", lines: taken.lines });
      lines.push(...taken.lines);
      i = taken.next;
    } else {
      const taken = takeTargets(cleaned, i, [7, 7]);
      if (!taken) break;
      stanzas.push({ type: "wakiku", label: "wakiku 7-7", lines: taken.lines });
      lines.push(...taken.lines);
      i = taken.next;
    }
    hokkuTurn = !hokkuTurn;
  }

  const remainder = cleaned.slice(i);
  const counts = lines.map((line) => line.syllables);
  const valid =
    remainder.length === 0 &&
    stanzas.length > 0 &&
    counts.length === RENGA_PATTERN.length &&
    counts.every((n, idx) => n === RENGA_PATTERN[idx]);

  return { words: cleaned, lines, counts, stanzas, remainder, valid };
}

export function splitCanonicalRenga(): RengaSplit {
  return packRenga(CANONICAL_RENGA_MNEMONIC.split(" "));
}

export interface HaibunBeat {
  kind: "prose" | "hokku" | "wakiku";
  text?: string;
}

export interface Haibun {
  title: string;
  kigo: string;
  season: string;
  form: string;
  epigraph: string;
  beats: HaibunBeat[];
  colophon: string;
}

/** Crafted camouflage: a complete haibun whose linked verse *is* the seed. */
export const CANONICAL_HAIBUN: Haibun = {
  title: "Two Voices at Harvest",
  kigo: "harvest",
  season: "autumn",
  form: "tan-renga haibun",
  epigraph: "The second verse is the rookie's.",
  beats: [
    {
      kind: "prose",
      text:
        "The harbour woke before the bells. Coffee had gone cold on the chart table; first light found a sleeve-print on the glass, a circle someone had wiped and then forgotten. Through it the water was the colour of cooled tea.",
    },
    {
      kind: "prose",
      text:
        "He did not raise his voice. He never had. The young watch stood with their hands behind their backs and let the wind be the only thing that appeared to listen. In the log, in the small hand his teacher had required of him on another coast, he folded the day into seventeen beats — the opening verse, which is called hokku, and which must carry the season.",
    },
    { kind: "hokku" },
    {
      kind: "prose",
      text:
        "Beyond the yards the hills were already being stripped. It happened every year: a long illness in the trees that the orchardists named as doctors name things, and a gathering that would not wait for any calendar. The air smelled of tannin and diesel. Nets of leaves moved down the slopes like dark water.",
    },
    {
      kind: "prose",
      text:
        "On the afterdeck a new hand — two winters on this boat and still called new — kept a notebook of other people's skies. She read the three lines. She frowned in the good way, which is the way a second poet is supposed to frown, and she answered him with fourteen beats. Linked verse does not comment. It steps aside.",
    },
    { kind: "wakiku" },
    {
      kind: "prose",
      text:
        "They did not discuss what the verses meant. A briefing is one kind of morning; a renga is another. He blotted the page. She closed the book. The watch changed. The hills kept losing their colour. The water kept the colour of cooled tea.",
    },
    {
      kind: "prose",
      text:
        "By dusk the notebook had been slid into a drawer of tide tables, between a pencil stub and a card for a dentist in a town they would not reach this season. Later a stranger, looking for a chart, would take the whole drawer for miscellany and the notebook for a poem. Which is what it was.",
    },
  ],
  colophon:
    "Written as tan-renga: hokku 5-7-5, wakiku 7-7. Season word: harvest — autumn. Printed for the drawer.",
};

const GENERIC_BEFORE =
  "The page was left open on the desk. Someone had been counting beats on their fingers. The first hand wrote the season into seventeen, which is how a renga is supposed to begin.";
const GENERIC_MIDDLE =
  "A second hand answered, as linked verse requires — not a comment, a step aside. Fourteen beats, nothing extra.";
const GENERIC_AFTER =
  "The rest of the notebook was tide tables and grocery lists. Later a stranger would take the whole thing for a poem, which is what it was.";

export function haibunForMnemonic(mnemonic: string): { haibun: Haibun; renga: RengaSplit; canonical: boolean } {
  const phrase = mnemonic.toLowerCase().trim().replace(/\s+/g, " ");
  const renga = packRenga(phrase.split(" "));
  const canonical = phrase === CANONICAL_RENGA_MNEMONIC;
  if (canonical) return { haibun: CANONICAL_HAIBUN, renga, canonical: true };

  const hokku = renga.stanzas.find((s) => s.type === "hokku");
  const wakiku = renga.stanzas.find((s) => s.type === "wakiku");
  return {
    canonical: false,
    renga,
    haibun: {
      title: "A Poem Left in a Drawer",
      kigo: hokku?.lines[2]?.words.slice(-1)[0] ?? "season",
      season: "unspecified",
      form: renga.valid ? "tan-renga haibun" : "unscanned verse",
      epigraph: "Camouflaged as linked verse.",
      beats: [
        { kind: "prose", text: GENERIC_BEFORE },
        ...(hokku ? [{ kind: "hokku" as const }] : []),
        { kind: "prose", text: GENERIC_MIDDLE },
        ...(wakiku ? [{ kind: "wakiku" as const }] : []),
        { kind: "prose", text: GENERIC_AFTER },
      ],
      colophon: renga.valid
        ? "Written as tan-renga: hokku 5-7-5, wakiku 7-7. The verses are the whole of it."
        : "The words do not land on 5-7-5 / 7-7. The notebook still closes.",
    },
  };
}

/** Recover the mnemonic spine from renga lines, in order. */
export function mnemonicFromRenga(split: RengaSplit): string {
  return split.lines.flatMap((line) => line.words).join(" ");
}

export function lineText(line: VerseLine): string {
  return line.words.join(" ");
}

/** Self-contained literary HTML — no BIP-39 vocabulary, suitable as camouflage. */
export function renderCamouflageHtml(haibun: Haibun, renga: RengaSplit, reveal = false): string {
  const stanzaHtml = (type: "hokku" | "wakiku") => {
    const stanza = renga.stanzas.find((s) => s.type === type);
    if (!stanza) return "";
    const lines = stanza.lines
      .map((line) => {
        const words = line.words
          .map((w) => (reveal ? `<mark class="seed">${escapeHtml(w)}</mark>` : escapeHtml(w)))
          .join(" ");
        return `<span class="line">${words}</span>`;
      })
      .join("");
    return `<blockquote class="renga ${type}" cite="${type}">${lines}</blockquote>`;
  };

  const body = haibun.beats
    .map((beat) => {
      if (beat.kind === "prose") return `<p>${escapeHtml(beat.text ?? "")}</p>`;
      return stanzaHtml(beat.kind);
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(haibun.title)}</title>
<style>
  :root { --ink:#1a1714; --paper:#f4efe4; --accent:#9c2b1a; --mute:#6b6458; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font: 20px/1.7 "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif; }
  article { max-width: 38rem; margin: 0 auto; padding: 3.5rem 1.5rem 5rem; }
  header { text-align:center; margin-bottom: 2.8rem; }
  h1 { font-weight: 500; font-size: 2rem; letter-spacing: .04em; margin: 0 0 .4rem; }
  .meta { color: var(--mute); font-size: .85rem; font-style: italic; }
  p { text-indent: 1.4em; margin: 0 0 .9em; }
  p:first-of-type { text-indent: 0; }
  blockquote.renga { margin: 1.8rem 0 1.8rem 1.5rem; padding: 0; border: 0; font-style: italic; }
  .line { display:block; }
  mark.seed { background: transparent; color: var(--accent); font-style: italic; padding: 0; }
  footer { margin-top: 3rem; border-top: 1px solid #d7d0c3; padding-top: 1rem; color: var(--mute); font-size: .8rem; font-style: italic; }
</style>
</head>
<body>
<article>
<header>
  <h1>${escapeHtml(haibun.title)}</h1>
  <p class="meta">${escapeHtml(haibun.form)} · ${escapeHtml(haibun.season)} · ${escapeHtml(haibun.epigraph)}</p>
</header>
${body}
<footer>${escapeHtml(haibun.colophon)}</footer>
</article>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const CANONICAL_HOKKU =
  "morning brief captain\nsuspect great weather again\nchronic leaf harvest";
export const CANONICAL_WAKIKU =
  "other night rookie erase\nrival web design domain";

export function tokenizeWords(text: string): string[] {
  return (text.toLowerCase().match(/\?|[a-z]+/g) ?? []).filter(Boolean);
}

export interface TanRengaMerge {
  hokkuWords: string[];
  wakikuWords: string[];
  mnemonic: string;
  renga: RengaSplit;
  meterValid: boolean;
  checksumValid: boolean;
  blanks: number;
}

function stanzaWords(text: string): string[] {
  return tokenizeWords(text).filter((w) => w === "?" || WORDLIST.includes(w) || /^[a-z]+$/.test(w));
}

/**
 * Merge a hokku (5-7-5) with its wakiku (7-7) — the two voices of a tan-renga —
 * into a single spine. Meter and BIP-39 checksum are checked independently.
 */
export function mergeTanRenga(hokkuText: string, wakikuText: string): TanRengaMerge {
  const hokkuWords = stanzaWords(hokkuText).filter((w) => w !== "?");
  const wakikuTokens = stanzaWords(wakikuText);
  const wakikuWords = wakikuTokens.filter((w) => w !== "?");
  const combined = [...stanzaWords(hokkuText), ...wakikuTokens];
  const known = combined.filter((w) => w !== "?");
  const renga = packRenga(known);
  const mnemonic = known.join(" ");
  const blanks = combined.filter((w) => w === "?").length;
  return {
    hokkuWords,
    wakikuWords,
    mnemonic,
    renga,
    meterValid: renga.valid,
    checksumValid: blanks === 0 && mnemonic.length > 0 && validateMnemonic(mnemonic),
    blanks,
  };
}

export function splitVoices(mnemonic: string): { hokku: string; wakiku: string } | null {
  const renga = packRenga(tokenizeWords(mnemonic));
  const hokku = renga.stanzas.find((s) => s.type === "hokku");
  const wakiku = renga.stanzas.find((s) => s.type === "wakiku");
  if (!hokku || !wakiku) return null;
  return {
    hokku: hokku.lines.map(lineText).join("\n"),
    wakiku: wakiku.lines.map(lineText).join("\n"),
  };
}

function lineSyllables(words: string[]): number {
  return words.reduce((sum, w) => sum + countSyllables(w), 0);
}

/**
 * Pull a tan-renga out of camouflage: consecutive lines whose BIP-39 words
 * land on 5-7-5 / 7-7, or a piped five-line verse.
 */
export function extractTanRenga(text: string): TanRengaMerge | null {
  const stripped = text.replace(/<[^>]+>/g, "\n");
  const rows = stripped
    .split(/\r?\n/)
    .map((line) => tokenizeWords(line).filter((w) => WORDLIST.includes(w)))
    .filter((words) => words.length > 0);

  const wordlistOnly = rows.filter((words) => lineSyllables(words) === 5 || lineSyllables(words) === 7);
  for (let i = 0; i <= wordlistOnly.length - 5; i++) {
    const counts = wordlistOnly.slice(i, i + 5).map(lineSyllables);
    if (counts[0] === 5 && counts[1] === 7 && counts[2] === 5 && counts[3] === 7 && counts[4] === 7) {
      const hokku = wordlistOnly
        .slice(i, i + 3)
        .map((w) => w.join(" "))
        .join("\n");
      const wakiku = wordlistOnly
        .slice(i + 3, i + 5)
        .map((w) => w.join(" "))
        .join("\n");
      return mergeTanRenga(hokku, wakiku);
    }
  }

  const voices = splitVoices(stripped);
  if (voices) {
    const merged = mergeTanRenga(voices.hokku, voices.wakiku);
    if (merged.meterValid) return merged;
  }
  return null;
}

/**
 * Fill a single unread (`?`) slot so the merged voices both scan as tan-renga
 * and carry a valid BIP-39 checksum — the rookie's closing word is the usual case.
 */
export function solveTanRengaChecksum(hokkuText: string, wakikuText: string): TanRengaMerge[] {
  const hokkuTokens = stanzaWords(hokkuText);
  const wakikuTokens = stanzaWords(wakikuText);
  const tokens = [...hokkuTokens, ...wakikuTokens];
  const blanks = tokens.map((w, i) => (w === "?" ? i : -1)).filter((i) => i >= 0);
  if (blanks.length === 0) {
    const merged = mergeTanRenga(hokkuText, wakikuText);
    return merged.checksumValid && merged.meterValid ? [merged] : [];
  }
  if (blanks.length > 1) return [];

  const idx = blanks[0];
  const hits: TanRengaMerge[] = [];
  for (const word of WORDLIST) {
    const next = [...tokens];
    next[idx] = word;
    const merged = mergeTanRenga(
      next.slice(0, hokkuTokens.length).join(" "),
      next.slice(hokkuTokens.length).join(" "),
    );
    if (merged.meterValid && merged.checksumValid) hits.push(merged);
  }
  return hits;
}
