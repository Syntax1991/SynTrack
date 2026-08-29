import { EMBELLISHMENT_UNIQUE_CATEGORY_ID } from "./embellishment-category.js";
import type {
  EmbellishmentOverviewState,
  OverviewDomainState,
  TierOverviewState
} from "../overview/overview.types.js";

export const TIER_CANONICAL_SLOT_KEYS = [
  "HEAD",
  "SHOULDER",
  "CHEST",
  "HANDS",
  "LEGS"
] as const;

export const TIER_TARGET_PIECES = 4;
export const EMBELLISHMENT_TARGET_PIECES = 2;
export const TIER_EMBELLISHMENT_MIN_LEVEL = 80;

export type GearTierEmbellishmentSlotInput = {
  slotKey: string;
  expansionId: number | null;
  setId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: number[] | null;
  uniqueCategoryId: number | null;
  uniquenessResolved: boolean | null;
};

export type GearTierEmbellishmentInput = {
  level: number;
  slots: GearTierEmbellishmentSlotInput[];
  currentExpansionId?: number | null;
};

const canonicalSlotSet = new Set<string>(TIER_CANONICAL_SLOT_KEYS);

function resolveCurrentExpansionId(
  input: GearTierEmbellishmentInput
): number | null {
  if (
    input.currentExpansionId !== undefined &&
    input.currentExpansionId !== null
  ) {
    return input.currentExpansionId;
  }

  let max: number | null = null;

  for (const slot of input.slots) {
    if (
      slot.setEvidenceResolved === true &&
      slot.expansionId !== null &&
      (max === null || slot.expansionId > max)
    ) {
      max = slot.expansionId;
    }
  }

  return max;
}

function isLevelAConfirmed(
  slot: GearTierEmbellishmentSlotInput,
  currentExpansionId: number | null
): boolean {
  if (
    slot.setId === null ||
    slot.setEvidenceResolved !== true ||
    slot.setBonusResolved !== true ||
    slot.setBonusSpellIds === null ||
    slot.setBonusSpellIds.length === 0
  ) {
    return false;
  }

  if (currentExpansionId === null) {
    return false;
  }

  return slot.expansionId === currentExpansionId;
}

function pickTierSetId(
  canonical: GearTierEmbellishmentSlotInput[],
  currentExpansionId: number | null
): number | null {
  const levelASetIds = new Set<number>();

  for (const slot of canonical) {
    if (isLevelAConfirmed(slot, currentExpansionId) && slot.setId !== null) {
      levelASetIds.add(slot.setId);
    }
  }

  const setIdCounts = new Map<number, number>();

  for (const slot of canonical) {
    if (slot.setEvidenceResolved === true && slot.setId !== null) {
      setIdCounts.set(slot.setId, (setIdCounts.get(slot.setId) ?? 0) + 1);
    }
  }

  const levelBSetIds = [...setIdCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .map(([setId]) => setId);

  const preferredLevelB = levelBSetIds.find((setId) =>
    levelASetIds.has(setId)
  );

  if (preferredLevelB !== undefined) {
    return preferredLevelB;
  }

  if (levelBSetIds.length > 0) {
    return levelBSetIds[0]!;
  }

  if (levelASetIds.size === 0) {
    return null;
  }

  let bestSetId: number | null = null;
  let bestCount = 0;

  for (const setId of levelASetIds) {
    const count = setIdCounts.get(setId) ?? 0;

    if (count > bestCount) {
      bestCount = count;
      bestSetId = setId;
    }
  }

  return bestSetId;
}

function countedState(
  equippedPieces: number,
  targetPieces: number
): OverviewDomainState {
  return equippedPieces >= targetPieces ? "READY" : "IN_PROGRESS";
}

export function deriveTierOverviewState(
  input: GearTierEmbellishmentInput
): TierOverviewState {
  if (input.level < TIER_EMBELLISHMENT_MIN_LEVEL || input.slots.length === 0) {
    return {
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: TIER_TARGET_PIECES,
      twoPiece: false,
      fourPiece: false,
      rawEquippedPieces: 0
    };
  }

  const canonical = input.slots.filter((slot) =>
    canonicalSlotSet.has(slot.slotKey)
  );

  if (canonical.some((slot) => slot.setEvidenceResolved !== true)) {
    return {
      state: "UNKNOWN",
      equippedPieces: 0,
      targetPieces: TIER_TARGET_PIECES,
      twoPiece: false,
      fourPiece: false,
      rawEquippedPieces: 0
    };
  }

  const currentExpansionId = resolveCurrentExpansionId(input);
  const chosenSetId = pickTierSetId(canonical, currentExpansionId);
  const rawEquippedPieces =
    chosenSetId === null
      ? 0
      : canonical.filter(
          (slot) =>
            slot.setEvidenceResolved === true && slot.setId === chosenSetId
        ).length;
  const equippedPieces = Math.min(rawEquippedPieces, TIER_TARGET_PIECES);
  const contributingSlots = canonical
    .filter(
      (slot) =>
        chosenSetId !== null &&
        slot.setEvidenceResolved === true &&
        slot.setId === chosenSetId
    )
    .map((slot) => slot.slotKey);

  return {
    state: countedState(equippedPieces, TIER_TARGET_PIECES),
    equippedPieces,
    targetPieces: TIER_TARGET_PIECES,
    twoPiece: rawEquippedPieces >= 2,
    fourPiece: rawEquippedPieces >= 4,
    rawEquippedPieces,
    slots: contributingSlots
  };
}

export function deriveEmbellishmentOverviewState(
  input: GearTierEmbellishmentInput
): EmbellishmentOverviewState {
  if (input.level < TIER_EMBELLISHMENT_MIN_LEVEL || input.slots.length === 0) {
    return {
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: EMBELLISHMENT_TARGET_PIECES
    };
  }

  if (EMBELLISHMENT_UNIQUE_CATEGORY_ID === null) {
    return {
      state: "UNKNOWN",
      equippedPieces: 0,
      targetPieces: EMBELLISHMENT_TARGET_PIECES
    };
  }

  if (input.slots.some((slot) => slot.uniquenessResolved !== true)) {
    return {
      state: "UNKNOWN",
      equippedPieces: 0,
      targetPieces: EMBELLISHMENT_TARGET_PIECES
    };
  }

  const categoryId = EMBELLISHMENT_UNIQUE_CATEGORY_ID;
  const rawCount = input.slots.filter(
    (slot) =>
      slot.uniquenessResolved === true &&
      slot.uniqueCategoryId === categoryId
  ).length;
  const equippedPieces = Math.min(rawCount, EMBELLISHMENT_TARGET_PIECES);

  return {
    state: countedState(equippedPieces, EMBELLISHMENT_TARGET_PIECES),
    equippedPieces,
    targetPieces: EMBELLISHMENT_TARGET_PIECES
  };
}
