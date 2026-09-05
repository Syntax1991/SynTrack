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
 */

export type EffectiveGearItem = {
  /** The underlying CharacterGearSlot row's own id - null when no addon row exists for this slot at all. */
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
   * blizzardSlot.itemLevel is already null when the authority layer
   * detected a scaled-bracket item - falling back to the addon's own
   * item level for THIS FIELD ONLY, while identity (itemId/name/
   * enchant/socket) still comes from Blizzard, since the item itself
   * is genuinely correct even when its reported level isn't.
   */
  const itemLevel = blizzardSlot.itemLevel ?? addonItem?.itemLevel ?? null;
  const itemLevelSource: EffectiveGearItem["itemLevelSource"] =
    blizzardSlot.itemLevel !== null
      ? "BLIZZARD"
      : addonItem?.itemLevel != null
        ? "ADDON"
        : null;

  /*
   * PHASE F2: setId is field-specific authority (BLIZZARD-primary,
   * ADDON-fallback) - the one Group B evidence field proven equivalent
   * (see module doc comment). Falls back to the addon's setId only when
   * Blizzard reports none for this slot (e.g. no tier piece equipped, or
   * a Blizzard snapshot that predates this phase's setId capture).
   */
  const setId = blizzardSlot.setId ?? addonItem?.setId ?? null;
  const setIdSource: EffectiveGearItem["setIdSource"] =
    blizzardSlot.setId !== null
      ? "BLIZZARD"
      : addonItem?.setId != null
        ? "ADDON"
        : null;

  return {
    id: addonItem?.id ?? null,
    itemId: blizzardSlot.itemId,
    itemName: blizzardSlot.itemName ?? addonItem?.itemName ?? "",
    itemLevel,
    itemLevelSource,
    enchantStatus,
    // No Blizzard equivalent (only a numeric enchantment id, no display text).
    enchantName: addonItem?.enchantName ?? null,
    socketCount: blizzardSlot.socketCount,
    gemCount: blizzardSlot.filledSocketCount ?? 0,
    notes: addonItem?.notes ?? null,
    source: "BLIZZARD",
    lastSyncedAt: addonItem?.lastSyncedAt?.toISOString() ?? null,
    updatedAt: addonItem?.updatedAt.toISOString() ?? new Date().toISOString(),
    setId,
    setIdSource,
    // Remaining tier-set/embellishment evidence: always addon-sourced (see module doc comment).
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
