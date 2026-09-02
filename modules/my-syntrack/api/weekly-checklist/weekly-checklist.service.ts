import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
import { ProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.repository.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";
import { buildTagsByCharacterId } from "../overview/overview-character-extras.js";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { WeeklyGameplayRepository } from "../weekly-gameplay/weekly-gameplay.repository.js";
import { WeeklyGameplayService } from "../weekly-gameplay/weekly-gameplay.service.js";
import { WeeklyChecklistRepository } from "./weekly-checklist.repository.js";
import type {
  WeeklyChecklistTaskDefinition,
  WeeklyTaskUpdateInput
} from "./weekly-checklist.types.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import { TrackerValueRepository } from "../trackers/tracker-value.repository.js";
import { TrackerValueService } from "../trackers/tracker-value.service.js";
import { loadWeekliesTrackerBundlesByCharacterId } from "./weeklies-gameplay-signals.loader.js";
import {
  createDefaultWeekliesGameplaySignals,
  resolveWeekliesGameplaySignals
} from "./weeklies-gameplay-signals.mapper.js";
import { ensureWeekliesTrackerDefinitionsForImport } from "./weeklies-tracker-definitions.service.js";
import { resolveWeekliesProfessionWeeklySummary } from "./weeklies-profession-summary.mapper.js";

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

  private readonly tagService = new TagService(new TagRepository());

  private readonly weeklyGameplayService = new WeeklyGameplayService(
    new WeeklyGameplayRepository()
  );

  private readonly trackerScopeProfileService =
    new TrackerScopeProfileService(
      new TrackerScopeProfileRepository()
    );

  private readonly trackerDefinitionRepository =
    new TrackerDefinitionRepository();

  private readonly trackerValueService = new TrackerValueService(
    new TrackerValueRepository(),
    new TrackerDefinitionRepository()
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
    await ensureWeekliesTrackerDefinitionsForImport();

    const [
      tasks,
      characters,
      professionWeeklyOverview,
      tags,
      tagAssignments,
      weeklyGameplayOverview
    ] =
      await Promise.all([
        this.repository.findTasks(),
        this.repository.findCharacters(
          period.key
        ),
        this.professionWeeklyStatusService.getOverview(),
        this.tagService.list(),
        this.tagService.listAllAssignments(),
        this.weeklyGameplayService.getOverview()
      ]);

    const professionWeeklyByCharacterId = new Map(
      professionWeeklyOverview.characters.map((character) => [
        character.id,
        character
      ])
    );

    const tagsByCharacterId = buildTagsByCharacterId(tags, tagAssignments);
    const weeklyGameplayByCharacterId = new Map(
      weeklyGameplayOverview.characters.map((character) => [
        character.characterId,
        character
      ])
    );

    const gameplayCharacters = characters
      .map((character) => {
        const trackingProfile = resolveCharacterTrackingProfile(
          tagsByCharacterId.get(character.id) ?? []
        );

        return {
          id: character.id,
          name: character.name,
          realm: character.realm,
          region: character.region,
          className: character.className,
          level: character.level,
          trackingProfile,
          completedTaskKeys: character.weeklyCompletions.map(
            (completion) => completion.task.key
          ),
          professionWeeklySummary:
            resolveWeekliesProfessionWeeklySummary({
              professions:
                professionWeeklyByCharacterId.get(character.id)
                  ?.professions ?? []
            }),
          weeklyGameplay:
            weeklyGameplayByCharacterId.get(character.id) ?? null
        };
      })
      .filter((character) =>
        isWeeklyGameplayEnabled(character.trackingProfile)
      );

    const trackerBundlesByCharacterId =
      await loadWeekliesTrackerBundlesByCharacterId(
        gameplayCharacters.map((character) => character.id),
        {
          trackerScopeProfileService:
            this.trackerScopeProfileService,
          trackerDefinitionRepository:
            this.trackerDefinitionRepository,
          trackerValueService: this.trackerValueService
        }
      );

    const characterItems = gameplayCharacters.map((character) => {
      const trackerBundle =
        trackerBundlesByCharacterId.get(character.id);

      return {
        ...character,
        gameplaySignals: trackerBundle
          ? resolveWeekliesGameplaySignals({
              bounty: trackerBundle.bounty,
              meta: trackerBundle.meta,
              delves: character.weeklyGameplay?.delves ?? null
            })
          : createDefaultWeekliesGameplaySignals()
      };
    });
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
