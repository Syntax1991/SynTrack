import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { sanitizeIngestPayload } from "./ingest-observation.sanitizer.js";
import type { IngestObservationInput } from "./ingest-observation.types.js";

/*
 * One tiny table is enough - see the module doc comment on
 * ingest-observation.writer.ts for the full one-way architecture. A
 * fresh connection is opened, used, and closed per call: observation
 * writes are infrequent (once per addon import, once per Blizzard
 * refresh call) and payloads are small, so the simplicity of not
 * caching a connection/statement across calls outweighs the minor
 * per-call open cost - and it keeps this store trivially safe to point
 * at a different path per test with no stale-connection risk.
 */
function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingest_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      domain TEXT NOT NULL,
      stage TEXT NOT NULL,
      characterId TEXT,
      characterName TEXT,
      realmSlug TEXT,
      region TEXT,
      endpoint TEXT,
      httpStatus INTEGER,
      schemaVersion INTEGER,
      capturedAt TEXT NOT NULL,
      payloadJson TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ingest_observations_capturedAt
      ON ingest_observations (capturedAt);

    CREATE INDEX IF NOT EXISTS idx_ingest_observations_lookup
      ON ingest_observations (source, domain, characterName, capturedAt);
  `);
}

/*
 * Diagnostic storage, not permanent history: after every insert, keep
 * only the latest 10 rows for the same (source, domain, groupKey).
 * groupKey is characterName when known, falling back to characterId,
 * then a literal "unknown" bucket - never blocks or scans the whole
 * table, only the rows matching this one group's indexed columns.
 */
function pruneObservations(
  db: Database.Database,
  source: string,
  domain: string,
  groupKey: string
): void {
  db.prepare(
    `
    DELETE FROM ingest_observations
    WHERE source = @source
      AND domain = @domain
      AND COALESCE(characterName, characterId, 'unknown') = @groupKey
      AND id NOT IN (
        SELECT id FROM ingest_observations
        WHERE source = @source
          AND domain = @domain
          AND COALESCE(characterName, characterId, 'unknown') = @groupKey
        ORDER BY capturedAt DESC, id DESC
        LIMIT 10
      )
    `
  ).run({ source, domain, groupKey });
}

export function withIngestObservationDatabase<T>(
  databasePath: string,
  fn: (db: Database.Database) => T
): T {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);

  try {
    initializeSchema(db);
    return fn(db);
  }
  finally {
    db.close();
  }
}

export function insertIngestObservation(
  db: Database.Database,
  input: IngestObservationInput
): void {
  const groupKey =
    input.characterName ??
    input.characterId ??
    "unknown";

  const capturedAt = new Date().toISOString();
  const payloadJson = JSON.stringify(
    sanitizeIngestPayload(input.payload)
  );

  db.prepare(
    `
    INSERT INTO ingest_observations (
      source, domain, stage, characterId, characterName, realmSlug,
      region, endpoint, httpStatus, schemaVersion, capturedAt, payloadJson
    ) VALUES (
      @source, @domain, @stage, @characterId, @characterName, @realmSlug,
      @region, @endpoint, @httpStatus, @schemaVersion, @capturedAt, @payloadJson
    )
    `
  ).run({
    source: input.source,
    domain: input.domain,
    stage: input.stage ?? "RAW",
    characterId: input.characterId ?? null,
    characterName: input.characterName ?? null,
    realmSlug: input.realmSlug ?? null,
    region: input.region ?? null,
    endpoint: input.endpoint ?? null,
    httpStatus: input.httpStatus ?? null,
    schemaVersion: input.schemaVersion ?? null,
    capturedAt,
    payloadJson
  });

  pruneObservations(db, input.source, input.domain, groupKey);
}
