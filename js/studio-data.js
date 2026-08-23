// Art Studio reference data. These labels describe visual mappings, not wallet derivations.
export const SOLVERS = [
  { id: "bip39", label: "BIP-39", note: "ENT + checksum", domain: "bip39" },
  { id: "sha256", label: "SHA-256", note: "entropy digest", domain: "sha256" },
  { id: "sha512", label: "SHA-512", note: "wide digest", domain: "sha512" },
  { id: "bip44", label: "BIP-44", note: "legacy path", domain: "bip44-m44-0-0-0-0" },
  { id: "bip49", label: "BIP-49", note: "nested SegWit", domain: "bip49-m49-0-0-0-0" },
  { id: "bip84", label: "BIP-84", note: "native SegWit", domain: "bip84-m84-0-0-0-0" },
  { id: "bip86", label: "BIP-86", note: "Taproot path", domain: "bip86-m86-0-0-0-0" },
  { id: "slip10", label: "SLIP-10", note: "curve-neutral", domain: "slip10" },
  { id: "gray11", label: "GRAY-Q11", note: "word field", domain: "gray-q11" },
  { id: "enso", label: "ENSO MAP", note: "brush projection", domain: "enso-forge" },
];

export const COIN_MODELS = {
  btc: { label: "BTC", name: "Bitcoin", model: "secp256k1 · UTXO", geometry: "radial field", color: "#f2c984", sides: 8 },
  eth: { label: "ETH", name: "Ethereum", model: "secp256k1 · account", geometry: "orbit lattice", color: "#9facff", sides: 6 },
  ltc: { label: "LTC", name: "Litecoin", model: "secp256k1 · UTXO", geometry: "silver braid", color: "#b7c9d6", sides: 10 },
  xmr: { label: "XMR", name: "Monero", model: "ring signature", geometry: "ring braid", color: "#ff9e83", sides: 12 },
  sol: { label: "SOL", name: "Solana", model: "Ed25519 · account", geometry: "drift mesh", color: "#8ce8dc", sides: 7 },
  ada: { label: "ADA", name: "Cardano", model: "Ed25519 · UTXO", geometry: "epoch flower", color: "#c7a9ff", sides: 5 },
};

export const PAPER_HUES = {
  cyan: { label: "CYAN", hex: "#E0F2FE", ink: "#164e63", mid: "#67cbd0" },
  ivory: { label: "IVORY", hex: "#FFF7E8", ink: "#4a3423", mid: "#d49d67" },
  rose: { label: "ROSE", hex: "#FFE4E6", ink: "#5f2031", mid: "#e8879a" },
  slate: { label: "SLATE", hex: "#CBD5E1", ink: "#172033", mid: "#8092b2" },
  night: { label: "NIGHT", hex: "#111827", ink: "#e0e7ff", mid: "#8996d9" },
};

export const HANKO_STYLES = {
  slate: { label: "DARK SLATE SEAL", color: "#1f2937", glyph: "印" },
  vermilion: { label: "VERMILION SEAL", color: "#b54545", glyph: "円" },
  indigo: { label: "INDIGO SEAL", color: "#3730a3", glyph: "空" },
  custom: { label: "CUSTOM HANKO", color: "#334155", glyph: "∞" },
};

export const FOIL_TREATMENTS = {
  none: { label: "NO FOIL", colors: ["#667085", "#2a3040"] },
  aurora: { label: "AURORA FOIL", colors: ["#8ce8dc", "#c7a9ff"] },
  ember: { label: "EMBER FOIL", colors: ["#f2c984", "#ff8c9d"] },
  moon: { label: "MOON FOIL", colors: ["#d8e0ff", "#8595c9"] },
};

export const POETRY_FORMS = {
  hokku: { label: "HOKKU", short: "5 · 7 · 5", description: "The opening stanza that predates haiku as a standalone form.", lines: [5, 7, 5] },
  zappai: { label: "ZAPPAI", short: "5 · 7 · 5", description: "A playful 5-7-5 form without a required seasonal or spiritual register.", lines: [5, 7, 5] },
  haiku: { label: "HAIKU", short: "5 · 7 · 5", description: "A concise seasonal image with a turn or cutting pause.", lines: [5, 7, 5] },
  micro: { label: "MICRO-POETRY", short: "1 breath", description: "A modern, broad label for an ultra-short poetic form.", lines: [7] },
  tanka: { label: "TANKA", short: "5 · 7 · 5 · 7 · 7", description: "A five-line Japanese form that extends the haiku cadence.", lines: [5, 7, 5, 7, 7] },
  renga: { label: "RENGA", short: "3 + 2", description: "Linked verse built from alternating three-line and two-line stanzas.", lines: [5, 7, 5, 7, 7] },
  haiga: { label: "HAIGA", short: "poem + image", description: "A haiku paired with a painting or drawing; the Enso is the image plane.", lines: [5, 7, 5] },
  haibun: { label: "HAIBUN", short: "prose + 3", description: "Descriptive prose joined to a short haiku stanza.", lines: [5, 7, 5] },
  saijiki: { label: "SAIJIKI", short: "season index", description: "A catalog of season words used to compose traditional haiku.", lines: [] },
};

export const SAIJIKI = {
  spring: ["blossom", "breeze", "rain", "seed", "green", "garden", "sprout", "morning", "bamboo", "flower", "leaf"],
  summer: ["sun", "thunder", "fire", "warm", "beach", "river", "flash", "breeze", "bright", "field", "day"],
  autumn: ["autumn", "harvest", "grain", "leaf", "fog", "moon", "shadow", "gold", "frost", "wind", "evening"],
  winter: ["winter", "snow", "ice", "frost", "crystal", "cold", "silent", "night", "mountain", "still", "glass"],
};

export const SEASONS = [
  { id: "spring", label: "SPRING" },
  { id: "summer", label: "SUMMER" },
  { id: "autumn", label: "AUTUMN" },
  { id: "winter", label: "WINTER" },
];
