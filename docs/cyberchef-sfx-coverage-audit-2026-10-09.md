# CyberChef SFX coverage audit — 2026-10-09

Reproduces the report that "the SFX installer only outputs 117 of 478
recipes", and measures every CyberChef build reachable from these two
repositories instead of reasoning about it.

## How it was measured

`scripts/audit-cyberchef-sfx-coverage.mjs` boots the real page in JSDOM
(`runScripts: "dangerously"`) and reads the live values rather than parsing
them out of the source:

- `OPERATIONS` — the registry `addOp` fills, i.e. what the kitchen can run.
- `RECIPE_PACKS` — the only thing the SFX modal can offer.
- `applyRecipePacks(Object.keys(RECIPE_PACKS))` — the recipe length the
  installer actually produces when every checkbox is ticked. This is the
  number the SFX banner prints as "N ops loaded", so it is the ground truth
  for "how many recipes does the SFX output".

```
node scripts/audit-cyberchef-sfx-coverage.mjs [path/to/index.html]
```

## Results

| Build | Registry | Packs | Pack union | "select all" bakes | Orphaned | SFX present |
| --- | --- | --- | --- | --- | --- | --- |
| `Html5` `public/apps/cyberchef/index.html` | **480** | 212 | 480 | **480** | 0 | yes |
| `Html5-sync-incoming@main` `webxdc/cyberchef/index.html` | 441 | 159 | 284 | **284** | **157 (35.6%)** | yes |
| `Html5` `archives/source/cyberchef_webxdc.zip` | 144 | 11 | 20 | n/a | 123 (86.0%) | no |
| `Html5` `apps/cyberchef.html` | 106 | 21 | 18 | n/a | 87 (82.9%) | no |

### The 117-of-478 report does not reproduce

No build in either repository yields 117, and no build has a 478-op registry
today. The `Html5` kitchen registers **480** operations and SFX select-all
bakes **all 480** — zero orphaned, zero dangling pack ids.

The `478` in `docs/cyberchef-recipe-sync-2026-10-07.json` is a faithful record
of the 2026-10-07 merge, not drift. Two operations were added afterwards
(`qrcode`, `averyLabels`), which is exactly what
`tests/cyberchef-recipe-sync.test.mjs` encodes as `POST_MERGE_OPS`, so
`478 + 2 = 480`. The header badge, the registry and `cyberchef.xdc`'s
`manifest.toml` all read 480 and agree; the packaged `index.html` is
byte-identical to the working copy
(`cb208a8e8310b3feae70a0c1c399e03082bf01965571baec4b7160e6509df64c`).

### The defect the report describes is real — in the sibling repo

`Html5-sync-incoming@main` still ships a kitchen where **157 of 441**
registered operations appear in no pack, so its SFX "select all" bakes only
**284**. `applyRecipePacks` skips unresolvable ids silently
(`if(!op) return;`), which is precisely the "silently drops operations"
failure mode. The `Html5` copy was fixed by the `Full Coverage — *` packs;
that fix never reached the sibling because the sync push is refused.

### The two archived builds predate SFX entirely

`archives/source/cyberchef_webxdc.zip` (144 ops) and `apps/cyberchef.html`
(106 ops) define neither `sfxInitUi` nor `applyRecipePacks`, so they cannot be
the source of an SFX symptom. Both do register `sha256` twice — harmless today
because `OPERATIONS.find` takes the first match, but it is a latent duplicate
if either build is ever revived.

## Guards already in place

- `tests/cyberchef-barcode.test.mjs` → *"every operation belongs to a recipe
  pack so SFX can output them all"* asserts `selectAll === total`.
- `tests/cyberchef-recipe-sync.test.mjs` → *"every operation appears in at
  least one pack"*.

Both pass: 12/12 and 14/14 respectively on node 22.

## Open, and blocked

Pushing the fix to `shdwelf/Html5-sync-incoming` is refused. Re-tested
2026-10-09:

```
$ gh api repos/shdwelf/Html5-sync-incoming --jq .permissions
{"admin":true,"maintain":true,"pull":true,"push":true,"triage":true}

$ git push --dry-run origin HEAD:refs/heads/arena-write-probe-1725f355
remote: Permission to shdwelf/Html5-sync-incoming.git denied to shdwelf.
fatal: ... The requested URL returned error: 403
```

The integration reports `push: true` about itself while every write is
refused — the app needs repository access granted on that repo. Until then
`sync-outgoing/` (patch + bundle, commit `d943829`) remains the transport, and
the sibling stays at 441/284.
