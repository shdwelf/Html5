
## Additional technical findings

### PixelSocial is a useful reference, not a drop-in dependency

Its README describes a serverless model: no login or registration, no application-specific server, and a separate social-network instance inside a group chat. It also calls out RSS/Mastodon import through a bot. The repository is AGPL-3.0, uses TypeScript/Vite, and documents `pnpm i`, `pnpm start`, `pnpm build`, and a debug build that keeps developer tools. That license and the repository's own assets should be respected if this project ever borrows code; the local lab currently borrows neither.

### “Recently updated” needs a commit check

The organization metadata can report a recent `updated_at` even when the latest source commit is older. For the selected projects, the latest source commits found in this pass were:

- Dino: `642d6d8`, 2026-10-01, “update workflow”
- Breakout71: `c470ea7`, 2026-04-16, “avoid TypeError when setting highscore”
- PixelSocial: `9117d8d`, 2026-01-30, “apply prettier”
- Wonster: `561018d`, 2025-02-17, merge after removing weird words
- Stolen Sword: `ea2034c`, 2024-12-14, “update icon”
- Chess: `747d32b`, 2024-12-13, “change url”

This makes Dino the clearest genuinely current upstream activity, while Breakout71 is the clearest recent gameplay-maintenance example. Most other catalogue entries are older ports or maintenance snapshots even if the organization page presents them prominently.

### WebXDC protocol implications for the local lab

The WebXDC documentation describes `sendUpdate(update, descr)` and `setUpdateListener(callback, serial)`. Updates carry a payload plus serial/max-serial metadata; `info` and `summary` are short chat-facing strings. This matters for a real multi-user game: the app must replay all past updates from serial zero, tolerate gaps, and derive the same state regardless of arrival order. A future leaderboard should therefore use an event log or a CRDT-like state model rather than treating the newest message as authoritative.

The local cryptogram lab intentionally remains a demonstration: it shares solve events and does not claim to implement authoritative multiplayer scoring. It also keeps incoming payloads out of `innerHTML` and does not use remote network calls.

### Candidate next research targets

1. Inspect Dino's current manifest and build output to confirm its WebXDC packaging after the workflow update.
2. Compare Wonster's daily-word state model with the serial replay guidance before adding a shared daily puzzle.
3. Review PixelSocial's image-paste and pixelation path for memory limits on mobile WebXDC hosts.
4. Add a manifest and `.xdc` packaging step to the local lab only if the user wants this research page shipped as a distributable app rather than as a SITE-K companion page.
