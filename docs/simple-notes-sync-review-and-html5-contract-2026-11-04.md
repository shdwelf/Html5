# Review: `simple-notes-sync` and a common sync contract for the HTML5 apps

**Reviewed:** 2026-11-04
**Upstream snapshot:** [`inventory69/simple-notes-sync` `main` at `9b329cd6ec20600dd09623c84b9f522617b4ab81`](https://github.com/inventory69/simple-notes-sync/tree/9b329cd6ec20600dd09623c84b9f522617b4ab81)
**Status:** read-only technical review and proposal. No upstream code was copied, no sync implementation was added, and no remote backend was selected.

## Executive summary

`simple-notes-sync` is an Android/Kotlin notes application with a WebDAV sync implementation and a documented on-server format. It is **not** a browser SDK or a transport-neutral library that can be dropped into this repository. It is useful as a reference for background scheduling, WebDAV uploads/downloads, conditional writes, conflict UI, deletion recovery, and file layout. Reusing its source would also bring its AGPL-3.0 license into consideration.

The existing HTML5 apps do not yet share a sync contract:

- **Wiki in a Jar** persists pages in browser storage and, inside a Webxdc host, sends revision-aware group updates. It carries its own merge/history rules.
- **PIM** persists in browser storage and uses `BroadcastChannel` for same-origin tabs, with WebSocket demonstration hooks rather than a selected production transport.
- **Directory Desk** remains local/offline. Its contact and badge-related data must not be uploaded or synchronized to a remote service without explicit scope, backend, and security approval.

Recommendation: standardize the **app-facing change contract**, then plug in separate transports. Do not standardize by forcing every app into the Android app's note JSON format or by adding WebDAV to the browser apps. A first implementation should use synthetic records and a low-sensitivity pilot; no contacts, badge scans, credentials, or real user data belong in tests or public fixtures.

## What the Android app actually syncs

The reviewed source and its [sync documentation](https://github.com/inventory69/simple-notes-sync/blob/9b329cd6ec20600dd09623c84b9f522617b4ab81/docs/SYNC.md) describe a file-oriented WebDAV layout:

| Remote path / record | Role |
| --- | --- |
| `notes/` | One JSON document per note; folders are represented as subdirectories. `folders.json` stores folder metadata. |
| `notes/deletions.json` | Shared deletion ledger used to reconcile removals and avoid restoring a deleted note incorrectly. |
| `notes-md/` | Optional Markdown mirror/export of notes; it is not the canonical JSON note store. |
| `notes-assets/` | Note attachments/assets. |
| `notes-e2ee/e2ee.json` | Encryption-state marker. It is a gate for older sync clients, not ciphertext and not proof that the note contents are encrypted. |

The app schedules sync after local saves and app/start events, on Wi-Fi connection, and through optional periodic/fallback work. A worker coordinates background sync and prevents overlapping runs. The service reconciles folders, notes, Markdown mirrors, assets, and pending deletions; this is a fairly mature app-specific workflow, not a generic push/pull API.

### Concurrency and conflicts

- The uploader caches WebDAV ETags and sends conditional `PUT` requests with `If-Match` when it has a usable ETag.
- A server-side **HTTP 412 Precondition Failed** means the remote version changed; the note is marked conflicted rather than silently overwritten.
- The resolver offers **keep local** or **use server**. The source explicitly describes this as a user choice, not a line-by-line merge.
- If a WebDAV server rejects the precondition with the implementation's unsupported-status handling (400/501), the client remembers that and retries without the precondition. That improves compatibility but removes that write's lost-update protection; it should not be copied without documenting the trade-off.

### Deletions and encryption marker

The reviewed implementation maintains a deletion ledger and a recoverable trash period (30 days in the reviewed configuration); it also has a guard against interpreting a very large remote disappearance as a legitimate mass deletion. These are safety policies, not properties supplied by WebDAV itself.

The E2EE work is explicitly staged. When the server advertises the encrypted-folder marker, a legacy client blocks ordinary sync so that it will not overwrite encrypted server data with plaintext JSON. **The marker does not encrypt data.** A marker check alone is not an end-to-end encryption implementation, so no HTML5 adapter should claim encryption based on it.

## Comparison with this repository

| App | Current local state / transport | Merge and delete behavior | What a common contract would need to preserve |
| --- | --- | --- | --- |
| `wikiinajar.html` | Browser storage; Webxdc `sendUpdate`/update listeners inside a chat. | A saved page includes the revision hash it was based on. If that revision is available, the receiver can merge line changes; overlapping edits become visible conflict markers. History is retained, deletes are represented by tombstones, and imported media is not synchronized. | Group-scoped transport, base revision, explicit merge result, visible conflicts, tombstones, and a distinction between content and media. |
| `apps/pim_html5.html` | Browser storage and same-origin `BroadcastChannel`; WebSocket adapter hooks are demo scaffolding. | The current demo is not a multi-device durable log or a production remote sync service. | A local-tab adapter can share an interface with remote transports without implying a server exists. |
| Directory Desk (`contacts.html`, `js/local-contacts-*`) | Local/offline collection and file import/export. | No remote sync or organizer API is in scope. | A local-only provider must remain valid; remote capability must be opt-in and must not be inferred from adding a common interface. |

No shared transport-neutral synchronization contract currently exists.

## Proposed interface boundary (not implemented)

Keep app semantics separate from transport semantics:

1. **App adapter** translates the app's data model to/from stable change records, validates incoming data, and applies app-specific merge/conflict policy.
2. **Sync coordinator** serializes work, reports state, handles retries/cursors, and invokes the right adapter.
3. **Transport adapter** implements Webxdc updates, same-origin `BroadcastChannel`, WebDAV, or a future HTTPS service. It owns authentication and wire details, not application merge rules.

An initial TypeScript-shaped contract could look like this:

```ts
interface AppSyncAdapter<RecordType, ChangeType> {
  appId: string;
  schemaVersion: number;
  snapshot(): Promise<RecordType[]>;
  exportChanges(cursor?: string): Promise<{ changes: ChangeType[]; cursor?: string }>;
  applyRemote(changes: ChangeType[]): Promise<{
    applied: number;
    ignored: number;
    conflicts: Array<{ recordId: string; local: unknown; remote: unknown }>;
  }>;
  subscribeLocalChanges?(listener: () => void): () => void;
}

interface SyncTransport<ChangeType> {
  pull(cursor?: string): Promise<{ changes: ChangeType[]; cursor?: string }>;
  push(changes: ChangeType[]): Promise<{ accepted: string[]; rejected: ChangeType[] }>;
  close?(): Promise<void>;
}
```

A wire change should carry, at minimum, a protocol version, app ID, schema version, stable record ID, unique change ID, operation (`upsert` or `delete`), base revision, resulting revision, and app-owned payload. Use server cursors or explicit version tokens for ordering; do not rely on wall-clock timestamps alone or default every conflict to last-write-wins. Deletes need durable tombstones and a documented retention/recovery policy. Pushes must be idempotent, and conditional writes should be used where the chosen transport supports them.

The coordinator's update path should be one explicit route:

```text
local edit -> app adapter validates/persists -> change notification -> sync coordinator
           -> transport pull/push -> app-specific merge/conflict handling -> status/UI update
```

A transport capability query should be explicit (`local-only`, `group updates`, `same-origin`, `remote`) so that an app can operate without sync. Sharing an interface must not automatically enable network access.

## Safe implementation sequence

1. Approve the contract and conflict/deletion semantics before writing common code.
2. Add synthetic two-replica fixtures for create/update/delete, duplicate delivery, offline retry, schema mismatch, concurrent edits, and conflict resolution.
3. Pilot the contract behind the existing Webxdc path in Wiki in a Jar; preserve its current revision-aware merge behavior.
4. Add a same-origin provider for the PIM demo only if useful; label it as tab-local, not cloud sync.
5. Select a remote backend and review authentication, encryption, account recovery, retention, and export/delete behavior before adding a remote transport.
6. Revisit Directory Desk only with explicit authorization to move particular fields to that selected backend. Until then, it stays local and offline.

## Sources and repository references

- Upstream [`simple-notes-sync`](https://github.com/inventory69/simple-notes-sync/tree/9b329cd6ec20600dd09623c84b9f522617b4ab81), [sync format and behavior](https://github.com/inventory69/simple-notes-sync/blob/9b329cd6ec20600dd09623c84b9f522617b4ab81/docs/SYNC.md), [Quickstart](https://github.com/inventory69/simple-notes-sync/blob/9b329cd6ec20600dd09623c84b9f522617b4ab81/QUICKSTART.md), [backup/restore](https://github.com/inventory69/simple-notes-sync/blob/9b329cd6ec20600dd09623c84b9f522617b4ab81/docs/BACKUP.md), and [AGPL-3.0 license](https://github.com/inventory69/simple-notes-sync/blob/9b329cd6ec20600dd09623c84b9f522617b4ab81/LICENSE).
- Relevant reviewed upstream classes include `SyncWorker`, `WebDavSyncService`, `NoteUploader`, `NoteDownloader`, `DeletionSyncManager`, and `SyncConflictResolver`.
- Local implementations: [`wikiinajar.html`](../wikiinajar.html), [`apps/pim_html5.html`](../apps/pim_html5.html), and [`js/local-contacts-core.js`](../js/local-contacts-core.js).
