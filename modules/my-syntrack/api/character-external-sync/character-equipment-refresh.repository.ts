import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  CharacterEquipmentLookup,
  RefreshableCharacter
} from "./character-equipment-refresh.service.js";

const characterSelect = {
  id: true,
  name: true,
  realm: true,
  realmSlug: true
} as const;

/*
 * "Eligible" just means SynTrack knows enough to ask Blizzard about
 * this character (region/realm/name) - source (MANUAL/ADDON/BATTLENET)
 * is irrelevant, matching the rule that refresh must work regardless
 * of how the character was originally added.
 */
export class CharacterEquipmentRefreshRepository
  implements CharacterEquipmentLookup {
  async findById(
    characterId: string
  ): Promise<RefreshableCharacter | null> {
    return prisma.character.findUnique({
      where: { id: characterId },
      select: characterSelect
    });
  }

  async findAllEligible(): Promise<RefreshableCharacter[]> {
    return prisma.character.findMany({
      select: characterSelect
    });
  }
}
