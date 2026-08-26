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
 * computed per-slot issues. Gear tracking is entirely manual today (no
 * addon capture pipeline exists), so an untracked character (0 rows) must
 * read as NOT_TRACKED - GearReadinessService's own readinessPercent
 * returns 0 for that case (a real 0-of-0 fraction), which would
 * misrepresent as "0% ready" if surfaced as-is; this maps it to null
 * instead so nothing implies a proven bad score.
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
          ? total +
            slot.issues
              .missingGemCount
          : total,
      0
    );

  const gear: GearOverviewState = {
    state:
      character.trackedSlotCount ===
      0
        ? "NOT_TRACKED"
        : character.issueCount > 0
          ? "ATTENTION"
          : "READY",
    readinessPercent:
      character.trackedSlotCount ===
      0
        ? null
        : character.readinessPercent,
    trackedSlots:
      character.trackedSlotCount,
    totalRelevantSlots:
      character.slots.length,
    missingEnchantCount,
    emptySocketCount,
    itemLevel:
      character.trackedSlotCount ===
      0
        ? null
        : character.averageItemLevel
  };

  if (gear.state !== "ATTENTION") {
    return {
      gear,
      attentionItem: null
    };
  }

  const detailParts: string[] = [];

  if (missingEnchantCount > 0) {
    detailParts.push(
      `${missingEnchantCount} missing ${missingEnchantCount === 1 ? "enchant" : "enchants"}`
    );
  }

  if (emptySocketCount > 0) {
    detailParts.push(
      `${emptySocketCount} empty ${emptySocketCount === 1 ? "socket" : "sockets"}`
    );
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
        detailParts.join(", ") ||
        null,
      path: "/gear-readiness"
    }
  };
}
