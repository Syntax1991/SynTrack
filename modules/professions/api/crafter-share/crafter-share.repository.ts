import { randomBytes } from "node:crypto";
import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import {
  TRACKED_PROFESSION_DATA_SOURCE,
  TRACKED_PROFESSION_EXPANSION,
  TRACKED_PROFESSION_EXPANSION_LABEL
} from "../details/profession-expansion.constants.js";
import type { CrafterSharePublicRecord } from "./crafter-share.types.js";

function createTrackedAssignmentWhere() {
  return {
    OR: [
      {
        specializationSummary: {
          contains: TRACKED_PROFESSION_EXPANSION_LABEL
        }
      },
      {
        nodeProgress: {
          some: {
            source: TRACKED_PROFESSION_DATA_SOURCE,
            node: {
              tree: {
                expansion: TRACKED_PROFESSION_EXPANSION
              }
            }
          }
        }
      },
      {
        recipes: {
          some: {
            learned: true,
            recipe: {
              expansion: TRACKED_PROFESSION_EXPANSION
            }
          }
        }
      }
    ]
  };
}

const recipeSelect = {
  learned: true,
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
  operationCapturedAt: true,
      operationCaptureVersion: true,
      operationScopeVersion: true,
      reagentSimulationJson: true,
      recipe: {
    select: {
      name: true,
      itemQuality: true,
      itemLevel: true,
      iconUrl: true,
      baseDifficulty: true,
      capabilities: {
        select: {
          isPrimary: true,
          capability: {
            select: {
              name: true,
              type: true,
              slotKey: true
            }
          }
        }
      }
    }
  }
} as const;

export function createCrafterShareToken(): string {
  return randomBytes(16).toString("hex");
}

export class CrafterShareRepository {
  findByAccountId(raiderAccountId: string) {
    return prisma.crafterShare.findUnique({
      where: {
        raiderAccountId
      }
    });
  }

  createShare(raiderAccountId: string, token: string) {
    return prisma.crafterShare.create({
      data: {
        raiderAccountId,
        token,
        enabled: true
      }
    });
  }

  setEnabled(raiderAccountId: string, enabled: boolean) {
    return prisma.crafterShare.update({
      where: {
        raiderAccountId
      },
      data: {
        enabled
      }
    });
  }

  async findEnabledPublicRecord(
    token: string
  ): Promise<CrafterSharePublicRecord | null> {
    const share = await prisma.crafterShare.findFirst({
      where: {
        token,
        enabled: true
      },
      select: {
        raiderAccount: {
          select: {
            battleTag: true,
            characters: {
              orderBy: {
                name: "asc"
              },
              select: {
                name: true,
                realm: true,
                className: true,
                professions: {
                  where: {
                    AND: [
                      {
                        profession: {
                          category: "CRAFTING"
                        }
                      },
                      createTrackedAssignmentWhere()
                    ]
                  },
                  select: {
                    profession: {
                      select: {
                        name: true
                      }
                    },
                    recipes: {
                      where: {
                        learned: true,
                        recipe: {
                          expansion: TRACKED_PROFESSION_EXPANSION
                        }
                      },
                      select: recipeSelect
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!share) {
      return null;
    }

    return share.raiderAccount;
  }
}
