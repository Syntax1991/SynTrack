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
        itemName: true,
        itemLevel: true
      }
    });

    return rows.map((row) => ({
      slotKey: row.slotKey,
      itemName: row.itemName,
      itemLevel: row.itemLevel
    }));
  }
}
