#!/usr/bin/env node
/**
 * cow_level_xgrep.mjs — string sweep for the Diablo "secret cow level" question.
 *
 * Investigation brief (docs/john-ghidra-diablo-research.md §"Secret Cow Level"):
 * the legend says clicking the Tristram cows in Diablo 1 enough times opens a
 * portal to a secret level. The documented history says otherwise — the click
 * interaction is real (character one-liners), the level is not (official line:
 * "There was, of course, no Cow Level in Diablo, but the legend was born" —
 * classic.battle.net Arreat Summit). This tool operationalizes the check on a
 * user-supplied corpus (e.g. extracted from the archive.org `diablo.iso` CD,
 * F3: relay/user capture): scan the executable and MPQ strings for
 *
 *   (a) the documented cow-click dialogue  -> confirms the real interaction,
 *   (b) cow-level/portal content terms     -> their absence is the finding;
 *       a hit would mean this build differs from the documented retail.
 *
 * It also recognizes the related, REAL cow content from the surrounding titles
 * (Hellfire's cow-suit quest behind command.txt, Diablo 2's Moo Moo Farm,
 * StarCraft's "there is no cow level" cheat) so a corpus can be profiled.
 *
 * Usage:
 *   node tools/cow_level_xgrep.mjs <dir-or-file> [--json]
 *
 * Reuses the byte scanner from tools/sierra_xgrep.mjs. No game data ships with
 * the repo; tests use synthetic fixtures. Analysis/notes level only (F4): no
 * game assets are redistributed and no cheat or multiplayer material is
 * derived from the results.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { scanBuffer, scanDirectory } from "./sierra_xgrep.mjs";

/**
 * Needle manifest. `expect` records what the published record says each string
 * indicates: "d1-click" = the real Tristram cow interaction (Diablo 1 retail
 * should contain it); "cow-level" = actual cow-level content (documented in
 * Diablo 2 / teased elsewhere; its presence in a D1 corpus would be a finding);
 * "hellfire" = the cow-suit quest unlocked via command.txt; "starcraft" = the
 * official denial cheat.
 */
export const COW_NEEDLES = [
  { id: "d1-cow-click-1", needle: "that's a cow", expect: "d1-click",
    note: "Diablo 1 cow-click line 'Yup, that's a cow all right!' (~8 clicks)", source: "thegamer.com / grokipedia" },
  { id: "d1-cow-click-2", needle: "not thirsty", expect: "d1-click",
    note: "Diablo 1 cow-click line 'I am not thirsty!'", source: "thegamer.com / grokipedia" },
  { id: "cow-level-term", needle: "cow level", expect: "cow-level",
    note: "the level itself ('There is no cow level' denial also matches — inspect context)", source: "wikipedia.org/wiki/Cow_level" },
  { id: "moo-moo-farm", needle: "moo moo", expect: "cow-level",
    note: "Diablo 2 Secret Cow Level zone name 'Moo Moo Farm'", source: "diablo.fandom.com" },
  { id: "hell-bovine", needle: "hell bovine", expect: "cow-level",
    note: "Diablo 2 cow-monster family", source: "diablo2.diablowiki.net" },
  { id: "wirts-leg", needle: "wirt's leg", expect: "cow-level",
    note: "the D2 portal key item (Wirt's Leg + Tome of Town Portal)", source: "classic.battle.net Arreat Summit" },
  { id: "cow-king", needle: "cow king", expect: "cow-level",
    note: "D2 cow-level boss", source: "diablo2.diablowiki.net" },
  { id: "hellfire-jersey", needle: "jersey", expect: "hellfire",
    note: "Hellfire's 'Jersey's Jersey' cow-suit quest (hidden behind command.txt)", source: "blizzardwatch.com / wikipedia.org" },
  { id: "hellfire-command", needle: "command.txt", expect: "hellfire",
    note: "the Hellfire unlock file for the hidden cow-suit quest", source: "blizzardwatch.com" },
  { id: "sc-cow-cheat", needle: "there is no cow level", expect: "starcraft",
    note: "StarCraft 1998 cheat code = Blizzard's official denial", source: "classic.battle.net Arreat Summit" },
];

/** Profile a scan report: which needle classes hit, and the verdict wording. */
export function profileReport(report, needles = COW_NEEDLES) {
  const byExpect = {};
  for (const row of report) {
    for (const h of row.hits) {
      const n = needles.find((x) => x.id === h.id);
      (byExpect[n.expect] ||= []).push({ file: row.file, offset: h.offset, id: h.id, context: h.context });
    }
  }
  const click = (byExpect["d1-click"] || []).length > 0;
  const level = (byExpect["cow-level"] || []).length > 0;
  let verdict;
  if (click && !level) verdict = "D1 documented profile: cow-click dialogue present, no cow-level content (legend: interaction without a level)";
  else if (click && level) verdict = "cow-level terms present — inspect context (denial strings vs real content); this deviates from the plain D1 retail profile";
  else if (!click && level) verdict = "cow-level content without D1 click dialogue — likely D2-era material";
  else verdict = "neither cow-click dialogue nor cow-level terms found — not a Diablo 1 strings corpus (or strings are packed)";
  return { byExpect, click, level, verdict };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const json = process.argv.includes("--json");
  const root = args[0];
  if (!root) {
    console.error("usage: node tools/cow_level_xgrep.mjs <dir-or-file> [--json]");
    process.exit(2);
  }
  const report = await scanDirectory(root, COW_NEEDLES);
  const profile = profileReport(report);
  if (json) console.log(JSON.stringify({ report, profile }, null, 2));
  else {
    for (const row of report) {
      for (const h of row.hits) {
        console.log(`| ${row.file} | +0x${h.offset.toString(16)} | ${h.needle} | ${h.id} | ${JSON.stringify(h.context)} |`);
      }
    }
    for (const [cls, hits] of Object.entries(profile.byExpect)) {
      console.log(`${cls}: ${hits.length} hit(s)`);
    }
    console.log(profile.verdict);
  }
}
