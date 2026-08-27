import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import type { AddonGearSnapshot } from "./addon-import.types.js";

/*
 * The 9 of 16 equipment slots that can carry an enchant - mirrors
 * gear-readiness.catalog.ts's supportsEnchant flags. Duplicated here
 * (rather than imported across the my-syntrack/data-platform module
 * boundary) since it is a small, stable, WoW-inherent fact rather than
 * business logic that could drift.
 */
const enchantCapableSlotKeys = new Set([
  "BACK",
  "CHEST",
  "WRIST",
  "LEGS",
  "FEET",
  "FINGER_1",
  "FINGER_2",
  "MAIN_HAND",
  "OFF_HAND"
]);

/*
 * Gear is a full-current-equipment snapshot, not an event stream: a
 * slot the payload explicitly reports `equipped: false` for has its
 * stale ADDON row removed (confirmed-empty evidence), while a slot
 * the payload omits entirely is left untouched rather than deleted -
 * absence is not evidence of emptiness. An equipped slot upserts even
 * when enrichment fields (itemLevel/quality/socketCount) are still
 * null from an uncached item - it must never be dropped from the
 * snapshot just because that metadata isn't ready yet. Once ADDON
 * reports a slot, it owns that row outright (including clearing any
 * prior MANUAL notes/enchantName) - manual and addon data can only
 * coexist on *different* slots of the same character.
 */
export class AddonGearPersistence {
  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    gear: AddonGearSnapshot | null,
    result: CharacterPersistenceResult
  ): Promise<void> {
    if (!gear) {
      return;
    }

    const capturedAt =
      gear.capturedAt
        ? new Date(gear.capturedAt)
        : new Date();

    const emptySlotKeys =
      gear.slots
        .filter((slot) => !slot.equipped)
        .map((slot) => slot.slotKey);

    if (emptySlotKeys.length > 0) {
      await transaction.characterGearSlot.deleteMany({
        where: {
          characterId,
          source: "ADDON",
          slotKey: { in: emptySlotKeys }
        }
      });
    }

    for (const slot of gear.slots) {
      if (!slot.equipped) {
        continue;
      }

      const enchantStatus =
        !enchantCapableSlotKeys.has(slot.slotKey)
          ? "NOT_APPLICABLE"
          : slot.enchantId !== null
            ? "READY"
            : "MISSING";

      const data = {
        itemId: slot.itemId,
        itemLink: slot.itemLink,
        itemName: null,
        itemLevel: slot.itemLevel,
        quality: slot.quality,
        enchantStatus,
        enchantName: null,
        enchantId: slot.enchantId,
        socketCount: slot.socketCount,
        gemCount: slot.gemIds.length,
        gemIds:
          slot.gemIds.length > 0
            ? JSON.stringify(slot.gemIds)
            : null,
        notes: null,
        source: "ADDON",
        lastSyncedAt: capturedAt
      };

      await transaction.characterGearSlot.upsert({
        where: {
          characterId_slotKey: {
            characterId,
            slotKey: slot.slotKey
          }
        },
        create: {
          characterId,
          slotKey: slot.slotKey,
          ...data
        },
        update: data
      });

      result.gearSlots += 1;
    }
  }
}
