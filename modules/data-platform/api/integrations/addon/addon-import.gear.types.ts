/*
 * Gear capture types for addon import (schemaVersion 2 + bag set pieces).
 */

export type AddonGearSlot = {
  slotKey: string;
  equipped: boolean;
  itemId: number | null;
  itemLink: string | null;
  itemLevel: number | null;
  quality: number | null;
  socketCount: number | null;
  enchantId: number | null;
  gemIds: number[];
  // schemaVersion 2 tier/emb evidence (null when unequipped/unresolved)
  expansionId: number | null;
  setId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: number[] | null;
  uniqueCategoryId: number | null;
  uniqueCategoryCount: number | null;
  uniquenessResolved: boolean | null;
};

export type AddonGearBagSetPiece = {
  itemId: number | null;
  itemLink: string | null;
  setId: number | null;
  expansionId: number | null;
  equipLoc: string | null;
  setEvidenceResolved: boolean | null;
};

export type AddonGearSnapshot = {
  schemaVersion: number;
  capturedAt: string | null;
  currentExpansionId: number | null;
  slots: AddonGearSlot[];
  bagSetPieces: AddonGearBagSetPiece[];
};
