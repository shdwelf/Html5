const DECIMAL_PAIR = /(^|[^\w.])([-+]?(?:\d{1,3}\.\d{2,}|\.\d{2,}))\s*(?:[,;|/]\s*|\s+)([-+]?(?:\d{1,3}\.\d{2,}|\.\d{2,}))(?![\w.])/g;
const LABELLED_VALUE = /\b(lat(?:itude)?|lon(?:gitude)?|lng)\b\s*[:=]\s*([-+]?(?:\d{1,3}(?:\.\d+)?|\.\d+))/gi;
const DMS_PAIR = /([0-9]{1,2})\s*(?:°|deg(?:rees?)?\b)\s*([0-9]{1,2})\s*(?:['′]|min(?:utes?)?\b)\s*([0-9]{1,2}(?:\.\d+)?)\s*(?:["″]|sec(?:onds?)?\b)?\s*([NS])\s*[,;|/]\s*([0-9]{1,3})\s*(?:°|deg(?:rees?)?\b)\s*([0-9]{1,2})\s*(?:['′]|min(?:utes?)?\b)\s*([0-9]{1,2}(?:\.\d+)?)\s*(?:["″]|sec(?:onds?)?\b)?\s*([EW])/i;

function isLatitude(value) {
  return Number.isFinite(value) && Math.abs(value) <= 90;
}

function isLongitude(value) {
  return Number.isFinite(value) && Math.abs(value) <= 180;
}

function pairInterpretations(first, second, order = "unlabelled") {
  const possibilities = [];
  if (isLatitude(first) && isLongitude(second)) {
    possibilities.push({ latitude: first, longitude: second, order: order === "unlabelled" ? "first=latitude" : order });
  }
  if (isLatitude(second) && isLongitude(first) && (first !== second || possibilities.length === 0)) {
    possibilities.push({ latitude: second, longitude: first, order: order === "unlabelled" ? "first=longitude" : order });
  }
  return possibilities;
}

function signForHemisphere(value, hemisphere) {
  const absolute = Math.abs(value);
  return /[SW]/i.test(hemisphere) ? -absolute : absolute;
}

function formatCandidate(candidate) {
  return `lat ${candidate.latitude}, lon ${candidate.longitude} (${candidate.order})`;
}

/**
 * Finds textual coordinate-like values in printable SWF strings.
 *
 * These are leads, not verified locations: decimal pairs with no labels retain
 * both valid axis interpretations when possible. Binary/calculated ActionScript
 * coordinates are out of scope for this printable-string pass.
 */
export function scanFlashCoordinateCandidates(strings, { limit = 100 } = {}) {
  const results = [];
  const seen = new Set();

  function add(text, format, candidates) {
    if (!candidates.length) return;
    const normalizedText = String(text).trim().slice(0, 240);
    const uniqueCandidates = candidates.filter((candidate, index, list) =>
      list.findIndex((other) => other.latitude === candidate.latitude && other.longitude === candidate.longitude) === index
    );
    if (!uniqueCandidates.length) return;
    const key = `${format}|${normalizedText}|${uniqueCandidates.map((candidate) => `${candidate.latitude},${candidate.longitude}`).join(";")}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ text: normalizedText, format, candidates: uniqueCandidates });
  }

  for (const value of strings || []) {
    if (results.length >= limit) break;
    const text = String(value ?? "");
    if (!text || text.length > 8192) continue;

    const labelled = [];
    for (const match of text.matchAll(LABELLED_VALUE)) {
      const label = match[1].toLowerCase().startsWith("lat") ? "latitude" : "longitude";
      const number = Number(match[2]);
      if (Number.isFinite(number)) labelled.push({ label, number });
    }
    for (let i = 0; i + 1 < labelled.length; i++) {
      const first = labelled[i];
      const second = labelled[i + 1];
      if (first.label === second.label) continue;
      const latitude = first.label === "latitude" ? first.number : second.number;
      const longitude = first.label === "longitude" ? first.number : second.number;
      if (isLatitude(latitude) && isLongitude(longitude)) {
        add(text, "labelled decimal", [{ latitude, longitude, order: "explicit labels" }]);
        break;
      }
    }

    const dms = DMS_PAIR.exec(text);
    DMS_PAIR.lastIndex = 0;
    if (dms) {
      const latitude = signForHemisphere(Number(dms[1]) + Number(dms[2]) / 60 + Number(dms[3]) / 3600, dms[4]);
      const longitude = signForHemisphere(Number(dms[5]) + Number(dms[6]) / 60 + Number(dms[7]) / 3600, dms[8]);
      if (isLatitude(latitude) && isLongitude(longitude)) {
        add(dms[0], "degrees/minutes/seconds", [{ latitude, longitude, order: "N/S then E/W" }]);
      }
    }

    DECIMAL_PAIR.lastIndex = 0;
    for (const match of text.matchAll(DECIMAL_PAIR)) {
      const first = Number(match[2]);
      const second = Number(match[3]);
      const candidates = pairInterpretations(first, second);
      add(match[0].trim(), "unlabelled decimal pair", candidates);
      if (results.length >= limit) break;
    }
  }

  return results.slice(0, limit).map((result) => ({
    ...result,
    summary: result.candidates.map(formatCandidate).join(" OR "),
  }));
}
