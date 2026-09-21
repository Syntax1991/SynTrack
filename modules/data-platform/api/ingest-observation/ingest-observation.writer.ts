import { ingestObservationConfig } from "./ingest-observation.config.js";
import { insertIngestObservation, withIngestObservationDatabase } from "./ingest-observation.db.js";
import type { IngestObservationInput } from "./ingest-observation.types.js";

/*
 * Phase G3B: RAW OBSERVATION DB.
 *
 *   Addon / Blizzard --> RAW OBSERVATION DB (this file)
 *                    \-> Normalizer/Mapper -> Authority/Effective -> dev.db
 *
 * STRICTLY ONE-WAY. This module is called FROM the addon-import and
 * Blizzard-client integration points to record exactly what arrived,
 * before SynTrack transforms it - it is never called BY any normalizer,
 * mapper, authority/effective-composition, or persistence code, and it
 * exposes no read API to product logic. It is diagnostic-only: not a
 * source of truth, not a fallback, not part of Character state, and
 * never user-facing. Inspect captures via the `observations:*` CLI
 * scripts, never through a product API route.
 *
 * FAILURE ISOLATION is the entire point of this function's shape: every
 * step - config check, database open/schema-init, insert, retention
 * pruning - happens inside one try/catch that can never propagate. A
 * missing/locked/corrupt/unwritable observation DB must never fail an
 * addon import or a Blizzard refresh; it only ever costs one console
 * warning and the observation itself.
 */
export function recordIngestObservation(
  input: IngestObservationInput
): void {
  if (!ingestObservationConfig.enabled) {
    return;
  }

  try {
    withIngestObservationDatabase(
      ingestObservationConfig.databasePath,
      (db) => {
        insertIngestObservation(db, input);
      }
    );
  }
  catch (error) {
    console.warn(
      `Ingest observation write failed (${input.source}/${input.domain}) - continuing normal operation.`,
      error
    );
  }
}
