import type {
  AttentionItem,
  GearOverviewState
} from "./overview.types.js";

export type OverviewGearCharacterInput = {
  id: string;
  name: string;
  slots: {
    item: unknown;
    issues: {
      missingEnchant: boolean;
      missingGemCount: number;
    };
  }[];
  trackedSlotCount: number;
  issueCount: number;
  readinessPercent: number;
  averageItemLevel: number | null;
};

/*
 * Gear is owned by GearReadinessService - this only reads its already-
 * computed per-slot issues. Missing enchants are NOT attention criteria
 * (user checks them in-game); empty sockets remain Gear-domain issues.
 */
export function resolveGearOverviewState(
  character: OverviewGearCharacterInput
): {
  gear: GearOverviewState;
  attentionItem: AttentionItem | null;
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

  /*
   * Prefer socket/gem issues for attention. Ignore missingEnchant even
   * when older issueCount payloads still counted enchants.
   */
  const attentionIssueCount = emptySocketCount;

  const gear: GearOverviewState = {
    state:
      character.trackedSlotCount === 0
        ? "NOT_TRACKED"
        : attentionIssueCount > 0
          ? "ATTENTION"
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
  };

  if (gear.state !== "ATTENTION") {
    return {
      gear,
      attentionItem: null
    };
  }

  return {
    gear,
    attentionItem: {
      id: `${character.id}:gear`,
      characterId: character.id,
      characterName: character.name,
      domain: "gear",
      severity: "this-week",
      label: "Gear needs attention",
      detail:
        emptySocketCount > 0
          ? `${emptySocketCount} empty ${
              emptySocketCount === 1
                ? "socket"
                : "sockets"
            }`
          : null,
      path: "/gear-readiness"
    }
  };
}
