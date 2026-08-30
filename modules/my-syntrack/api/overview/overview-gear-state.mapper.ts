import type {
  GearOverviewState
} from "./overview.types.js";

export type OverviewGearCharacterInput = {
  id: string;
  name: string;
  level?: number;
  slots: {
    key?: string;
    item: {
      itemLevel?: number | null;
      expansionId?: number | null;
      setId?: number | null;
      setEvidenceResolved?: boolean | null;
      setBonusResolved?: boolean | null;
      setBonusSpellIds?: number[] | null;
      uniqueCategoryId?: number | null;
      uniquenessResolved?: boolean | null;
    } | null;
    issues: {
      missingEnchant: boolean;
      missingGemCount: number;
    };
  }[];
  trackedSlotCount: number;
  issueCount: number;
  readinessPercent: number;
  averageItemLevel: number | null;
  currentExpansionId?: number | null;
  bagPieces?: {
    itemId: number | null;
    setId: number | null;
    expansionId: number | null;
    equipLoc: string | null;
    setEvidenceResolved: boolean | null;
  }[];
};

/*
 * Gear factual read model for Overview iLvl and Character Detail.
 * Missing enchants and empty sockets are captured as counts but never
 * produce Overview attention or generic "Gear needs attention" actions.
 */
export function resolveGearOverviewState(
  character: OverviewGearCharacterInput
): {
  gear: GearOverviewState;
} {
  const missingEnchantCount =
    character.slots.filter(
      (slot) =>
        slot.item !== null &&
        slot.issues.missingEnchant
    ).length;

  const emptySocketCount =
    character.slots.reduce(
      (total, slot) =>
        slot.item !== null
          ? total + slot.issues.missingGemCount
          : total,
      0
    );

  return {
    gear: {
      state:
        character.trackedSlotCount === 0
          ? "NOT_TRACKED"
          : "READY",
      readinessPercent:
        character.trackedSlotCount === 0
          ? null
          : character.readinessPercent,
      trackedSlots: character.trackedSlotCount,
      totalRelevantSlots: character.slots.length,
      missingEnchantCount,
      emptySocketCount,
      itemLevel:
        character.trackedSlotCount === 0
          ? null
          : character.averageItemLevel
    }
  };
}
