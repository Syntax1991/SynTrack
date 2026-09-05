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
 *   text), notes, and the REMAINING tier-set/embellishment evidence
 *   (expansionId, setEvidenceResolved, setBonusResolved,
 *   setBonusSpellIds, uniqueCategoryId, uniqueCategoryCount,
 *   uniquenessResolved) - none of these have a proven Blizzard
 *   equivalent: `set.effects[].is_active` could express the addon's
 *   setBonusResolved concept but at different granularity, neither
 *   setBonusSpellIds (Blizzard gives display text, not a spell id) nor
 *   embellishment/unique-category evidence (absent from Blizzard's
 *   response entirely) can be derived, so this evidence stays addon-only
 *   rather than migrating on unproven equivalence (see the Phase F1
 *   report for the full finding).
 *
 * PHASE F2: `setId` is now its OWN field-specific authority
 * (BLIZZARD-primary/ADDON-fallback), split out of the Group B evidence
 * bundle above - live-verified across 4 characters/13 real tier-piece
 * slots this phase with zero mismatches (Blizzard's `set.item_set.id`
 * exactly equals the addon's `setId` for every slot where both sources
 * observed the SAME item). This is the one Group B field proven
 * equivalent; the rest remain addon-only exactly as before - see the
 * Phase F2 report's live equivalence matrix and its note on the one
 * excluded row (a real item swap the addon hadn't synced yet, not a
 * setId disagreement).
 *
 * USER PRECEDENCE: a MANUAL row (an officer/player hand-entered a slot,
 * e.g. for a character the addon can't see) always wins outright - even
 * over a fresh Blizzard snapshot. Blizzard/addon are both read-only,
 * automatically-captured facts; a human's explicit entry is never
 * silently overwritten by either.
 *
 * PHASE F1 CORRECTIVE REVIEW additions:
 *
 * ITEM ID CONTRACT: `id` and `itemId` are deliberately two different
 * identity domains, never conflated. `id` is the underlying
 * CharacterGearSlot database row's own cuid - null when no such row
 * exists (a slot covered by Blizzard alone, with no addon capture ever
 * recorded for it). `itemId` is the actual World of Warcraft item id,
 * from Blizzard when available, else the addon's own captured value.
 * Pre-Phase-F1 code used the addon row's own database `id` for this
 * field; Phase F1 initially overloaded that same field with the WoW
 * item id instead, which is the bug this split corrects - see the Phase
 * F1 corrective review report.
 *
 * SCALED-LEVEL INVALIDITY (Phase F1 corrective review, 2nd pass): a
 * Blizzard-reported item level is not used outright just because a
 * Blizzard snapshot exists for this character. The authority layer
 * already nulls out `itemLevel` for a slot whose equipped item was
 * reported inside a level-scaling bracket (Timewalking, etc.) - see
 * character-equipment-authority.service.ts. Item identity (id/name/
 * enchant/socket) is still trusted since it genuinely is that equipped
 * item; only its level is suspect. Live-verified: a real character
 * (Synbeast) had 13 of 15 equipped items reported at Timewalking-scaled
 * levels (e.g. HEAD reported as ilvl 76 vs. the addon's real 473 for the
 * exact same item id).
 *
 * An earlier version of this fix also added a cross-provider "recency
 * guard" comparing the addon's own sync time against Blizzard's
 * `last_login_timestamp`, treating a newer addon sync as proof Blizzard
 * was behind. That was removed: `last_login_timestamp` only means "the
 * character logged in at this moment" - it is not Blizzard's guarantee
 * of when its Equipment/Profile/Mythic+ resources were last refreshed, so
 * "addon synced after last_login" does not actually prove Blizzard is
 * stale (Blizzard could easily have caught up to a later in-session
 * change despite an old login timestamp, or still be behind despite a
 * recent one). No real Equipment failure case beyond the scaling
 * artifact above was ever found that this guard fixed, so normal
 * (non-scaled) Blizzard equipment is BLIZZARD-primary/ADDON-fallback
 * with no additional freshness gate - see the Phase F1 corrective
 * review's second report for the full reasoning.
 *
 * ITEM-IDENTITY COMPATIBILITY (Phase F2 corrective review): every
 * addon-sourced field composed onto a Blizzard-identified slot -
 * itemLevel, itemName, enchantName, notes, expansionId,
 * setEvidenceResolved, setBonusResolved, setBonusSpellIds,
 * uniqueCategoryId, uniqueCategoryCount, uniquenessResolved, and the
 * addon `setId` fallback - describes a SPECIFIC physical item the addon
 * observed. None of it may be attached to a *different* item Blizzard
 * now reports for the same slot. Live-verified this phase: Synlight's
 * HEAD slot showed Blizzard itemId 271465 vs. the addon's stale itemId
 * 277768 (a real regear the addon hadn't synced yet, two days old).
 * `isConfirmedSameItem()` below requires BOTH sides to report a
 * non-null WoW item id that match exactly before any addon field is
 * trusted; a null id on either side can never prove sameness, so the
 * conservative default (treat as a different item) applies rather than
 * guessing - missing information is preferable to false information
 * (e.g. itemName resolves to `""`/unknown rather than a stale name, and
 * itemLevel resolves to `null` rather than a stale number). This does
 * NOT change the SAME-item case at all - Synbeast's Timewalking HEAD
 * (Blizzard and addon both report itemId 219749) still gets its
 * itemLevel from the addon fallback exactly as before, since identity
 * is confirmed there. The addon row's own bookkeeping (`id`,
 * `lastSyncedAt`, `updatedAt`) is deliberately NOT gated by this check -
 * see the AddonGearSlotRow.id doc comment for why displaying it
 * alongside a mismatched Blizzard item carries no mutation risk.
 */

export type EffectiveGearItem = {
  /**
   * The underlying CharacterGearSlot row's own id - null when no addon
   * row exists for this slot at all. Deliberately NOT gated by the
   * item-identity check below: it can be genuinely useful even when
   * Blizzard's item differs from the addon's (there IS an editable row
   * for this slot). No mutation risk - GearReadinessRepository.
   * upsertSlot() targets rows by the (characterId, slotKey) unique
   * constraint, never by this id, so editing a slot always correctly
   * replaces the addon's own row for that slot regardless of which
   * item was displayed as "effective" at read time.
   */
  id: string | null;
  /** The real World of Warcraft item id (Blizzard-primary, addon-fallback) - never a database identity. */
  itemId: number | null;
  itemName: string;
  itemLevel: number | null;
  /** Which provider the served itemLevel actually came from - null only when neither source has one. */
  itemLevelSource: "BLIZZARD" | "ADDON" | null;
  enchantStatus: EnchantStatus;
  enchantName: string | null;
  socketCount: number | null;
  gemCount: number;
  notes: string | null;
  source: string;
  lastSyncedAt: string | null;
  updatedAt: string;
  setId: number | null;
  /** Which provider the served setId actually came from - null only when neither source has one. */
  setIdSource: "BLIZZARD" | "ADDON" | null;
  expansionId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: number[] | null;
  uniqueCategoryId: number | null;
  uniqueCategoryCount: number | null;
  uniquenessResolved: boolean | null;
};

export type AddonGearSlotRow = {
  id: string;
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

/*
 * Both sides must report a non-null WoW item id, and they must match,
 * before the addon's item-specific evidence for this slot is trusted
 * alongside a Blizzard-identified item. A null id on either side can
 * never prove sameness - the conservative default (not the same item)
 * applies rather than guessing. See the module doc comment's Phase F2
 * corrective review section for the live Synlight case this fixes.
 */
function isConfirmedSameItem(
  blizzardItemId: number | null,
  addonItemId: number | null
): boolean {
  return (
    blizzardItemId !== null &&
    addonItemId !== null &&
    blizzardItemId === addonItemId
  );
}

function fromAddon(addonItem: AddonGearSlotRow): EffectiveGearItem {
  return {
    id: addonItem.id,
    itemId: addonItem.itemId,
    itemName: addonItem.itemName ?? "",
    itemLevel: addonItem.itemLevel,
    itemLevelSource: addonItem.itemLevel !== null ? "ADDON" : null,
    enchantStatus: addonItem.enchantStatus as EnchantStatus,
    enchantName: addonItem.enchantName,
    socketCount: addonItem.socketCount,
    gemCount: addonItem.gemCount,
    notes: addonItem.notes,
    source: addonItem.source,
    lastSyncedAt: addonItem.lastSyncedAt?.toISOString() ?? null,
    updatedAt: addonItem.updatedAt.toISOString(),
    setId: addonItem.setId,
    setIdSource: addonItem.setId !== null ? "ADDON" : null,
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

  /*
   * Item-identity compatibility gate (Phase F2 corrective review): every
   * addon-sourced field below - including itemLevel/itemName's own
   * fallback - only describes the item the addon last observed in this
   * slot. If Blizzard now reports a DIFFERENT item id, that data belongs
   * to a stale item and must not be attached to the current one.
   * `trustedAddonItem` is `addonItem` when identity is confirmed,
   * `undefined` otherwise - every addon-sourced field below reads
   * through it, never `addonItem` directly, so a mismatch can never
   * leak. See the module doc comment for the live Synlight case this
   * fixes, and Synbeast's Timewalking HEAD for why the SAME-item case
   * (identity confirmed, only the level is stale/scaled) is unaffected.
   */
  const sameItem = isConfirmedSameItem(
    blizzardSlot.itemId,
    addonItem?.itemId ?? null
  );
  const trustedAddonItem = sameItem ? addonItem : undefined;

  /*
   * blizzardSlot.itemLevel is already null when the authority layer
   * detected a scaled-bracket item - falling back to the addon's own
   * item level for THIS FIELD ONLY, while identity (itemId/enchant/
   * socket) still comes from Blizzard, since the item itself is
   * genuinely correct even when its reported level isn't - but only
   * when the addon's item is confirmed to be that same item.
   */
  const itemLevel = blizzardSlot.itemLevel ?? trustedAddonItem?.itemLevel ?? null;
  const itemLevelSource: EffectiveGearItem["itemLevelSource"] =
    blizzardSlot.itemLevel !== null
      ? "BLIZZARD"
      : trustedAddonItem?.itemLevel != null
        ? "ADDON"
        : null;

  /*
   * PHASE F2: setId is field-specific authority (BLIZZARD-primary,
   * ADDON-fallback) - the one Group B evidence field proven equivalent
   * (see module doc comment). Falls back to the addon's setId only when
   * Blizzard reports none for this slot AND the addon's item is
   * confirmed to be the same one Blizzard is describing.
   */
  const setId = blizzardSlot.setId ?? trustedAddonItem?.setId ?? null;
  const setIdSource: EffectiveGearItem["setIdSource"] =
    blizzardSlot.setId !== null
      ? "BLIZZARD"
      : trustedAddonItem?.setId != null
        ? "ADDON"
        : null;

  return {
    id: addonItem?.id ?? null,
    itemId: blizzardSlot.itemId,
    // Missing information is preferable to false information: an addon
    // name fallback is only trusted when the item is confirmed the same.
    itemName: blizzardSlot.itemName ?? trustedAddonItem?.itemName ?? "",
    itemLevel,
    itemLevelSource,
    enchantStatus,
    // No Blizzard equivalent (only a numeric enchantment id, no display text) - only trusted when the item is confirmed the same.
    enchantName: trustedAddonItem?.enchantName ?? null,
    socketCount: blizzardSlot.socketCount,
    gemCount: blizzardSlot.filledSocketCount ?? 0,
    notes: trustedAddonItem?.notes ?? null,
    source: "BLIZZARD",
    lastSyncedAt: addonItem?.lastSyncedAt?.toISOString() ?? null,
    updatedAt: addonItem?.updatedAt.toISOString() ?? new Date().toISOString(),
    setId,
    setIdSource,
    // Remaining tier-set/embellishment evidence: addon-sourced, only when the item is confirmed the same (see module doc comment).
    expansionId: trustedAddonItem?.expansionId ?? null,
    setEvidenceResolved: trustedAddonItem?.setEvidenceResolved ?? null,
    setBonusResolved: trustedAddonItem?.setBonusResolved ?? null,
    setBonusSpellIds: parseSpellIds(trustedAddonItem?.setBonusSpellIds ?? null),
    uniqueCategoryId: trustedAddonItem?.uniqueCategoryId ?? null,
    uniqueCategoryCount: trustedAddonItem?.uniqueCategoryCount ?? null,
    uniquenessResolved: trustedAddonItem?.uniquenessResolved ?? null
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
