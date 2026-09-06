# Raw Ingest Observation DB (Phase G3B)

## Purpose

A separate, best-effort diagnostics database that records exactly what
SynTrack received from the WoW addon and from Blizzard's public APIs,
**before** normalization, mapping, or authority composition changes its
shape. It exists to debug provider data, compare Blizzard vs. addon
evidence for the same character/slot, and verify DB-cleanup transitions
(e.g. confirming [Phase G3A](../PHASE_G3A_STOP_PERSISTING_RAW_GEAR_FIELDS_REPORT.md)
actually stopped receiving/needing the columns it stopped persisting).

**It is never a source of truth.** It is not read by any normalizer,
mapper, authority/effective-composition service, or persistence code,
and it is not exposed through any product API or UI. The only supported
way to read it is the `observations:*` CLI below.

## Database location

`apps/api/prisma/ingest-observation.db` (plus SQLite `-wal`/`-shm`
sidecar files) - a plain SQLite file opened directly with
`better-sqlite3`, physically separate from `dev.db` and Prisma
entirely. Never committed (see `.gitignore`) and never touched by a
Prisma migration.

## Enable / disable

Two env vars in `apps/api/.env` (see `apps/api/.env.example`):

```
INGEST_OBSERVATION_ENABLED=true
INGEST_OBSERVATION_DB_PATH=./prisma/ingest-observation.db
```

Set `INGEST_OBSERVATION_ENABLED=false` (or `0`) to disable capture
entirely - no file is even created. The path is resolved relative to
`apps/api`, exactly like `DATABASE_URL`.

## What gets captured

| Source | Domain | Captured at |
|---|---|---|
| ADDON | GEAR | the raw `modules.gear` Lua table per character, during a real import (`AddonImportService.importSavedVariables`) - **not** during `preview()` |
| BLIZZARD | PROFILE | `BattleNetClient.getCharacterProfile()`, right after the JSON body decodes successfully |
| BLIZZARD | EQUIPMENT | `BattleNetClient.getCharacterEquipment()` |
| BLIZZARD | PROFESSIONS | `BattleNetClient.getCharacterProfessions()` |
| BLIZZARD | MYTHIC_PLUS | `BattleNetClient.getCharacterMythicKeystoneProfile()` / `...Season()` |

Deliberately **not** captured: `getAccountProfile`/`getUserInfo`/
`exchangeAuthorizationCode` (user-OAuth account-discovery boundary) and
`getGuildRoster` (out of the character-domain scope) - see
`battlenet.client.ts`'s module doc comment.

Only `stage = "RAW"` exists today. The schema leaves room for a future
`NORMALIZED`/`EFFECTIVE` stage without a migration, but nothing writes
those yet.

## Secret handling

Only the decoded response body (or the raw addon domain slice) is ever
passed in - never request headers, the access token, or the request
URL. A recursive sanitizer additionally redacts any key that looks like
a credential (`Authorization`, `access_token`, `client_secret`,
`cookie`, `session`, `password`, etc.) anywhere in the payload, as a
defense-in-depth safety net for a hypothetical pathological provider
response - it never renames or transforms ordinary game data.

## Failure isolation

Every observation write is wrapped in one try/catch that can never
propagate: a missing, locked, corrupt, unwritable, or disabled
observation DB only ever costs one `console.warn` and the observation
itself. It can never fail an addon import, a Blizzard refresh, change
an HTTP response, or roll back a `dev.db` write.

## Retention

Diagnostic storage, not history: after every insert, only the latest 10
rows are kept per `(source, domain, character)` group - pruned via a
lightweight `DELETE ... WHERE id NOT IN (...)` scoped to that group's
indexed columns, no background job.

## Inspecting captures

```bash
npm run observations:list
npm run observations:list -- --source BLIZZARD --domain EQUIPMENT --character Synbeast
npm run observations:show -- 41
npm run observations:compare -- Synbeast
```

`observations:list` accepts `--source`, `--domain`, `--character`, and
`--limit` (default 20). `observations:show <id>` pretty-prints the full
row including `payloadJson`. `observations:compare <characterName>`
prints the latest ADDON/GEAR and BLIZZARD/EQUIPMENT captures for one
character back to back.
