import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { resolveProfessionWeeklyOverviewState } from "../overview/overview-profession-weekly-state.mapper.js";
import type { ProfessionWeeklyOverviewState } from "../overview/overview.types.js";
import { ProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.repository.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { WeeklyChecklistRepository } from "./weekly-checklist.repository.js";
import type {
  WeeklyChecklistTaskDefinition,
  WeeklyTaskUpdateInput
} from "./weekly-checklist.types.js";

function emptyProfessionWeeklyState(): ProfessionWeeklyOverviewState {
  const zeroAggregate = {
    completeCount: 0,
    incompleteCount: 0,
    unknownCount: 0,
    applicableTotal: 0
  };

  return {
    state: "NOT_TRACKED",
    quest: zeroAggregate,
    treatise: zeroAggregate,
    drops: zeroAggregate,
    professions: []
  };
}

const taskCatalog:
  WeeklyChecklistTaskDefinition[] = [
    {
      key: "great-vault",
      title: "Great Vault progress",
      description:
        "Review or advance this character's weekly reward slots.",
      category: "WEEKLY PROGRESS",
      sortOrder: 10
    },
    {
      key: "mythic-plus",
      title: "Mythic+ key",
      description:
        "Complete this character's planned Mythic+ activity.",
      category: "WEEKLY PROGRESS",
      sortOrder: 20
    },
    {
      key: "raid-readiness",
      title: "Raid readiness",
      description:
        "Confirm consumables, assignments and raid preparation.",
      category: "RAID",
      sortOrder: 30
    },
    {
      key: "profession-knowledge",
      title: "Profession knowledge",
      description:
        "Collect the week's relevant profession knowledge sources.",
      category: "PROFESSIONS",
      sortOrder: 40
    },
    {
      key: "gear-readiness",
      title: "Gear readiness",
      description:
        "Review empty sockets and upgrade opportunities.",
      category: "GEAR",
      sortOrder: 50
    }
  ];

export class WeeklyChecklistService {
  private readonly professionWeeklyStatusService =
    new ProfessionWeeklyStatusService(
      new ProfessionWeeklyStatusRepository()
    );

  constructor(
    private readonly repository:
      WeeklyChecklistRepository
  ) {}

  async getChecklist() {
    await this.repository
      .syncTaskCatalog(taskCatalog);

    const period =
      getWeeklyPeriod();
    const [tasks, characters, professionWeeklyOverview] =
      await Promise.all([
        this.repository.findTasks(),
        this.repository.findCharacters(
          period.key
        ),
        this.professionWeeklyStatusService.getOverview()
      ]);

    /*
     * Additive automatic Prof KP/Drops columns alongside the existing
     * manual "profession-knowledge" task - see the Automatic Profession
     * Weekly audit. The manual task stays untouched until the automatic
     * version is fully live-verified across all professions.
     */
    const professionWeeklyByCharacterId = new Map(
      professionWeeklyOverview.characters.map(
        (character) => [
          character.id,
          resolveProfessionWeeklyOverviewState(character)
            .professionWeekly
        ]
      )
    );

    const characterItems = characters.map(
      (character) => ({
        id: character.id,
        name: character.name,
        realm: character.realm,
        region: character.region,
        className: character.className,
        level: character.level,
        completedTaskKeys:
          character.weeklyCompletions.map(
            (completion) =>
              completion.task.key
          ),
        professionWeekly:
          professionWeeklyByCharacterId.get(
            character.id
          ) ?? emptyProfessionWeeklyState()
      })
    );
    const completedTaskCount =
      characterItems.reduce(
        (total, character) =>
          total +
          character.completedTaskKeys.length,
        0
      );

    return {
      period,
      tasks: tasks.map((task) => ({
        key: task.key,
        title: task.title,
        description: task.description,
        category: task.category,
        sortOrder: task.sortOrder
      })),
      characters: characterItems,
      summary: {
        completedTaskCount,
        totalTaskCount:
          tasks.length *
          characterItems.length,
        completedCharacterCount:
          characterItems.filter(
            (character) =>
              tasks.length > 0 &&
              character.completedTaskKeys
                .length === tasks.length
          ).length
      }
    };
  }

  async updateTask(
    characterId: string,
    taskKey: string,
    input: WeeklyTaskUpdateInput
  ) {
    const [character, task] =
      await Promise.all([
        this.repository
          .findCharacterById(characterId),
        this.repository
          .findTaskByKey(taskKey)
      ]);

    if (!character) {
      throw new AppError(
        404,
        "Character not found."
      );
    }

    if (!task || !task.enabled) {
      throw new AppError(
        404,
        "Weekly task not found."
      );
    }

    const period =
      getWeeklyPeriod();

    await this.repository.setTaskCompletion(
      characterId,
      task.id,
      period.key,
      input.completed
    );

    return this.getChecklist();
  }

  async updateAllTasks(
    characterId: string,
    input: WeeklyTaskUpdateInput
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

    await this.repository
      .syncTaskCatalog(taskCatalog);

    const tasks =
      await this.repository.findTasks();
    const period =
      getWeeklyPeriod();

    await this.repository
      .setAllTaskCompletions(
        characterId,
        tasks.map((task) => task.id),
        period.key,
        input.completed
      );

    return this.getChecklist();
  }
}
