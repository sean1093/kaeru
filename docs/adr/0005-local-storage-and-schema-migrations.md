# 0005 — Local storage, schema migrations and backup

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) |

## Context

Everything the user enters stays on the device (ADR 0002). What has to be stored:

- Trips, travelers, receipts and receipt lines (see the planned data model in
  `docs/architecture/overview.md`, derived from `docs/product/domain-rules.md`).
- **Receipt photos** — binary blobs, potentially several megabytes each, dozens per trip.
- Settings: language, theme.

Hard requirements: it must survive reloads and app updates; it must never silently lose or
corrupt data (QA risk R04 and R08 are both scored 15); the schema *will* change between M1
and M3 and again after launch, because the tax rules themselves are still moving; and the
user must be able to get their data out and back in.

## Decision

### IndexedDB through `idb`, with versioned migrations

- One database, `kaeru`, opened by `src/data/db.ts`. `SCHEMA_VERSION` is a single constant.
- `src/data/migrations.ts` is an **append-only array** of `{ version, upgrade(db, tx) }`.
  `pendingMigrations(oldVersion, newVersion)` selects the steps to run, in order, inside the
  `versionchange` transaction. A released migration is never edited.
- v1 creates two stores: `meta` (holds `{ schemaVersion, createdAt }`) and `settings`.
  M1 adds trips, travelers, receipts and photos as new stores in migration v2.
- `idb` (~1.2 KB gzip) is used instead of raw IndexedDB: it gives promises and real
  generic types for store names, keys and values, so a typo in a store name is a compile
  error rather than a runtime `DOMException`.
- Repositories (`settings-repository.ts`, and the receipt repositories in M1) take a
  database handle as an argument. The app passes the shared `getDatabase()`; tests pass a
  throwaway database. No module-level singleton is reachable from the domain.
- **Stored data is untrusted input.** It may come from an older version or a hand-edited
  backup, so every repository normalises what it reads (`normalizeSettings`) and falls back
  to a default rather than handing an invalid value to the UI.

### Preferences also mirrored in `localStorage`

The chosen language must be applied on the **first paint**, and IndexedDB is asynchronous.
`localStorage` holds one key, `kaeru.locale`, as a synchronous boot cache. IndexedDB
remains canonical: on boot the app renders in the cached (or detected) language, then
reconciles with the stored settings. Writes go to both.

### Backup as versioned JSON

`src/data/backup.ts` defines the file format:

```json
{ "format": "kaeru.backup", "schemaVersion": 1, "exportedAt": "…", "settings": { … } }
```

- Export stamps the schema version it was written with.
- Import **refuses** a file whose `schemaVersion` is newer than the running app, with a
  distinct error code, rather than guessing. An older file is migrated forward.
- A file that is not valid JSON, or not a Kaeru backup, fails with its own error code so
  the UI can say something true in both languages.
- Photos stay out of the JSON in M1; a photo-inclusive export is a separate decision
  (likely a zip) once we know real sizes.

### Photos and quota

Photo blobs go in their own object store, referenced by key from the receipt, so reading a
receipt list never deserialises megabytes. Quota is finite and eviction is real on iOS: we
request `navigator.storage.persist()`, surface usage from `navigator.storage.estimate()` in
settings, and treat `QuotaExceededError` as a first-class, translated error.

## Consequences

- Schema changes are explicit, ordered and testable; `fake-indexeddb` lets every migration
  path run in Vitest with no browser.
- The `meta` store makes "which schema is this device on" answerable without inferring it
  from store names — useful in a bug report.
- Two storage mechanisms is a small amount of duplication. It is bounded to one key and
  documented here; the alternative is a flash of the wrong language on every cold start.
- Losing the device loses the data. Export is therefore a feature we promote, not hide.
- No encryption at rest: the browser's own origin isolation is the boundary. Since no full
  passport number may be stored (`DR-041`), the residual risk is acceptable; revisit if the
  model ever holds something more sensitive.

## Alternatives considered

- **`localStorage` for everything.** Synchronous (jank), ~5 MB cap, strings only — unusable
  for photos and for the volume of a family trip. Rejected.
- **Raw IndexedDB.** Saves 1.2 KB and costs callback plumbing and untyped store access on
  the one layer where a mistake destroys user data. Rejected.
- **Dexie.** Pleasant query API, but ~20 KB gzip and a query language we do not need for a
  few hundred rows read entirely into memory. Rejected on size.
- **SQLite via WASM (`wa-sqlite`, OPFS).** Real SQL and real transactions, at the cost of
  roughly 300 KB of WASM — three times our entire JS budget — and shaky Safari support.
  Rejected.
- **A single JSON blob in one IndexedDB key.** Trivially simple, and corrupts everything at
  once on a partial write. Rejected.
