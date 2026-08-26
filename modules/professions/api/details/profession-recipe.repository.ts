import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import {
  TRACKED_PROFESSION_EXPANSION
} from "./profession-expansion.constants.js";

export class ProfessionRecipeRepository {
  findByProfessionId(
    professionId: string
  ) {
    return prisma.profession.findUnique({
      where: {
        id: professionId
      },

      select: {
        id: true,
        key: true,
        name: true,

        recipes: {
          where: {
            expansion:
              TRACKED_PROFESSION_EXPANSION
          },

          orderBy: [
            {
              name: "asc"
            },
            {
              gameRecipeId: "asc"
            }
          ],

          select: {
            id: true,
            gameRecipeId: true,
            name: true,
            expansion: true,
            categoryId: true,
            craftedItemId: true,
            iconUrl: true,
            itemQuality: true,
            itemLevel: true,
            baseDifficulty: true,

            capabilities: {
              where: {
                capability: {
                  expansion:
                    TRACKED_PROFESSION_EXPANSION
                }
              },

              select: {
                isPrimary: true,

                capability: {
                  select: {
                    id: true,
                    key: true,
                    name: true,
                    type: true,
                    slotKey: true,
                    description: true,
                    sortOrder: true
                  }
                }
              }
            },

            characters: {
              where: {
                learned: true
              },

              select: {
                source: true,
                lastSyncedAt: true,
                baseSkill: true,
                bonusSkill: true,
                effectiveSkill: true,
                craftingQuality: true,
                craftingQualityId: true,
                guaranteedCraftingQualityId: true,
                lowerSkillThreshold: true,
                upperSkillThreshold: true,
                concentrationCost: true,
                concentrationCurrencyId: true,
                ingenuityRefund: true,
                quality: true,
                operationMetricsJson: true,
                reagentSimulationJson: true,
                operationCapturedAt: true,
                operationCaptureVersion: true,
                operationScopeVersion: true,

                characterProfession: {
                  select: {
                    skill: true,
                    skillModifier: true,
                    knowledgePoints: true,

                    character: {
                      select: {
                        id: true,
                        name: true,
                        realm: true,
                        className: true,
                        level: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}