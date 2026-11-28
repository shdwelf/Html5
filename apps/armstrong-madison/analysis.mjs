/** Original, bounded audit of an editorial transcription. No plaintext recovery is claimed. */
export function editionBody(text) {
  const start = text.indexOf('\nThe\n\n');
  const end = text.indexOf('\nI have the honor', start);
  if (start < 0 || end < 0) throw new Error('The edition must retain its clear opening and closing anchors.');
  return text.slice(start + '\nThe\n\n'.length, end).trim();
}

export function parseEdition(text) {
  const body = editionBody(text);
  const lines = body.split('\n');
  const tokens = [];
  const pattern = /(\d+) lines? of symbols|\d+(?:⟨[^⟩]*⟩)?|\bsymbols?\b/gu;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    for (const match of line.matchAll(pattern)) {
      if (match[1]) {
        tokens.push({ kind: 'glyph', line: index + 1, printed: match[0], spans: Number(match[1]), wholeLines: true });
      } else if (/^\d/u.test(match[0])) {
        const value = Number.parseInt(match[0], 10);
        if (value < 1 || value > 1900) throw new Error('Unexpected numeric reading.');
        tokens.push({ kind: 'number', line: index + 1, printed: match[0], value, complete: !match[0].includes('⟨') });
      } else {
        tokens.push({ kind: 'glyph', line: index + 1, printed: match[0], spans: 1, wholeLines: false });
      }
    }
    // Fail on unexplained prose instead of silently converting arbitrary source text into code.
    if (line.replace(pattern, '').replace(/[.\s]/gu, '')) throw new Error(`Unexpected editorial text on body line ${index + 1}.`);
  }
  return { body, lines, tokens };
}

export function validateKey(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Use a JSON object of code numbers and text labels.');
  const entries = Object.entries(value);
  if (entries.length > 1900) throw new Error('At most 1,900 labels are allowed.');
  const result = Object.create(null);
  for (const [code, label] of entries) {
    if (!/^[1-9]\d{0,3}$/u.test(code) || Number(code) > 1900) throw new Error(`Invalid code number: ${code.slice(0, 20)}`);
    if (typeof label !== 'string' || !label.trim() || label.length > 80 || /[\u0000-\u001f\u007f]/u.test(label)) throw new Error(`Code ${code} needs a text label of 1–80 characters, without control characters.`);
    result[code] = label.trim();
  }
  // Bound the pretty JSON used by exports as well as inputs. Any accepted map
  // must remain importable after an explicit save/export, including escaping.
  if ((JSON.stringify(result, null, 2) + '\n').length > 96000) throw new Error('The complete key must fit in 96,000 exported JSON characters.');
  return result;
}

export function parseKey(text) {
  if (typeof text !== 'string' || text.length > 96000) throw new Error('The key must be at most 96,000 text characters.');
  return validateKey(JSON.parse(text));
}

export function numericReadings(tokens, includeDamaged = false) {
  return tokens.filter((token) => token.kind === 'number' && (includeDamaged || token.complete)).map((token) => token.value);
}

export function audit(tokens, inputKey, includeDamaged = false) {
  const key = validateKey(inputKey);
  const readings = numericReadings(tokens, includeDamaged);
  const counts = new Map();
  for (const value of readings) counts.set(value, (counts.get(value) || 0) + 1);
  const frequency = [...counts].map(([code, count]) => ({ code, count, label: key[code] || null })).sort((a, b) => b.count - a.count || a.code - b.code);
  const mapped = readings.filter((number) => Object.hasOwn(key, number)).length;
  const glyphs = tokens.filter((token) => token.kind === 'glyph');
  return {
    total: readings.length,
    distinct: counts.size,
    mapped,
    unmapped: readings.length - mapped,
    coveragePercent: readings.length ? 100 * mapped / readings.length : 0,
    mappedDistinct: [...counts.keys()].filter((number) => Object.hasOwn(key, number)).length,
    keyEntries: Object.keys(key).length,
    absentKeyCodes: Object.keys(key).map(Number).filter((number) => !counts.has(number)).sort((a, b) => a - b),
    damagedReadings: tokens.filter((token) => token.kind === 'number' && !token.complete).length,
    glyphDescriptors: glyphs.length,
    glyphSpans: glyphs.reduce((sum, token) => sum + token.spans, 0),
    wholeGlyphLines: glyphs.filter((token) => token.wholeLines).reduce((sum, token) => sum + token.spans, 0),
    min: Math.min(...readings),
    max: Math.max(...readings),
    frequency,
    trailingZeroPairs: [...counts.keys()].sort((a, b) => a - b).filter((number) => counts.has(number * 10)).map((number) => [number, number * 10]),
  };
}

export function words(text) { return text.toLowerCase().match(/[a-z]+/gu) || []; }

/** A permissive in-order upper bound, allowing omissions. It is NOT a decryption or statistical test. */
export function subsequenceAudit(tokens, inputKey, claimedPlaintext, includeDamaged = false) {
  const key = validateKey(inputKey);
  const sequence = numericReadings(tokens, includeDamaged).map((number) => key[number] || null);
  const claimed = words(claimedPlaintext);
  const previous = new Uint16Array(claimed.length + 1);
  for (const label of sequence) {
    let diagonal = 0;
    for (let j = 1; j <= claimed.length; j++) {
      const above = previous[j];
      previous[j] = label?.toLowerCase() === claimed[j - 1] ? diagonal + 1 : Math.max(above, previous[j - 1]);
      diagonal = above;
    }
  }
  const labels = new Set(Object.values(key).map((label) => label.toLowerCase()));
  return {
    claimWords: claimed.length,
    matchedInOrder: previous[claimed.length],
    unmatchedClaimWords: claimed.length - previous[claimed.length],
    mappedOccurrencesNotUsedByBestSubsequence: sequence.filter(Boolean).length - previous[claimed.length],
    claimWordsWithNoKeyLabel: [...new Set(claimed.filter((word) => !labels.has(word)))].sort(),
    caveat: 'Literal number-to-one-word model asserted by the published key; clear opening The and graphical passages are not supplied as wildcard words. Omissions are allowed only for this diagnostic score, not accepted as a complete decipherment.',
  };
}

export function comparisonReadings(text) {
  return text.split('\n').filter((line) => !line.startsWith('#')).flatMap((line) => line.split(/\s+/u).filter((token) => /^\d+$/u.test(token)).map(Number));
}

export function makeReceipt(transcript, inputKey, claim, comparison) {
  const { body, tokens } = parseEdition(transcript);
  const strict = audit(tokens, inputKey);
  const provisional = audit(tokens, inputKey, true);
  const naive = (body.match(/\d+/gu) || []).map(Number);
  const compared = comparisonReadings(comparison);
  const frequencies = (sequence) => sequence.reduce((map, number) => { map[number] = (map[number] || 0) + 1; return map; }, Object.create(null));
  const baseline = frequencies(numericReadings(tokens, true));
  const suspect = frequencies(compared);
  return {
    schemaVersion: 1,
    scope: 'Normalized Founders Online editorial text, not a newly collated manuscript or a recovered plaintext.',
    strict,
    provisional,
    githubComparison: {
      total: compared.length,
      mapped: compared.filter((number) => Object.hasOwn(inputKey, number)).length,
      equalsNaiveDigitExtraction: JSON.stringify(compared) === JSON.stringify(naive),
      extraOccurrences: Object.keys(suspect).map(Number).filter((number) => suspect[number] > (baseline[number] || 0)).map((code) => ({ code, extra: suspect[code] - (baseline[code] || 0) })),
      explanation: 'The comparison stream includes the editorial 2 in 2 lines of symbols and two editorial 1s in 1 line of symbols. These are not cipher numbers.',
    },
    alignment: subsequenceAudit(tokens, inputKey, claim),
    limitations: [
      'The damaged 17⟨   ⟩ is excluded in strict mode and provisionally read as 17 only in the alternate mode.',
      'Founders prints 203; Tomokiyo and the attachment instead suggest 1203. No silent repair is made.',
      'The 34 editorial graphic descriptions expand to 35 passage/line placeholders, not 35 identified shorthand symbols or words.',
      'Mapping coverage and a permissive subsequence score do not measure correctness or establish the plaintext.',
      'Manuscript facsimiles and a full graphical transcription have not been acquired or visually collated in this review.',
    ],
  };
}
