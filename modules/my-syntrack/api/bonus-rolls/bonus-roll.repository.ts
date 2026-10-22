import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  BonusRollCreateData,
  BonusRollRepositoryContract,
  BonusRollRowWithCharacter,
  BonusRollUpdateData
} from "./bonus-roll.types.js";

const withCharacter = {
  character: {
    select: { id: true, name: true, realm: true, className: true }
  }
} as const;

export class BonusRollRepository implements BonusRollRepositoryContract {
  findAll(): Promise<BonusRollRowWithCharacter[]> {
    return prisma.bonusRoll.findMany({
      include: withCharacter,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
  }

  findById(id: string): Promise<BonusRollRowWithCharacter | null> {
    return prisma.bonusRoll.findUnique({ where: { id }, include: withCharacter });
  }

  create(data: BonusRollCreateData): Promise<BonusRollRowWithCharacter> {
    return prisma.bonusRoll.create({ data, include: withCharacter });
  }

  update(id: string, data: BonusRollUpdateData): Promise<BonusRollRowWithCharacter> {
    return prisma.bonusRoll.update({ where: { id }, data, include: withCharacter });
  }

  async delete(id: string): Promise<void> {
    await prisma.bonusRoll.delete({ where: { id } });
  }

  async findCharacterExists(characterId: string): Promise<boolean> {
    return (await prisma.character.count({ where: { id: characterId } })) > 0;
  }
}
