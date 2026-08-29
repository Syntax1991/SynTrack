import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  GearSlotInput,
  GearSlotKey
} from "./gear-readiness.types.js";

export class GearReadinessRepository {
  findCharacterById(characterId: string) {
    return prisma.character.findUnique({
      where: {
        id: characterId
      },
      select: {
        id: true
      }
    });
  }

  findCharacters() {
    return prisma.character.findMany({
      select: {
        id: true,
        name: true,
        realm: true,
        region: true,
        className: true,
        level: true,
        gearSlots: true,
        gearBagSetPieces: true
      },
      orderBy: [
        {
          level: "desc"
        },
        {
          name: "asc"
        }
      ]
    });
  }

  upsertSlot(
    characterId: string,
    slotKey: GearSlotKey,
    input: GearSlotInput
  ) {
    const data = {
      itemName: input.itemName.trim(),
      itemLevel: input.itemLevel ?? null,
      enchantStatus:
        input.enchantStatus,
      enchantName:
        input.enchantName?.trim() || null,
      socketCount: input.socketCount,
      gemCount: input.gemCount,
      notes: input.notes?.trim() || null,
      source: "MANUAL"
    };

    return prisma.characterGearSlot.upsert({
      where: {
        characterId_slotKey: {
          characterId,
          slotKey
        }
      },
      create: {
        characterId,
        slotKey,
        ...data
      },
      update: data
    });
  }

  deleteSlot(
    characterId: string,
    slotKey: GearSlotKey
  ) {
    return prisma.characterGearSlot.deleteMany({
      where: {
        characterId,
        slotKey
      }
    });
  }
}
