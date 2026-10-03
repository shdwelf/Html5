# Crow cryptogram solution research — 2026-10-02

## Finding

The local ArcaneChat lab's Crow Cryptogram is an original generated monoalphabetic substitution, not a recovered historical puzzle. Its plaintext is intentionally fixed as:

> **MEET AT THE OLD OAK**

The substitution alphabet is randomized each time the user selects **NEW CROW**, so there is no single permanent ciphertext or reusable letter key. The solution is therefore recovered from the current symbol pattern, not from an external answer key.

## Solve method

1. Preserve word lengths: `4 2 3 3 3`.
2. Look for a four-letter word with a doubled middle symbol. That is the structural signature of `MEET` (`M E E T`).
3. Use the two-letter word to constrain the key without assuming that it must be `AT` immediately.
4. Propagate the one-to-one substitution across `THE`, `OLD`, and `OAK`.
5. Reject any candidate that maps one cipher symbol to two plaintext letters or two cipher symbols to one plaintext letter.
6. Verify the complete phrase, including all five tokens, before sharing a solved event.

The app now includes a **REVEAL SOLUTION** control that records this reasoning without exposing the solution during normal play.

## Search result distinction

A web search for “crow cryptogram solution” returned unrelated material, primarily animal-themed puzzle pages and *Crow Country* game walkthroughs. It did not identify a canonical public cryptogram matching the local lab's phrase. The local puzzle should therefore be described as a small, original training puzzle—not as an adaptation of those pages.

## Security / game-design note

Because the cipher is regenerated with `Math.random()`, a shared WebXDC puzzle currently sends only a display string and not a stable key or puzzle id. A future multiplayer version should send a versioned payload such as `{ type: "crow-puzzle", id, ciphertext, alphabetVersion }`, then validate guesses against the sender's puzzle id. That would allow replayed updates and prevent a newly generated local puzzle from being mistaken for the shared one.
