import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { SeasonGoalPreferenceRow } from "./season-goal-preference.types.js";

export class SeasonGoalPreferenceRepository {
  async findAll(): Promise<SeasonGoalPreferenceRow[]> {
    const rows = await prisma.seasonGoalPreference.findMany();

    return rows.map((row) => ({
      goalKey: row.goalKey,
      characterId: row.characterId,
      enabled: row.enabled,
      numericTarget: row.numericTarget,
      enumTarget: row.enumTarget
    }));
  }

  async upsert(
    goalKey: string,
    characterId: string,
    value: {
      enabled: boolean;
      numericTarget: number | null;
      enumTarget: string | null;
    }
  ): Promise<SeasonGoalPreferenceRow> {
    const row = await prisma.seasonGoalPreference.upsert({
      where: {
        goalKey_characterId: {
          goalKey,
          characterId
        }
      },
      create: {
        goalKey,
        characterId,
        enabled: value.enabled,
        numericTarget: value.numericTarget,
        enumTarget: value.enumTarget
      },
      update: {
        enabled: value.enabled,
        numericTarget: value.numericTarget,
        enumTarget: value.enumTarget
      }
    });

    return {
      goalKey: row.goalKey,
      characterId: row.characterId,
      enabled: row.enabled,
      numericTarget: row.numericTarget,
      enumTarget: row.enumTarget
    };
  }

  async delete(goalKey: string, characterId: string): Promise<void> {
    await prisma.seasonGoalPreference.deleteMany({
      where: {
        goalKey,
        characterId
      }
    });
  }
}
