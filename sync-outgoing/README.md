# sync-outgoing — ready-to-apply changeset for shdwelf/Html5-sync-incoming

The Arena GitHub integration is currently scoped to `shdwelf/Html5` only, so
the prepared commit for `shdwelf/Html5-sync-incoming` could not be pushed
(HTTP 403 on both push and fork). This directory preserves that commit intact.

## What the commit contains

`Sync 6 Crow/field-cipher CyberChef recipes from shdwelf/Html5 (441 → 447)`

- `webxdc/cyberchef/index.html` — adds `enigmaM4`, `secomSchedule`,
  `odPoemKey`, `secomExact`, `iocFitness`, `plugboardHillClimb` plus three
  recipe packs; header 441 → 447 recipes. Code is byte-identical to the
  vitest-verified Html5 build (one helper inlined as `odColumnOrder`).
- `webxdc/cyberchef/dist/cyberchef.xdc` — deterministic rebuild via
  `webxdc/webxdc_tool.py pack` (CI requires artifact == fresh build; verified
  locally with `./webxdc/build-all.sh`, 6/6 packages spec-valid).
- `webxdc/cyberchef/recipes-crow.test.mjs` — node:test golden-vector harness
  (8 tests: BDZGO control, official SECOM worksheet digits, OD indicator
  EJHQT/OTRGJ, 105-digit vector round-trip, Crow candidate stays rejected,
  IoC band, Stecker `AI EN OS RT` recovery). All pass on node 22.
- `.github/workflows/verify.yml` — runs the new harness in CI.
- `INVENTORY.md` row updated; `docs/CROW_FIELD_RECIPES.md` added.

## How to land it

Option A — restore access, then re-run the push from any checkout:

```bash
git clone https://github.com/shdwelf/Html5-sync-incoming.git
cd Html5-sync-incoming
git am ../sync-outgoing/0001-Sync-6-Crow-field-cipher-CyberChef-recipes-from-shdw.patch
git push origin HEAD:sync/cyberchef-crow-field-recipes
gh pr create --repo shdwelf/Html5-sync-incoming \
  --head sync/cyberchef-crow-field-recipes --base main \
  --title "Sync 6 Crow/field-cipher CyberChef recipes from shdwelf/Html5 (441 → 447)" \
  --body-file docs/CROW_FIELD_RECIPES.md
```

Option B — use the bundle instead of the patch (identical commit, with hash
`d943829`):

```bash
git fetch ../sync-outgoing/cyberchef-crow-field-recipes.bundle \
  sync/cyberchef-crow-field-recipes:sync/cyberchef-crow-field-recipes
```

To let the agent finish this automatically, grant the Arena GitHub app access
to `shdwelf/Html5-sync-incoming` (GitHub → Settings → Applications →
Arena → Repository access), then ask it to push and open the PR.

## Retest — 2026-10-08

Re-run from a fresh clone plus this bundle's branch, both channels still refuse
the write for this integration:

```
$ git fetch ./cyberchef-crow-field-recipes.bundle \
      refs/heads/sync/cyberchef-crow-field-recipes:refs/heads/sync/cyberchef-crow-field-recipes
$ git push origin sync/cyberchef-crow-field-recipes:sync/cyberchef-crow-field-recipes
remote: Permission to shdwelf/Html5-sync-incoming.git denied to shdwelf.
fatal: unable to access 'https://github.com/shdwelf/Html5-sync-incoming.git/': The requested URL returned error: 403

$ gh api -X POST repos/shdwelf/Html5-sync-incoming/git/refs \
      --input - <<< '{"ref":"refs/heads/sync/cyberchef-crow-field-recipes","sha":"d9438294467006eda7179ce058ced49824f2dfd2"}'
{"message":"Resource not accessible by integration", ... "status":"403"}
```

The branch does **not** exist in that repository; nothing was partially written
(ref creation is atomic, and the refusal happens before any object is accepted).
Read/write asymmetry is unchanged: `gh api repos/shdwelf/Html5-sync-incoming`
reports `permissions.admin: true` from the app's own perspective, and
`gh pr list` reads its merged PRs, while every write is refused.

The six Crow/field-cipher recipes are no longer blocked on this push: they are
merged into `shdwelf/Html5` itself (PR #102, `public/apps/cyberchef/index.html`,
478 operations) and the sibling repository's copy is unchanged at 441.
