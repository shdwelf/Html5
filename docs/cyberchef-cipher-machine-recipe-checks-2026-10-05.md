# CyberChef ↔ cipher machine recipe checks

The lecture-hall update is deliberately compatible with the CyberChef recipe
workflow. Candidate transforms are isolated, score metadata is retained, and
key variants are explicit. The companion cipher-machine UI provides a 50-choice
random dice selector for exploratory design review; it does not claim that a
random choice is a cryptographic result.

Run the existing CyberChef suites with `npm test -- --run` (or the repository's
standard test command) before packaging an XDC. The incoming-repository Crow
recipe patch remains preserved in `sync-outgoing/` and can be applied with
`git am` after cloning `Html5-sync-incoming`.
