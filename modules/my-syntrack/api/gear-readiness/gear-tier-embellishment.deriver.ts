import { EMBELLISHMENT_UNIQUE_CATEGORY_ID } from "./embellishment-category.js";
import { isActiveSeasonTierSetId } from "./active-tier-sets.js";
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

export type TierCanonicalSlotKey =
  (typeof TIER_CANONICAL_SLOT_KEYS)[number];

export const TIER_TARGET_PIECES = 4;
export const EMBELLISHMENT_TARGET_PIECES = 2;
export const TIER_EMBELLISHMENT_MIN_LEVEL = 80;

const equipLocToCanonical: Record<string, TierCanonicalSlotKey> = {
  INVTYPE_HEAD: "HEAD",
  INVTYPE_SHOULDER: "SHOULDER",
  INVTYPE_CHEST: "CHEST",
  INVTYPE_ROBE: "CHEST",
  INVTYPE_HAND: "HANDS",
  INVTYPE_LEGS: "LEGS",
  HEAD: "HEAD",
  SHOULDER: "SHOULDER",
  CHEST: "CHEST",
  HANDS: "HANDS",
  LEGS: "LEGS"
};

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

/*
 * Bag / bank-adjacent inventory pieces with set evidence. Used so
 * owned current-season Tier slots count even when unequipped.
 */
export type GearTierBagPieceInput = {
  itemId: number | null;
  setId: number | null;
  expansionId: number | null;
  equipLoc: string | null;
  setEvidenceResolved: boolean | null;
};

export type GearTierEmbellishmentInput = {
  level: number;
  slots: GearTierEmbellishmentSlotInput[];
  bagPieces?: GearTierBagPieceInput[];
  currentExpansionId?: number | null;
};

const canonicalSlotSet = new Set<string>(TIER_CANONICAL_SLOT_KEYS);

function countedState(
  equippedPieces: number,
  targetPieces: number
): OverviewDomainState {
  return equippedPieces >= targetPieces ? "READY" : "IN_PROGRESS";
}

function resolveCanonicalFromEquipLoc(
  equipLoc: string | null
): TierCanonicalSlotKey | null {
  if (!equipLoc) {
    return null;
  }

  return equipLocToCanonical[equipLoc] ?? null;
}

/*
 * Owned current-season Tier = unique canonical slots that have an
 * active-season set piece either equipped or sitting in bags.
 * Old-season setIds never contribute.
 */
export function deriveTierOverviewState(
  input: GearTierEmbellishmentInput
): TierOverviewState {
  if (input.level < TIER_EMBELLISHMENT_MIN_LEVEL) {
    return {
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: TIER_TARGET_PIECES,
      twoPiece: false,
      fourPiece: false,
      rawEquippedPieces: 0
    };
  }

  const hasEquipped = input.slots.length > 0;
  const hasBag = (input.bagPieces ?? []).length > 0;

  if (!hasEquipped && !hasBag) {
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

  const ownedSlots = new Set<TierCanonicalSlotKey>();
  const equippedSlots: string[] = [];

  for (const slot of canonical) {
    if (
      !isActiveSeasonTierSetId(slot.setId) ||
      slot.setEvidenceResolved !== true
    ) {
      continue;
    }

    const key = slot.slotKey as TierCanonicalSlotKey;
    ownedSlots.add(key);
    equippedSlots.push(slot.slotKey);
  }

  for (const piece of input.bagPieces ?? []) {
    if (
      piece.setEvidenceResolved !== true ||
      !isActiveSeasonTierSetId(piece.setId)
    ) {
      continue;
    }

    const key = resolveCanonicalFromEquipLoc(piece.equipLoc);

    if (key) {
      ownedSlots.add(key);
    }
  }

  const rawEquippedPieces = ownedSlots.size;
  const equippedPieces = Math.min(rawEquippedPieces, TIER_TARGET_PIECES);

  return {
    state: countedState(equippedPieces, TIER_TARGET_PIECES),
    equippedPieces,
    targetPieces: TIER_TARGET_PIECES,
    twoPiece: rawEquippedPieces >= 2,
    fourPiece: rawEquippedPieces >= 4,
    rawEquippedPieces,
    slots: [...ownedSlots]
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
