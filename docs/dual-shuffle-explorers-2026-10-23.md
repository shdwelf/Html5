# Dual-shuffle explorers on the modern net (T12.2) — 2026-10-23

## The ask
Fix/explore the dual-shuffle idea (two queues shuffled together — the
"Suwalls" two-list merger pattern) against the modern watch/listen-together
net: CyTube and its successors, and what a fair dual shuffle actually is.

## What the modern net offers (surveyed 2026-10-23)
- **CyTube** (calzoneman/sync, since 2013, official instance cytu.be) remains
  the open-source reference: per-channel playlist queue + chat, synchronized
  playback across YouTube/Twitch and other hosts, self-hostable (Node.js).
  Its queue is a shared FIFO with voting — the "shuffle" is social, not
  algorithmic.
- Successors/alternatives in current listings: **OpenTogetherTube**,
  **Watch2Gether**, **Metastream**, **Kosmi**, **Hyperbeam**, **SyncUp**,
  **GroupTube** — room-based sync with shared queues; several expose
  shuffle/loop controls over the merged room queue (e.g. SyncUp hosts can
  shuffle or loop a playlist queue). None publishes a fairness model for
  merging *two people's* queues — which is exactly the dual-shuffle question.

## The algorithmic core (what "dual shuffle" should mean)
Two separable choices:
1. **Shuffle algorithm.** Fisher–Yates has two dual formulations —
   *sample-from-the-rest* (forward) and *permute-what-you-have-seen*
   (backward) — both uniform. The naive "swap every slot with a random slot"
   is **biased**: n^n swap sequences cannot divide evenly into n!
   permutations. Subtly, its single-card position marginals are still
   uniform, so a one-card probe acquits it; only a full permutation-distribution
   probe convicts it (verified in tests).
2. **Merge strategy** for two decks: strict **interleave** (perfectly fair
   by position, predictable), **riffle** weighted by cards remaining (fair
   in expectation, organic), **blocks** of 1–3 (crossfade feel, slight
   locality), or **concat + full shuffle** (maximally mixed, loses deck
   identity fastest).

## Shipped explorer
- `dual-shuffle.html` + `js/dual-shuffle.js`: both Fisher–Yates duals, the
  naive swap (kept as the bias meter's defendant), all four merge strategies,
  mulberry32 seeded RNG (reproducible), and a bias meter running both probes
  (single-card χ² over 6,000 shuffles of 5; permutation χ² over 48,000
  shuffles of 4).
- `tests/dual-shuffle.test.mjs` (4/4): seeded determinism, permutation
  validity, both Fisher–Yates duals acquitted, naive swap convicted by the
  permutation probe, all merges preserve the multiset union, exact
  interleave order with preserved deck order.

## Remaining
- Suwalls-proper two-list UI polish (drag between decks) if wanted.
- A CyTube room is a live third-party service: per standing flags, no
  account/room was created; the explorer is the local, testable artifact.
