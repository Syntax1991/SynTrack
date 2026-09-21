import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import type { AddonGearSnapshot } from "./addon-import.gear.types.js";

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

      /*
       * G3A (DB cleanup readiness, transition step): itemLink/quality/
       * enchantId/gemIds/uniqueCategoryCount are no longer written to
       * CharacterGearSlot - G2 proved none of the five is ever read back
       * after import. `slot.itemLink`/`slot.enchantId`/`slot.gemIds` are
       * still used right here, in memory, to derive `enchantStatus` and
       * `gemCount` - the actual facts everything downstream needs -
       * exactly as before. Only the raw intermediate values themselves
       * stop being persisted; the addon must keep sending itemLink (the
       * normalizer still parses it) and old addon builds may keep
       * sending all five fields without issue, since they simply aren't
       * placed into this write.
       *
       * Omitting a field here (rather than setting it to `null`) is
       * deliberate: in the `update` branch below, an omitted key leaves
       * that column completely untouched in the database, so a row's
       * historical value survives every future re-import unless a real
       * schema migration removes the column - the `create` branch omits
       * the same keys too, so a brand-new row simply gets the column's
       * default (`null`, since none of the five has a `@default`).
       */
      const enchantStatus =
        !enchantCapableSlotKeys.has(slot.slotKey)
          ? "NOT_APPLICABLE"
          : slot.enchantId !== null
            ? "READY"
            : "MISSING";

      const data = {
        itemId: slot.itemId,
        itemName: null,
        itemLevel: slot.itemLevel,
        enchantStatus,
        enchantName: null,
        socketCount: slot.socketCount,
        gemCount: slot.gemIds.length,
        notes: null,
        source: "ADDON",
        lastSyncedAt: capturedAt,
        setId: slot.setId,
        expansionId: slot.expansionId,
        setEvidenceResolved: slot.setEvidenceResolved,
        setBonusResolved: slot.setBonusResolved,
        setBonusSpellIds:
          slot.setBonusSpellIds !== null
            ? JSON.stringify(slot.setBonusSpellIds)
            : null,
        uniqueCategoryId: slot.uniqueCategoryId,
        uniquenessResolved: slot.uniquenessResolved
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

    await transaction.characterGearBagSetPiece.deleteMany({
      where: { characterId }
    });

    if (gear.bagSetPieces.length > 0) {
      await transaction.characterGearBagSetPiece.createMany({
        data: gear.bagSetPieces.map((piece) => ({
          characterId,
          itemId: piece.itemId,
          itemLink: piece.itemLink,
          setId: piece.setId,
          expansionId: piece.expansionId,
          equipLoc: piece.equipLoc,
          setEvidenceResolved: piece.setEvidenceResolved,
          lastSyncedAt: capturedAt
        }))
      });
    }
  }
}
