import { recordIngestObservation } from "../../ingest-observation/ingest-observation.writer.js";
import type { IngestDomain } from "../../ingest-observation/ingest-observation.types.js";

/*
 * Phase G3B: which public character-domain calls on BattleNetClient
 * capture a RAW observation, and under which logical endpoint id (never
 * the literal URL - a stable, safe diagnostic label is all that's
 * needed). Deliberately excludes getAccountProfile/getUserInfo/
 * exchangeAuthorizationCode - the user-OAuth account-discovery
 * boundary is out of G3B's scope. Split out of battlenet.client.ts to
 * stay under the 350-line architecture cap.
 */
export type BlizzardObservationDescriptor = {
  domain: IngestDomain;
  endpoint: string;
};

/*
 * Only ever passes on the already-decoded response body - never
 * request headers, the access token, or the request URL - see
 * recordIngestObservation's own one-way/failure-isolation guarantee.
 */
export function captureBlizzardObservation(
  observe: BlizzardObservationDescriptor,
  region: string,
  realmSlug: string | undefined,
  characterName: string | undefined,
  httpStatus: number,
  payload: unknown
): void {
  recordIngestObservation({
    source: "BLIZZARD",
    domain: observe.domain,
    endpoint: observe.endpoint,
    realmSlug: realmSlug ?? null,
    characterName: characterName ?? null,
    region,
    httpStatus,
    payload
  });
}
