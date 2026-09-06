import path from "node:path";
import { env } from "../../../../apps/api/src/config/env.js";

/*
 * Deliberately a plain mutable object, not frozen: focused tests point
 * `databasePath` at a guaranteed-broken location (e.g. an existing
 * directory) to prove the real addon-import/Blizzard-refresh call sites
 * survive an observation-store failure end to end, then restore it.
 * Production code never mutates this - it only reads env-derived
 * defaults once at module load.
 */
export const ingestObservationConfig: {
  enabled: boolean;
  databasePath: string;
} = {
  enabled: env.INGEST_OBSERVATION_ENABLED,
  databasePath: path.resolve(
    process.cwd(),
    env.INGEST_OBSERVATION_DB_PATH
  )
};
