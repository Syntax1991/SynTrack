/*
 * Phase G3B: a strictly one-way, best-effort diagnostics record of what
 * SynTrack received from an external provider (the WoW addon or a
 * Blizzard public API) BEFORE normalization/mapping/authority
 * composition changes its shape. This is never read by product logic -
 * see ingest-observation.writer.ts's module doc comment for the full
 * one-way guarantee.
 */

export type IngestSource = "ADDON" | "BLIZZARD";

export type IngestDomain =
  | "GEAR"
  | "PROFILE"
  | "EQUIPMENT"
  | "PROFESSIONS"
  | "MYTHIC_PLUS";

/*
 * Only RAW exists for G3B. The column exists so a future phase could add
 * NORMALIZED/EFFECTIVE stages without a schema change - do not start
 * writing those stages now.
 */
export type IngestStage = "RAW";

export type IngestObservationInput = {
  source: IngestSource;
  domain: IngestDomain;
  stage?: IngestStage;
  characterId?: string | null;
  characterName?: string | null;
  realmSlug?: string | null;
  region?: string | null;
  endpoint?: string | null;
  httpStatus?: number | null;
  schemaVersion?: number | null;
  payload: unknown;
};

export type IngestObservationRow = {
  id: number;
  source: IngestSource;
  domain: IngestDomain;
  stage: IngestStage;
  characterId: string | null;
  characterName: string | null;
  realmSlug: string | null;
  region: string | null;
  endpoint: string | null;
  httpStatus: number | null;
  schemaVersion: number | null;
  capturedAt: string;
  payloadJson: string;
};
