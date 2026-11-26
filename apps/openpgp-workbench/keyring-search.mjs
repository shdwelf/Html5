/** Display-only search of validated PUBLIC metadata. Never an identity, import,
 * recipient, recovery or export-authorization decision. No armor/secret input. */
export const PUBLIC_SEARCH_LIMITS = Object.freeze({ queryCharacters: 128, terms: 8, certificates: 32, userIDs: 32, userIDCharacters: 2048, fuzzyWordCharacters: 64 });
const comparison = (text) => text.normalize("NFC").toLowerCase().normalize("NFC");
const words = (text) => text.match(/[\p{L}\p{M}\p{N}]+/gu) || [];

// Banded optimal-string-alignment distance, capped at 1 or 2 edits. Three
// rows, Unicode code points, adjacent swaps; never a regular expression built
// from user input. Called only for bounded name/email words, not fingerprints.
function wordDistance(a, b, maximum) {
  const outside = maximum + 1;
  if (Math.abs(a.length - b.length) > maximum) return outside;
  let previousPrevious = new Uint16Array(b.length + 1).fill(outside);
  let previous = new Uint16Array(b.length + 1).fill(outside);
  let row = new Uint16Array(b.length + 1);
  for (let j = 0; j <= Math.min(b.length, maximum); j++) previous[j] = j;
  for (let i = 1; i <= a.length; i++) {
    row.fill(outside);
    if (i <= maximum) row[0] = i;
    for (let j = Math.max(1, i - maximum); j <= Math.min(b.length, i + maximum); j++) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], previousPrevious[j - 2] + 1);
    }
    [previousPrevious, previous, row] = [previous, row, previousPrevious];
  }
  return Math.min(outside, previous[b.length]);
}

/** Stable exact-before-fuzzy results. Original entries/UIDs are never changed.
 * Short (1–2 character) name/email terms use literal substring matching only;
 * 3–5 code points allow one edit, 6–64 allow two. Every term must match.
 * Hex-looking queries of 8+ digits are an EXACT fingerprint substring filter
 * only, never fuzzy UID fallbacks or authorization using a short key ID.
 */
export function searchPublicCertificates(entries, query = "") {
  if (!Array.isArray(entries) || entries.length > PUBLIC_SEARCH_LIMITS.certificates) throw new RangeError("Search only a bounded validated public keyring.");
  if (typeof query !== "string" || query.length > PUBLIC_SEARCH_LIMITS.queryCharacters) throw new RangeError("Use at most 128 search characters and eight name/email terms.");
  const needle = comparison(query).trim().replace(/\s+/gu, " ");
  if (!needle) return entries.map((entry) => ({ entry, score: 0, kind: "all" }));
  const fingerprint = needle.replace(/[ \t\r\n]/g, "").toUpperCase();
  if (/^[0-9A-F]{8,}$/.test(fingerprint)) {
    return entries.filter((entry) => entry.fingerprint.includes(fingerprint)).map((entry) => ({ entry, score: 0, kind: "fingerprint" }));
  }
  const terms = words(needle);
  if (terms.length > PUBLIC_SEARCH_LIMITS.terms) throw new RangeError("Use at most 128 search characters and eight name/email terms.");
  const needles = terms.map((term) => Array.from(term));
  const matches = [];
  for (const [order, entry] of entries.entries()) {
    if (!Array.isArray(entry.userIDs) || entry.userIDs.length > PUBLIC_SEARCH_LIMITS.userIDs || entry.userIDs.some((uid) => typeof uid !== "string" || uid.length > PUBLIC_SEARCH_LIMITS.userIDCharacters)) throw new RangeError("Search only bounded public User IDs.");
    const text = entry.userIDs.map(comparison).join("\n");
    if (text.includes(needle)) {
      matches.push({ entry, score: 0, kind: "text", order });
      continue;
    }
    if (!terms.length) continue; // Punctuation is literal, not a wildcard.
    let tokens, score = 0;
    for (let index = 0; index < terms.length; index++) {
      if (text.includes(terms[index])) continue;
      const a = needles[index];
      const maximum = a.length < 3 || a.length > PUBLIC_SEARCH_LIMITS.fuzzyWordCharacters ? 0 : a.length < 6 ? 1 : 2;
      if (!maximum) { score = Infinity; break; }
      tokens ??= [...new Set(words(text))].filter((word) => word.length <= (PUBLIC_SEARCH_LIMITS.fuzzyWordCharacters + 2) * 2).map((word) => Array.from(word));
      let best = maximum + 1;
      for (const b of tokens) {
        best = Math.min(best, wordDistance(a, b, maximum));
        if (best === 1) break; // Zero distance was already caught by includes.
      }
      if (best > maximum) { score = Infinity; break; }
      score += best;
    }
    if (Number.isFinite(score)) matches.push({ entry, score, kind: score ? "fuzzy" : "text", order });
  }
  return matches.sort((a, b) => a.score - b.score || a.order - b.order).map(({ order, ...match }) => match);
}
