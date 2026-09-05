import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { AuthoritativeEquipmentSlot } from "./character-external-sync.types.js";

/*
 * Deliberately its own tiny read, not a reuse of GearReadinessRepository
 * - this phase keeps the new BLIZZARD/ADDON authority resolution fully
 * additive and decoupled from the existing Gear Readiness/Overview/
 * Season read path, which is left untouched (see the Phase A report's
 * READ PATH SAFETY section for why).
 */
export class CharacterEquipmentAddonFallbackRepository {
  async findSlots(
    characterId: string
  ): Promise<AuthoritativeEquipmentSlot[]> {
    const rows = await prisma.characterGearSlot.findMany({
      where: { characterId },
      select: {
        slotKey: true,
        itemId: true,
        itemName: true,
        itemLevel: true,
        enchantStatus: true,
        socketCount: true,
        gemCount: true,
        setId: true
      }
    });

    return rows.map((row) => ({
      slotKey: row.slotKey,
      itemId: row.itemId,
      itemName: row.itemName,
      itemLevel: row.itemLevel,
      hasEnchant: row.enchantStatus === "READY",
      socketCount: row.socketCount,
      filledSocketCount: row.socketCount !== null ? row.gemCount : null,
      setId: row.setId
    }));
  }
}
