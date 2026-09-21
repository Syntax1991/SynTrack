import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import {
  TRACKED_PROFESSION_DATA_SOURCE,
  TRACKED_PROFESSION_EXPANSION,
  TRACKED_PROFESSION_EXPANSION_LABEL
} from "./profession-expansion.constants.js";

function createTrackedAssignmentWhere() {
  /*
   * A newly learned Midnight profession may not have recipes or invested
   * specialization points yet. Until profession skill metrics are stored
   * per expansion, the imported expansion display name is the fallback
   * evidence that the character actually owns the Midnight profession.
   */
  return {
    OR: [
      {
        specializationSummary: {
          contains:
            TRACKED_PROFESSION_EXPANSION_LABEL
        }
      },
      {
        nodeProgress: {
          some: {
            source:
              TRACKED_PROFESSION_DATA_SOURCE,

            node: {
              tree: {
                expansion:
                  TRACKED_PROFESSION_EXPANSION
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
              expansion:
                TRACKED_PROFESSION_EXPANSION
            }
          }
        }
      }
    ]
  };
}

export class ProfessionDetailRepository {
  findOverview() {
    return prisma.profession.findMany({
      include: {
        capabilities: {
          where: {
            expansion:
              TRACKED_PROFESSION_EXPANSION
          },

          select: {
            id: true
          }
        },

        recipes: {
          where: {
            expansion:
              TRACKED_PROFESSION_EXPANSION
          },

          select: {
            id: true,
            source: true,
            lastSyncedAt: true
          }
        },

        assignments: {
          where:
            createTrackedAssignmentWhere(),

          select: {
            id: true,

            nodeProgress: {
              where: {
                source:
                  TRACKED_PROFESSION_DATA_SOURCE,

                node: {
                  tree: {
                    expansion:
                      TRACKED_PROFESSION_EXPANSION
                  }
                }
              },

              select: {
                rank: true,
                knowledgeRank: true
              }
            },

            recipes: {
              where: {
                learned: true,

                recipe: {
                  expansion:
                    TRACKED_PROFESSION_EXPANSION
                }
              },

              select: {
                id: true
              }
            }
          }
        }
      },

      orderBy: {
        order: "asc"
      }
    });
  }

  findById(
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
        category: true,

        specializationTrees: {
          where: {
            expansion:
              TRACKED_PROFESSION_EXPANSION
          },

          select: {
            id: true,

            /*
             * The full node catalog (name + max rank), independent of any
             * character's progress - a character with ZERO investment in a
             * node has no CharacterProfessionNodeProgress row at all (the
             * addon never writes a zero-rank row), so "0/max" for an
             * uninvested slot can only be resolved from the node's own
             * definition, not from progress. See
             * profession-explicit-slot-node.mapper.ts.
             */
            nodes: {
              select: {
                key: true,
                name: true,
                maxRank: true,
                knowledgeMaxRank: true,
                iconUrl: true
              }
            }
          }
        },

        capabilities: {
          where: {
            expansion:
              TRACKED_PROFESSION_EXPANSION
          },

          select: {
            id: true
          }
        },

        recipes: {
          where: {
            expansion:
              TRACKED_PROFESSION_EXPANSION
          },

          select: {
            id: true
          }
        },

        assignments: {
          where:
            createTrackedAssignmentWhere(),

          select: {
            id: true,
            skill: true,
            knowledgePoints: true,

            character: {
              select: {
                id: true,
                name: true,
                realm: true,
                region: true,
                className: true,
                level: true
              }
            },

            /*
             * node.key is selected so the specialization-equipment mapper
             * can look it up against a small, explicit, hand-verified
             * ID-keyed table (see profession-specialization-equipment
             * .definitions.ts). node.name is selected for DISPLAY only
             * (e.g. "Wonderful Wristguards 15/20") - it is never matched,
             * substring-searched, or otherwise used to derive an armor
             * family or slot. That derivation is ID-only, by design,
             * after the deleted fuzzy slot mapper's failure mode.
             */
            nodeProgress: {
              where: {
                source:
                  TRACKED_PROFESSION_DATA_SOURCE,

                rank: {
                  gt: 0
                },

                node: {
                  tree: {
                    expansion:
                      TRACKED_PROFESSION_EXPANSION
                  }
                }
              },

              select: {
                rank: true,
                knowledgeRank: true,

                node: {
                  select: {
                    key: true,
                    name: true,
                    maxRank: true,
                    knowledgeMaxRank: true,
                    iconUrl: true,

                    /*
                     * parentNodeId is a stable structural fact (is
                     * this the root node of its specialization tree),
                     * not a name/description guess. It is the only
                     * signal used to separate general/tree investment
                     * (e.g. "Flawless Fortes", "Learned Leatherworker"
                     * - root nodes with no equipment-family mapping)
                     * from equipment-slot specialization (child nodes
                     * curated in profession-specialization-equipment
                     * .definitions.ts). See profession-general-
                     * specialization.mapper.ts.
                     */
                    parentNodeId: true
                  }
                }
              }
            },

            /*
             * TODO(regression-gap, tracked in Profession Capability
             * Correctness report): `learned: true` is what keeps an
             * unlearned recipe (and therefore its EQUIPMENT_FAMILY/
             * EQUIPMENT_SLOT capabilities) out of Known Recipe coverage.
             * There is no dedicated regression test proving this filter,
             * because it is a Prisma `where` clause evaluated by the
             * database, not application code - proving it requires a
             * real Prisma-backed integration harness (seeded SQLite +
             * migrations), which does not exist anywhere in this repo's
             * test suite today (all current tests are pure unit tests
             * against mocked/constructed objects). Building that harness
             * for one filter clause was judged disproportionate for this
             * slice. Add a repository-level integration test here once
             * such a harness exists for any module.
             */
            recipes: {
              where: {
                learned: true,

                recipe: {
                  expansion:
                    TRACKED_PROFESSION_EXPANSION
                }
              },

              select: {
                source: true,
                lastSyncedAt: true,

                recipe: {
                  select: {
                    id: true,
                    gameRecipeId: true,
                    skillLineId: true,
                    expansion: true,
                    name: true,
                    categoryId: true,

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
                            expansion: true,
                            sortOrder: true
                          }
                        }
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