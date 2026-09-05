import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { WeeklyChecklistTaskDefinition } from "./weekly-checklist.types.js";

export class WeeklyChecklistRepository {
  syncTaskCatalog(
    definitions:
      WeeklyChecklistTaskDefinition[]
  ) {
    return prisma.$transaction(
      definitions.map((definition) =>
        prisma.weeklyChecklistTask.upsert({
          where: {
            key: definition.key
          },
          create: definition,
          update: {
            title: definition.title,
            description:
              definition.description,
            category:
              definition.category,
            sortOrder:
              definition.sortOrder,
            enabled: true
          }
        })
      )
    );
  }

  findTasks() {
    return prisma.weeklyChecklistTask.findMany({
      where: {
        enabled: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    });
  }

  findTaskByKey(taskKey: string) {
    return prisma.weeklyChecklistTask.findUnique({
      where: {
        key: taskKey
      }
    });
  }

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

  findCharacters(periodKey: string) {
    return prisma.character.findMany({
      select: {
        id: true,
        name: true,
        realm: true,
        region: true,
        className: true,
        level: true,
        weeklyCompletions: {
          where: {
            periodKey
          },
          select: {
            task: {
              select: {
                key: true
              }
            }
          }
        }
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

  /**
   * Season roster source — no weekly completions join.
   * Season must not become semantically weekly via periodKey.
   */
  findCharactersForSeason() {
    return prisma.character.findMany({
      select: {
        id: true,
        name: true,
        realm: true,
        region: true,
        className: true,
        level: true
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

  setTaskCompletion(
    characterId: string,
    taskId: string,
    periodKey: string,
    completed: boolean
  ) {
    if (!completed) {
      return prisma.weeklyChecklistCompletion.deleteMany({
        where: {
          characterId,
          taskId,
          periodKey
        }
      });
    }

    return prisma.weeklyChecklistCompletion.upsert({
      where: {
        characterId_taskId_periodKey: {
          characterId,
          taskId,
          periodKey
        }
      },
      create: {
        characterId,
        taskId,
        periodKey
      },
      update: {
        completedAt: new Date()
      }
    });
  }

  async setAllTaskCompletions(
    characterId: string,
    taskIds: string[],
    periodKey: string,
    completed: boolean
  ) {
    if (!completed) {
      await prisma.weeklyChecklistCompletion.deleteMany({
        where: {
          characterId,
          periodKey
        }
      });

      return;
    }

    await prisma.$transaction(
      taskIds.map((taskId) =>
        prisma.weeklyChecklistCompletion.upsert({
          where: {
            characterId_taskId_periodKey: {
              characterId,
              taskId,
              periodKey
            }
          },
          create: {
            characterId,
            taskId,
            periodKey
          },
          update: {
            completedAt: new Date()
          }
        })
      )
    );
  }
}
