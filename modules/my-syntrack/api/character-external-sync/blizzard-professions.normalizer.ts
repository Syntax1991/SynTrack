import { getKnownMidnightTierId, getProfessionKeyByBattleNetId } from "../../../data-platform/api/integrations/battlenet/battlenet.profession-map.js";
import type {
  BattleNetProfessionEntry,
  BattleNetProfessionsResponse,
  BattleNetProfessionTier
} from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import type { NormalizedBlizzardProfessionEntry, NormalizedBlizzardProfessionsPayload } from "./character-external-sync.types.js";

/*
 * Blizzard returns every expansion tier a profession has ever touched
 * (Classic, Dragonflight, Khaz Algar, Midnight, ...), NOT just the
 * current one - and live-verified (2026-09-04, real characters) they are
 * NOT guaranteed to be in id order (Cooking returned Cataclysm's tier
 * before Classic's).
 *
 * Highest-numeric-tier-id is only a HEURISTIC, not a documented Blizzard
 * contract: tier ids have so far been assigned monotonically as
 * expansions ship, but nothing guarantees a future expansion's tier id
 * stays higher than Midnight's forever, or that Blizzard never inserts a
 * higher id for unrelated reasons. For a profession where SynTrack has a
 * live-verified, explicit Midnight tier.id (getKnownMidnightTierId), that
 * id is preferred outright when present in the response - this is what
 * keeps SynTrack reading Midnight skill data even after some future
 * expansion adds a tier with a higher numeric id, for as long as SynTrack
 * is still configured for the Midnight season. The heuristic remains only
 * as a fallback: for professions with no verified Midnight id (not yet
 * observed against a real tracked character), and for a known profession
 * whose Midnight tier isn't present at all in a given character's
 * response (e.g. never touched that profession's Midnight content) -
 * regression-guarded in blizzard-professions.normalizer.test.ts.
 */
function resolveCurrentTier(
  tiers: BattleNetProfessionTier[],
  professionId: number
): BattleNetProfessionTier | null {
  const knownMidnightTierId = getKnownMidnightTierId(professionId);

  if (knownMidnightTierId !== null) {
    const pinned = tiers.find((tier) => tier.tier?.id === knownMidnightTierId);

    if (pinned) {
      return pinned;
    }
  }

  let current: BattleNetProfessionTier | null = null;
  let currentId = -Infinity;

  for (const tier of tiers) {
    const id = tier.tier?.id;

    if (typeof id === "number" && id > currentId) {
      current = tier;
      currentId = id;
    }
  }

  return current;
}

function normalizeEntry(
  entry: BattleNetProfessionEntry
): NormalizedBlizzardProfessionEntry | null {
  const professionId = entry.profession?.id;

  if (typeof professionId !== "number") {
    return null;
  }

  const currentTier = resolveCurrentTier(entry.tiers ?? [], professionId);

  return {
    professionId,
    professionKey: getProfessionKeyByBattleNetId(professionId),
    professionName: entry.profession?.name ?? null,
    tierId: currentTier?.tier?.id ?? null,
    tierName: currentTier?.tier?.name ?? null,
    skill:
      typeof currentTier?.skill_points === "number"
        ? currentTier.skill_points
        : null,
    maxSkill:
      typeof currentTier?.max_skill_points === "number"
        ? currentTier.max_skill_points
        : null
  };
}

/*
 * Only Blizzard's "primaries" are normalized - SynTrack's Profession
 * catalog (and the two-primary-profession business rule) only ever
 * modeled primary crafting/gathering professions; secondaries (Fishing,
 * Cooking, Archaeology) have no SynTrack catalog entry or business
 * meaning today and are intentionally out of scope for this domain.
 */
export function normalizeBlizzardProfessions(
  response: BattleNetProfessionsResponse
): NormalizedBlizzardProfessionsPayload {
  const professions = (response.primaries ?? [])
    .map(normalizeEntry)
    .filter(
      (entry): entry is NormalizedBlizzardProfessionEntry => entry !== null
    );

  return { professions };
}
