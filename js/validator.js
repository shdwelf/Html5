import {
  INDEX,
  parsePhrase,
  mnemonicToEntropy,
  wordCountToEntropyBits,
} from "./bip39.js";

const SAMPLE_VECTOR =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const $ = (id) => document.getElementById(id);
const input = $("mnemonicInput");
const wordCounter = $("wordCounter");
const wordList = $("wordList");
const resultPanel = $("resultPanel");
const resultIcon = $("resultIcon");
const resultKicker = $("resultKicker");
const resultTitle = $("resultTitle");
const resultMessage = $("resultMessage");
const resultFacts = $("resultFacts");
const diagnosticSummary = $("diagnosticSummary");
const technicalCard = $("technicalCard");
const entropyHex = $("entropyHex");
const entropyToggle = $("entropyToggle");

let validationId = 0;
let validationTimer = null;
let currentEntropyHex = "";
let showEntropy = false;

function countLabel(n) {
  return `${n} word${n === 1 ? "" : "s"}`;
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bitString(bits) {
  return bits?.length ? bits.join("") : "—";
}

function setResult(kind, kicker, title, message, icon) {
  resultPanel.className = `result-panel ${kind}`;
  resultIcon.textContent = icon;
  resultKicker.textContent = kicker;
  resultTitle.textContent = title;
  resultMessage.textContent = message;
}

function clearTechnical() {
  technicalCard.hidden = true;
  currentEntropyHex = "";
  showEntropy = false;
  entropyHex.textContent = "••••••••••••••••••••••••••••••••";
  entropyToggle.textContent = "SHOW ENTROPY";
  entropyToggle.setAttribute("aria-pressed", "false");
  $("technicalEntropy").textContent = "—";
  $("technicalChecksum").textContent = "—";
  $("observedBits").textContent = "—";
  $("expectedBits").textContent = "—";
}

function renderFacts(words, analysis) {
  if (!words.length) {
    resultFacts.hidden = true;
    return;
  }
  resultFacts.hidden = false;
  $("resultWords").textContent = countLabel(words.length);
  $("resultEntropy").textContent = analysis?.entropyBits ? `${analysis.entropyBits} bits` : "—";
  $("resultChecksum").textContent = analysis?.checksumBits ? `${analysis.checksumBits} bits` : "—";
}

function renderTechnical(analysis) {
  if (!analysis?.entropy) {
    clearTechnical();
    return;
  }
  technicalCard.hidden = false;
  currentEntropyHex = toHex(analysis.entropy);
  entropyHex.textContent = showEntropy ? currentEntropyHex : "••••••••••••••••••••••••••••••••";
  $("technicalEntropy").textContent = `${analysis.entropyBits} bits`;
  const observed = bitString(analysis.checksumObserved);
  const expected = bitString(analysis.checksumExpected);
  const matched = analysis.checksumObserved.reduce(
    (total, bit, index) => total + Number(bit === analysis.checksumExpected[index]),
    0
  );
  $("technicalChecksum").textContent = `${matched}/${analysis.checksumBits} bits match`;
  $("observedBits").textContent = observed;
  $("expectedBits").textContent = expected;
}

function renderWordList(words, analysis = null) {
  wordList.replaceChildren();
  if (!words.length) {
    const empty = document.createElement("li");
    empty.className = "empty-row";
    const marker = document.createElement("span");
    marker.textContent = "—";
    const copy = document.createElement("p");
    copy.textContent = "Word-by-word diagnostics will appear here.";
    empty.append(marker, copy);
    wordList.append(empty);
    diagnosticSummary.textContent = "—";
    return;
  }

  const indexes = words.map((word) => INDEX.get(word));
  const hasValidCount = Boolean(wordCountToEntropyBits(words.length));
  const allKnown = indexes.every((index) => index !== undefined);
  const checksumIsValid = Boolean(analysis?.ok);

  words.forEach((word, index) => {
    const known = indexes[index] !== undefined;
    const isLast = index === words.length - 1;
    const checksumRow = isLast && hasValidCount && allKnown;
    const row = document.createElement("li");
    row.className = `word-row ${known ? "known" : "unknown"}${checksumRow ? " checksum" : ""}`;

    const number = document.createElement("span");
    number.className = "word-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const text = document.createElement("span");
    text.className = "word-text";
    text.textContent = word || "(empty)";
    text.title = word;
    const wordIndex = document.createElement("span");
    wordIndex.className = "word-index";
    wordIndex.textContent = known ? `#${String(indexes[index]).padStart(4, "0")}` : "UNKNOWN";
    row.append(number, text, wordIndex);
    if (checksumRow && checksumIsValid) row.setAttribute("aria-label", `${word}, checksum word verified`);
    wordList.append(row);
  });

  const knownCount = indexes.filter((index) => index !== undefined).length;
  diagnosticSummary.textContent = `${knownCount}/${words.length} recognized`;
  if (checksumIsValid) diagnosticSummary.textContent += " · CHECKSUM OK";
}

function renderIdle() {
  setResult("idle", "READY", "Waiting for a phrase", "Your result will appear here. Validation happens locally and does not derive an address.", "⌁");
  renderFacts([], null);
  renderWordList([]);
  clearTechnical();
}

function renderPending(words) {
  setResult("pending", "CHECKING", "Checking phrase…", "Looking up words and rebuilding the encoded entropy.", "…");
  renderFacts(words, null);
  renderWordList(words);
  clearTechnical();
}

function renderInvalidCount(words) {
  const count = words.length;
  const expected = "12, 15, 18, 21, or 24";
  const title = count < 12 ? "Phrase is incomplete" : "Unsupported word count";
  const message = `${countLabel(count)} entered. BIP-39 mnemonics contain ${expected} words.`;
  setResult("invalid", "INVALID LENGTH", title, message, "!");
  renderFacts(words, null);
  renderWordList(words);
  clearTechnical();
}

function renderUnknownWords(words) {
  const unknown = words
    .map((word, index) => (INDEX.has(word) ? null : `${index + 1}: “${word}”`))
    .filter(Boolean);
  const suffix = unknown.length === 1 ? "word is" : "words are";
  setResult("invalid", "UNKNOWN WORD", "Wordlist mismatch", `${unknown.join(", ")} ${suffix} not in the English BIP-39 list.`, "!");
  renderFacts(words, null);
  renderWordList(words);
  clearTechnical();
}

function renderAnalysis(words, analysis) {
  renderFacts(words, analysis);
  renderWordList(words, analysis);
  renderTechnical(analysis);

  if (analysis.ok) {
    setResult(
      "valid",
      "VALID MNEMONIC",
      "Checksum verified",
      `${countLabel(words.length)} · ${analysis.entropyBits}-bit entropy · recognized locally.`,
      "✓"
    );
  } else {
    setResult(
      "invalid",
      "INVALID CHECKSUM",
      "Phrase is not well-formed",
      "Every word is recognized, but the checksum does not match the encoded entropy.",
      "×"
    );
  }
}

async function validateNow() {
  const run = ++validationId;
  const words = parsePhrase(input.value);
  wordCounter.textContent = countLabel(words.length);

  if (!words.length) {
    renderIdle();
    return;
  }

  renderPending(words);
  const entropyBits = wordCountToEntropyBits(words.length);
  if (!entropyBits) {
    renderInvalidCount(words);
    return;
  }

  const unknown = words.some((word) => !INDEX.has(word));
  if (unknown) {
    renderUnknownWords(words);
    return;
  }

  try {
    const analysis = await mnemonicToEntropy(words);
    if (run !== validationId) return;
    renderAnalysis(words, analysis);
  } catch (error) {
    if (run !== validationId) return;
    setResult("invalid", "UNABLE TO CHECK", "Validation failed", error?.message || "The browser could not calculate SHA-256.", "!");
    renderFacts(words, null);
    renderWordList(words);
    clearTechnical();
  }
}

function scheduleValidation() {
  clearTimeout(validationTimer);
  validationTimer = setTimeout(() => validateNow(), 220);
}

input.addEventListener("input", scheduleValidation);
input.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    clearTimeout(validationTimer);
    validateNow();
  }
});

$("validatorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(validationTimer);
  validateNow();
});

$("clearButton").addEventListener("click", () => {
  validationId += 1;
  input.value = "";
  input.focus();
  renderIdle();
  $("inputHint").textContent = "Use a phrase you already own. Never enter a phrase generated by someone else.";
  wordCounter.textContent = "0 words";
});

$("pasteButton").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard?.readText) throw new Error("Clipboard access is unavailable");
    const text = await navigator.clipboard.readText();
    input.value = text;
    input.focus();
    clearTimeout(validationTimer);
    validateNow();
    $("inputHint").textContent = "Pasted locally. Review the phrase before using the result.";
  } catch {
    input.focus();
    $("inputHint").textContent = "Clipboard access was unavailable. Paste manually into the field.";
  }
});

$("sampleButton").addEventListener("click", () => {
  input.value = SAMPLE_VECTOR;
  input.focus();
  clearTimeout(validationTimer);
  validateNow();
  $("inputHint").textContent = "Test vector loaded. This well-known example is not a wallet seed.";
});

entropyToggle.addEventListener("click", () => {
  if (!currentEntropyHex) return;
  showEntropy = !showEntropy;
  entropyHex.textContent = showEntropy ? currentEntropyHex : "••••••••••••••••••••••••••••••••";
  entropyToggle.textContent = showEntropy ? "HIDE ENTROPY" : "SHOW ENTROPY";
  entropyToggle.setAttribute("aria-pressed", String(showEntropy));
});

renderIdle();
