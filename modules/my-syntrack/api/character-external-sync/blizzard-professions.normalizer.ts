import { getProfessionKeyByBattleNetId } from "../../../data-platform/api/integrations/battlenet/battlenet.profession-map.js";
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
 * before Classic's). Tier ids are monotonically assigned as expansions
 * ship though - live-verified across 7 real characters and 9 professions
 * that the highest numeric tier.id is always the current-expansion one,
 * regardless of localized tier.name (this deployment's de_DE locale
 * still showed literal "Midnight ..." tier names in this sample, but
 * that is NOT assumed reliable - the id is what business logic keys on).
 */
function resolveCurrentTier(
  tiers: BattleNetProfessionTier[]
): BattleNetProfessionTier | null {
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

  const currentTier = resolveCurrentTier(entry.tiers ?? []);

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
