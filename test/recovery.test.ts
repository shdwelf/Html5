import { describe, expect, it } from "vitest";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import {
  findAnagrams,
  findCloseMatches,
  levenshtein,
  mineBtcVanity,
  recoverMissingWords,
  recoverWithAnagramsAndTypos,
} from "../src/lib/recovery";
import { deriveAddresses, validateMnemonic } from "../src/lib/wallet";

// Public/synthetic fixtures only, never owner mnemonics or funded identities.
const ZERO_VECTOR = "abandon ".repeat(11) + "about";
const LATE_VECTOR = "zoo ".repeat(11) + "wrong";
// BIP-39 encoding of fixed public entropy 0000000010c000000000000000000000.
const CANOE_VECTOR = "abandon abandon abandon canoe abandon abandon abandon abandon abandon abandon abandon ability";
// Full pinned scans derive every checksum-valid candidate (2048 trials).
// Measured ~3.5 s in isolation; allow bounded CPU contention, not fewer trials,
// a global timeout exemption, a mocked KDF or a change to recovery behaviour.
const PINNED_SCAN_BUDGET = 15_000;

describe("levenshtein / candidate helpers", () => {
  it("computes edit distance", () => {
    expect(levenshtein("veteran", "veteren")).toBe(1);
    expect(levenshtein("abandon", "abandn")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("same", "same")).toBe(0);
  });

  it("finds wordlist anagrams (canoe and ocean share letters)", () => {
    expect(findAnagrams("canoe")).toContain("ocean");
    expect(findAnagrams("armed")).toContain("dream");
    expect(findAnagrams("zzzzz")).toEqual([]);
  });

  it("finds close edits within the wordlist", () => {
    const close = findCloseMatches("abandn", 1);
    expect(close).toContain("abandon");
    expect(findCloseMatches("abandn", 0)).toEqual([]);
  });
});

describe("recoverMissingWords", () => {
  it("recovers a single blanked word, pinned by its target address", async () => {
    const phrase = LATE_VECTOR;
    const words = phrase.split(" ");
    const gapped = words.map((w, i) => (i === 4 ? "?" : w)).join(" ");
    const mine = deriveAddresses(phrase).btcLegacy;

    // Unpinned: multiple genuine checksum-valid phrases can fill one slot.
    const all = await recoverMissingWords(gapped);
    expect(all.length).toBeGreaterThan(1);
    for (const f of all) {
      expect(validateMnemonic(f.mnemonic)).toBe(true);
      const candidate = f.mnemonic.split(" ");
      expect(wordlist).toContain(candidate[4]);
      expect(candidate.filter((_, i) => i !== 4)).toEqual(words.filter((_, i) => i !== 4));
    }

    // Pinned: find the late word and require the entire space to be scanned.
    let attempts = 0;
    const found = await recoverMissingWords(gapped, {
      targetAddress: mine, onProgress: (count) => { attempts = count; },
    });
    expect(found.map((f) => f.mnemonic)).toContain(phrase);
    expect(found).toHaveLength(1);
    expect(found[0].address).toBe(mine);
    expect(attempts).toBe(2048);
  }, PINNED_SCAN_BUDGET);

  it("scans two blanked words and returns only checksum-valid fills", async () => {
    const phrase = ZERO_VECTOR;
    const words = phrase.split(" ");
    const gapped = words.map((w, i) => (i === 2 || i === 9 ? "?" : w)).join(" ");

    // Unpinned search stops at the existing result cap, not all 2048² trials.
    // A full two-slot address-pinned run is deliberately not claimed here.
    const found = await recoverMissingWords(gapped);
    expect(found.length).toBeGreaterThan(0);
    for (const f of found) {
      expect(validateMnemonic(f.mnemonic)).toBe(true);
      const w = f.mnemonic.split(" ");
      expect(w[2]).not.toBe("?"); expect(w[9]).not.toBe("?");
      expect(w.length).toBe(12);
      expect(w.filter((_, i) => i !== 2 && i !== 9)).toEqual(words.filter((_, i) => i !== 2 && i !== 9));
    }
  }, 180_000);

  it("narrows multiple checksum-valid candidates by target address", async () => {
    const phrase = ZERO_VECTOR;
    const words = phrase.split(" ");
    const gapped = words.map((w, i) => (i === 7 ? "?" : w)).join(" ");
    const mine = deriveAddresses(phrase).btcLegacy;
    expect(mine).toBe("1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA");

    const all = await recoverMissingWords(gapped);
    expect(all.length).toBeGreaterThan(1);
    let attempts = 0;
    const filtered = await recoverMissingWords(gapped, {
      targetAddress: mine, onProgress: (count) => { attempts = count; },
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].mnemonic).toBe(phrase);
    expect(filtered[0].address).toBe(mine);
    expect(attempts).toBe(2048);
  }, PINNED_SCAN_BUDGET);

  it("rejects more missing words than the cap", async () => {
    await expect(
      recoverMissingWords("? ? ? ? ? ? ? ? ? ? ? ?", { maxMissing: 2 })
    ).rejects.toThrow(/missing words/i);
  });

  it("rejects a wrong-length phrase", async () => {
    await expect(recoverMissingWords("? ? ?")).rejects.toThrow(/12, 15, 18/);
  });
});

describe("recoverWithAnagramsAndTypos", () => {
  it("repairs a one-letter typo and returns the original phrase", async () => {
    const phrase = ZERO_VECTOR;
    const words = phrase.split(" ");
    const garbledWord = words[3].slice(0, -1);
    // No random early return: the deletion repair must actually be exercised.
    expect(wordlist.includes(garbledWord)).toBe(false);
    words[3] = garbledWord;
    const mine = deriveAddresses(phrase).btcLegacy;
    const found = await recoverWithAnagramsAndTypos(words.join(" "), { targetAddress: mine });
    expect(found.map((f) => f.mnemonic)).toContain(phrase);
    const match = found.find((f) => f.mnemonic === phrase)!;
    expect(match.replacedWords).toEqual([
      { index: 3, original: garbledWord, replacedWith: phrase.split(" ")[3] },
    ]);
  });

  it("repairs an anagram swap (canoe <-> ocean)", async () => {
    const phrase = CANOE_VECTOR;
    expect(validateMnemonic(phrase)).toBe(true);
    const garbled = phrase.replace("canoe", "ocean");
    expect(validateMnemonic(garbled)).toBe(false);
    const mine = deriveAddresses(phrase).btcLegacy;
    const found = await recoverWithAnagramsAndTypos(garbled, { targetAddress: mine });
    expect(found.map((f) => f.mnemonic)).toContain(phrase);
  });

  it("returns the phrase untouched when nothing is wrong", async () => {
    const phrase = ZERO_VECTOR;
    const found = await recoverWithAnagramsAndTypos(phrase);
    expect(found).toEqual([
      { mnemonic: phrase, address: deriveAddresses(phrase).btcLegacy, replacedWords: [] },
    ]);
  });
});

describe("mineBtcVanity", () => {
  it("mines an 11… prefix quickly", async () => {
    const res = await mineBtcVanity("11", { maxAttempts: 200_000 });
    expect(res).not.toBeNull();
    expect(validateMnemonic(res!.mnemonic)).toBe(true);
    expect(res!.address).toMatch(/^11/);
  }, 60_000);

  it("rejects non-Base58 prefixes", async () => {
    await expect(mineBtcVanity("0ll")).rejects.toThrow(/Base58/);
  });
});
