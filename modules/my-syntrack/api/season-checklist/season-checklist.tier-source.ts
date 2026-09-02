import { resolveTierOverviewState } from "../overview/overview-tier-embellishment-state.mapper.js";
import { resolveEmbellishmentOverviewState } from "../overview/overview-tier-embellishment-state.mapper.js";
import type {
  EmbellishmentOverviewState,
  TierOverviewState
} from "../overview/overview.types.js";
import type { GearTierEmbellishmentInput } from "../gear-readiness/gear-tier-embellishment.deriver.js";

type GearOverviewCharacterLike = {
  id: string;
  level: number;
  currentExpansionId?: number | null;
  bagPieces?: Array<{
    itemId: number | null;
    setId: number | null;
    expansionId: number | null;
    equipLoc: string | null;
    setEvidenceResolved: boolean | null;
  }>;
  slots: Array<{
    key?: string;
    item: {
      expansionId?: number | null;
      setId?: number | null;
      setEvidenceResolved?: boolean | null;
      setBonusResolved?: boolean | null;
      setBonusSpellIds?: number[] | null;
      uniqueCategoryId?: number | null;
      uniquenessResolved?: boolean | null;
    } | null;
  }>;
};

/**
 * Build the same Tier/Emb input Overview uses from one GearReadiness
 * getOverview() character row — no extra queries.
 */
export function buildSeasonTierInputFromGearCharacter(
  character: GearOverviewCharacterLike
): GearTierEmbellishmentInput {
  return {
    level: character.level,
    currentExpansionId: character.currentExpansionId ?? null,
    bagPieces: character.bagPieces ?? [],
    slots: character.slots.flatMap((slot) =>
      slot.item
        ? [
            {
              slotKey: slot.key ?? "UNKNOWN",
              expansionId: slot.item.expansionId ?? null,
              setId: slot.item.setId ?? null,
              setEvidenceResolved: slot.item.setEvidenceResolved ?? null,
              setBonusResolved: slot.item.setBonusResolved ?? null,
              setBonusSpellIds: slot.item.setBonusSpellIds ?? null,
              uniqueCategoryId: slot.item.uniqueCategoryId ?? null,
              uniquenessResolved: slot.item.uniquenessResolved ?? null
            }
          ]
        : []
    )
  };
}

export function resolveSeasonTierOverviewState(
  character: GearOverviewCharacterLike | undefined
): TierOverviewState {
  if (!character) {
    return resolveTierOverviewState();
  }

  return resolveTierOverviewState(
    buildSeasonTierInputFromGearCharacter(character)
  );
}

export function resolveSeasonEmbellishmentOverviewState(
  character: GearOverviewCharacterLike | undefined
): EmbellishmentOverviewState {
  if (!character) {
    return resolveEmbellishmentOverviewState();
  }

  return resolveEmbellishmentOverviewState(
    buildSeasonTierInputFromGearCharacter(character)
  );
}
