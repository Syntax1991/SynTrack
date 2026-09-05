import type { AuthoritativeEquipmentResult, AuthoritativeEquipmentSlot } from "../character-external-sync/character-external-sync.types.js";
import { findGearSlotDefinition } from "./gear-readiness.catalog.js";
import { parseSpellIds } from "./gear-readiness.service.helpers.js";
import type { EnchantStatus, GearSlotKey } from "./gear-readiness.types.js";

/*
 * Phase F1 effective-equipment composition for Gear Readiness (feeds
 * both the standalone Gear Readiness read and Overview/Character Detail
 * Hub, since both consume GearReadinessService.getOverview()).
 *
 * Authority split, empirically verified this phase against a real
 * character's live Blizzard Equipment response:
 *   CORE (BLIZZARD-primary when a fresh snapshot exists): item id, item
 *   name, item level, socket count, filled-socket count, and a DERIVED
 *   enchantStatus (Blizzard only exposes a boolean `hasEnchant`, not the
 *   addon's 3-state classification - NOT_APPLICABLE is fully determined
 *   from the slot catalog's own supportsEnchant flag, so this derivation
 *   is complete and safe, not a guess).
 *   ADDON-ONLY, always preserved regardless of provider: enchantName (no
 *   Blizzard equivalent - only a numeric enchantment id, no display
 *   text), notes, and all tier-set/embellishment evidence (setId,
 *   expansionId, setEvidenceResolved, setBonusResolved,
 *   setBonusSpellIds, uniqueCategoryId, uniqueCategoryCount,
 *   uniquenessResolved). Live-verified this phase: Blizzard's `set.
 *   item_set.id` DOES match the addon's `setId` exactly for a real
 *   character's real tier pieces, and `set.effects[].is_active` could
 *   express the addon's setBonusResolved concept - but NEITHER
 *   setBonusSpellIds (Blizzard gives display text, not a spell id) NOR
 *   embellishment/unique-category evidence (absent from Blizzard's
 *   response entirely) can be derived, so the whole evidence group stays
 *   addon-only this phase rather than migrating one field of a group
 *   piecemeal (see the Phase F1 report for the full finding).
 *
 * USER PRECEDENCE: a MANUAL row (an officer/player hand-entered a slot,
 * e.g. for a character the addon can't see) always wins outright - even
 * over a fresh Blizzard snapshot. Blizzard/addon are both read-only,
 * automatically-captured facts; a human's explicit entry is never
 * silently overwritten by either.
 */

export type EffectiveGearItem = {
  id: number | null;
  itemName: string;
  itemLevel: number | null;
  enchantStatus: EnchantStatus;
  enchantName: string | null;
  socketCount: number | null;
  gemCount: number;
  notes: string | null;
  source: string;
  lastSyncedAt: string | null;
  updatedAt: string;
  setId: number | null;
  expansionId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: number[] | null;
  uniqueCategoryId: number | null;
  uniqueCategoryCount: number | null;
  uniquenessResolved: boolean | null;
};

export type AddonGearSlotRow = {
  slotKey: string;
  itemId: number | null;
  itemName: string | null;
  itemLevel: number | null;
  enchantStatus: string;
  enchantName: string | null;
  socketCount: number | null;
  gemCount: number;
  notes: string | null;
  source: string;
  lastSyncedAt: Date | null;
  updatedAt: Date;
  setId: number | null;
  expansionId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: string | null;
  uniqueCategoryId: number | null;
  uniqueCategoryCount: number | null;
  uniquenessResolved: boolean | null;
};

function fromAddon(addonItem: AddonGearSlotRow): EffectiveGearItem {
  return {
    id: addonItem.itemId,
    itemName: addonItem.itemName ?? "",
    itemLevel: addonItem.itemLevel,
    enchantStatus: addonItem.enchantStatus as EnchantStatus,
    enchantName: addonItem.enchantName,
    socketCount: addonItem.socketCount,
    gemCount: addonItem.gemCount,
    notes: addonItem.notes,
    source: addonItem.source,
    lastSyncedAt: addonItem.lastSyncedAt?.toISOString() ?? null,
    updatedAt: addonItem.updatedAt.toISOString(),
    setId: addonItem.setId,
    expansionId: addonItem.expansionId,
    setEvidenceResolved: addonItem.setEvidenceResolved,
    setBonusResolved: addonItem.setBonusResolved,
    setBonusSpellIds: parseSpellIds(addonItem.setBonusSpellIds),
    uniqueCategoryId: addonItem.uniqueCategoryId,
    uniqueCategoryCount: addonItem.uniqueCategoryCount,
    uniquenessResolved: addonItem.uniquenessResolved
  };
}

function fromBlizzard(
  slotKey: GearSlotKey,
  blizzardSlot: AuthoritativeEquipmentSlot,
  addonItem: AddonGearSlotRow | undefined
): EffectiveGearItem {
  const definition = findGearSlotDefinition(slotKey);
  const enchantStatus: EnchantStatus = !definition?.supportsEnchant
    ? "NOT_APPLICABLE"
    : blizzardSlot.hasEnchant
      ? "READY"
      : "MISSING";

  return {
    id: blizzardSlot.itemId,
    itemName: blizzardSlot.itemName ?? addonItem?.itemName ?? "",
    itemLevel: blizzardSlot.itemLevel,
    enchantStatus,
    // No Blizzard equivalent (only a numeric enchantment id, no display text).
    enchantName: addonItem?.enchantName ?? null,
    socketCount: blizzardSlot.socketCount,
    gemCount: blizzardSlot.filledSocketCount ?? 0,
    notes: addonItem?.notes ?? null,
    source: "BLIZZARD",
    lastSyncedAt: addonItem?.lastSyncedAt?.toISOString() ?? null,
    updatedAt: addonItem?.updatedAt.toISOString() ?? new Date().toISOString(),
    // Tier-set/embellishment evidence: always addon-sourced (see module doc comment).
    setId: addonItem?.setId ?? null,
    expansionId: addonItem?.expansionId ?? null,
    setEvidenceResolved: addonItem?.setEvidenceResolved ?? null,
    setBonusResolved: addonItem?.setBonusResolved ?? null,
    setBonusSpellIds: parseSpellIds(addonItem?.setBonusSpellIds ?? null),
    uniqueCategoryId: addonItem?.uniqueCategoryId ?? null,
    uniqueCategoryCount: addonItem?.uniqueCategoryCount ?? null,
    uniquenessResolved: addonItem?.uniquenessResolved ?? null
  };
}

/**
 * Resolves one slot's effective item. `blizzardEquipment` is the whole-
 * character authority result (or undefined if no lookup was performed);
 * only `source==="BLIZZARD"` ever contributes core fields - a MANUAL
 * addon row always wins regardless, and any other Blizzard source
 * (ADDON/NONE, or simply no Blizzard slot for this specific key) falls
 * through to the existing addon-only behavior unchanged.
 */
export function resolveEffectiveGearItem(
  slotKey: GearSlotKey,
  addonItem: AddonGearSlotRow | undefined,
  blizzardEquipment: AuthoritativeEquipmentResult | undefined
): EffectiveGearItem | null {
  if (addonItem?.source === "MANUAL") {
    return fromAddon(addonItem);
  }

  const blizzardSlot =
    blizzardEquipment?.source === "BLIZZARD"
      ? blizzardEquipment.slots.find((slot) => slot.slotKey === slotKey)
      : undefined;

  if (blizzardSlot) {
    return fromBlizzard(slotKey, blizzardSlot, addonItem);
  }

  return addonItem ? fromAddon(addonItem) : null;
}
