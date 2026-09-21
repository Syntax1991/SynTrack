import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { resolveEffectiveCharacterIdentities } from "../character-external-sync/character-profile-effective-identity.js";
import { RaidTaskRepository } from "./raid-task.repository.js";
import type {
  PersonalRaidTaskInput,
  RaidTaskCompletionInput
} from "./raid-task.types.js";

const priorityWeight:
  Record<string, number> = {
    HIGH: 3,
    NORMAL: 2,
    LOW: 1
  };

const dueSoonWindowMs =
  48 * 60 * 60 * 1000;

function isDueSoon(
  task: {
    completedAt: string | null;
    dueAt: string | null;
  },
  now: number
) {
  if (task.completedAt || !task.dueAt) {
    return false;
  }

  return (
    new Date(task.dueAt).getTime() <=
    now + dueSoonWindowMs
  );
}

export class RaidTaskService {
  constructor(
    private readonly repository:
      RaidTaskRepository,
    private readonly profileAuthorityService = new CharacterProfileAuthorityService(
      new CharacterExternalSnapshotRepository()
    )
  ) {}

  async getOverview() {
    const characters =
      await this.repository.findCharacters();
    const now = Date.now();

    const identityByCharacterId =
      await resolveEffectiveCharacterIdentities(
        characters,
        this.profileAuthorityService
      );

    const characterItems = characters.map(
      (character) => {
        const identity =
          identityByCharacterId.get(character.id);
        const tasks =
          character.personalRaidTasks
            .map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              category: task.category,
              priority: task.priority,
              raidName: task.raidName,
              dueAt:
                task.dueAt?.toISOString() ??
                null,
              completedAt:
                task.completedAt
                  ?.toISOString() ?? null,
              createdAt:
                task.createdAt.toISOString()
            }))
            .sort((left, right) => {
              const completionDifference =
                Number(Boolean(left.completedAt)) -
                Number(Boolean(right.completedAt));

              if (completionDifference !== 0) {
                return completionDifference;
              }

              const priorityDifference =
                (priorityWeight[right.priority] ?? 0) -
                (priorityWeight[left.priority] ?? 0);

              if (priorityDifference !== 0) {
                return priorityDifference;
              }

              const leftDueAt = left.dueAt
                ? new Date(left.dueAt).getTime()
                : Number.POSITIVE_INFINITY;
              const rightDueAt = right.dueAt
                ? new Date(right.dueAt).getTime()
                : Number.POSITIVE_INFINITY;

              return leftDueAt - rightDueAt;
            });

        return {
          id: character.id,
          name: character.name,
          realm: character.realm,
          region: character.region,
          className: identity?.className ?? character.className,
          level: identity?.level ?? character.level,
          tasks,
          openTaskCount: tasks.filter(
            (task) => !task.completedAt
          ).length,
          completedTaskCount: tasks.filter(
            (task) => Boolean(task.completedAt)
          ).length
        };
      }
    );
    const tasks = characterItems.flatMap(
      (character) => character.tasks
    );

    return {
      characters: characterItems,
      summary: {
        totalTaskCount: tasks.length,
        openTaskCount: tasks.filter(
          (task) => !task.completedAt
        ).length,
        completedTaskCount: tasks.filter(
          (task) => Boolean(task.completedAt)
        ).length,
        dueSoonTaskCount: tasks.filter(
          (task) => isDueSoon(task, now)
        ).length
      }
    };
  }

  async createTask(
    characterId: string,
    input: PersonalRaidTaskInput
  ) {
    const character =
      await this.repository
        .findCharacterById(characterId);

    if (!character) {
      throw new AppError(
        404,
        "Character not found."
      );
    }

    await this.repository.createTask(
      characterId,
      input
    );

    return this.getOverview();
  }

  async updateCompletion(
    taskId: string,
    input: RaidTaskCompletionInput
  ) {
    await this.requireTask(taskId);
    await this.repository.setTaskCompletion(
      taskId,
      input.completed
    );

    return this.getOverview();
  }

  async deleteTask(taskId: string) {
    await this.requireTask(taskId);
    await this.repository.deleteTask(taskId);

    return this.getOverview();
  }

  private async requireTask(taskId: string) {
    const task =
      await this.repository.findTaskById(
        taskId
      );

    if (!task) {
      throw new AppError(
        404,
        "Raid task not found."
      );
    }

    return task;
  }
}
