import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  BattleNetCharacterInput,
  CharacterInput
} from "./character.types.js";

const characterInclude = {
  professions: {
    include: {
      profession: true
    }
  }
} as const;

export class CharacterRepository {
  findAll() {
    return prisma.character.findMany({
      include: characterInclude,
      orderBy: [
        {
          name: "asc"
        },
        {
          realm: "asc"
        }
      ]
    });
  }

  findById(characterId: string) {
    return prisma.character.findUnique({
      where: {
        id: characterId
      },
      include: characterInclude
    });
  }

  findByIdentity(
    name: string,
    realm: string,
    region: string
  ) {
    return prisma.character.findUnique({
      where: {
        name_realm_region: {
          name,
          realm,
          region
        }
      }
    });
  }

  countBySource(source: string) {
    return prisma.character.count({
      where: {
        source
      }
    });
  }

  findBattleNetIdentities(
    region: string
  ) {
    return prisma.character.findMany({
      where: {
        region,
        source: "BATTLENET"
      },
      select: {
        battleNetId: true,
        realmSlug: true
      }
    });
  }

  create(input: CharacterInput, raiderAccountId?: string) {
    return prisma.character.create({
      data: {
        name: input.name,
        realm: input.realm,
        region: input.region,
        className: input.className,
        level: input.level,
        ...(raiderAccountId
          ? { raiderAccountId }
          : {}),
        professions: {
          create: input.professionIds.map(
            (professionId) => ({
              professionId
            })
          )
        }
      },
      include: characterInclude
    });
  }

  update(
    characterId: string,
    input: CharacterInput
  ) {
    return prisma.$transaction(
      async (transaction) => {
        await transaction.character.update({
          where: {
            id: characterId
          },
          data: {
            name: input.name,
            realm: input.realm,
            region: input.region,
            className: input.className,
            level: input.level
          }
        });

        if (input.professionIds.length === 0) {
          await transaction.characterProfession.deleteMany({
            where: {
              characterId
            }
          });
        }
        else {
          await transaction.characterProfession.deleteMany({
            where: {
              characterId,
              professionId: {
                notIn: input.professionIds
              }
            }
          });
        }

        for (
          const professionId of
          input.professionIds
        ) {
          await transaction.characterProfession.upsert({
            where: {
              characterId_professionId: {
                characterId,
                professionId
              }
            },
            create: {
              characterId,
              professionId
            },
            update: {}
          });
        }

        return transaction.character.findUniqueOrThrow({
          where: {
            id: characterId
          },
          include: characterInclude
        });
      }
    );
  }

  upsertFromBattleNet(
    input: BattleNetCharacterInput
  ) {
    return prisma.$transaction(
      async (transaction) => {
        const existingCharacter =
          await transaction.character.findFirst({
            where: {
              OR: [
                {
                  battleNetId:
                    input.battleNetId,
                  region:
                    input.region
                },
                {
                  name:
                    input.name,
                  realm:
                    input.realm,
                  region:
                    input.region
                }
              ]
            }
          });

        const character =
          existingCharacter
            ? await transaction.character.update({
                where: {
                  id: existingCharacter.id
                },
                data: {
                  battleNetId:
                    input.battleNetId,
                  name:
                    input.name,
                  realm:
                    input.realm,
                  realmSlug:
                    input.realmSlug,
                  region:
                    input.region,
                  className:
                    input.className,
                  level:
                    input.level,
                  source:
                    "BATTLENET",
                  lastSyncedAt:
                    new Date()
                }
              })
            : await transaction.character.create({
                data: {
                  battleNetId:
                    input.battleNetId,
                  name:
                    input.name,
                  realm:
                    input.realm,
                  realmSlug:
                    input.realmSlug,
                  region:
                    input.region,
                  className:
                    input.className,
                  level:
                    input.level,
                  source:
                    "BATTLENET",
                  lastSyncedAt:
                    new Date()
                }
              });

        for (
          const profession of
          input.professions
        ) {
          await transaction.characterProfession.upsert({
            where: {
              characterId_professionId: {
                characterId:
                  character.id,
                professionId:
                  profession.professionId
              }
            },
            create: {
              characterId:
                character.id,
              professionId:
                profession.professionId,
              skill:
                profession.skill,
              knowledgePoints:
                profession.knowledgePoints,
              specializationSummary:
                profession.specializationSummary
            },
            update: {
              skill:
                profession.skill,
              knowledgePoints:
                profession.knowledgePoints,
              specializationSummary:
                profession.specializationSummary
            }
          });
        }

        return transaction.character.findUniqueOrThrow({
          where: {
            id: character.id
          },
          include: characterInclude
        });
      }
    );
  }

  delete(characterId: string) {
    return prisma.character.delete({
      where: {
        id: characterId
      }
    });
  }
}