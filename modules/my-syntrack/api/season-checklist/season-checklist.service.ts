import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
import { ProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.repository.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";
import { buildTagsByCharacterId } from "../overview/overview-character-extras.js";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import { TrackerValueRepository } from "../trackers/tracker-value.repository.js";
import { TrackerValueService } from "../trackers/tracker-value.service.js";
import {
  buildResolvedTracker,
  resolveDefinitionByKey
} from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { resolveWeekliesProfessionWeeklySummary } from "../weekly-checklist/weeklies-profession-summary.mapper.js";
import { ensureWeekliesTrackerDefinitionsForImport } from "../weekly-checklist/weeklies-tracker-definitions.service.js";
import { WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY } from "../weekly-checklist/weeklies-tracker-keys.js";
import {
  deriveSeasonMythicPlusGoal,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
import {
  blockedCharacterSeasonGoalGaps,
  warbandSeasonGoalGaps
} from "./season-goal-catalog.js";
import type { SeasonChecklistResponse } from "./season-checklist.types.js";

export class SeasonChecklistService {
  private readonly repository = new WeeklyChecklistRepository();

  private readonly professionWeeklyStatusService =
    new ProfessionWeeklyStatusService(
      new ProfessionWeeklyStatusRepository()
    );

  private readonly tagService = new TagService(new TagRepository());

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

  async getChecklist(): Promise<SeasonChecklistResponse> {
    await ensureWeekliesTrackerDefinitionsForImport(
      this.trackerDefinitionRepository
    );

    const period = getWeeklyPeriod();
    const activeScope =
      await this.trackerScopeProfileService.getActive();

    const [
      characters,
      professionWeeklyOverview,
      tags,
      tagAssignments
    ] = await Promise.all([
      this.repository.findCharacters(period.key),
      this.professionWeeklyStatusService.getOverview(),
      this.tagService.list(),
      this.tagService.listAllAssignments()
    ]);

    const professionWeeklyByCharacterId = new Map(
      professionWeeklyOverview.characters.map((character) => [
        character.id,
        character
      ])
    );
    const tagsByCharacterId = buildTagsByCharacterId(
      tags,
      tagAssignments
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
          professionWeeklySummary:
            resolveWeekliesProfessionWeeklySummary({
              professions:
                professionWeeklyByCharacterId.get(character.id)
                  ?.professions ?? []
            })
        };
      })
      .filter((character) =>
        isWeeklyGameplayEnabled(character.trackingProfile)
      );

    const characterIds = gameplayCharacters.map(
      (character) => character.id
    );

    const scopeKeys = [
      ...(activeScope ? [activeScope.key] : []),
      GLOBAL_TRACKER_SCOPE_KEY
    ];

    const definitionsByScope = new Map(
      await Promise.all(
        scopeKeys.map(async (scopeKey) => [
          scopeKey,
          await this.trackerDefinitionRepository.findByScope(
            scopeKey
          )
        ] as const)
      )
    );

    const ratingDefinition = resolveDefinitionByKey(
      definitionsByScope,
      scopeKeys,
      WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY
    );

    const trackerStates =
      ratingDefinition && characterIds.length > 0
        ? await this.trackerValueService.getStatesForScope(
            ratingDefinition.scopeKey,
            characterIds
          )
        : [];

    const characterItems = gameplayCharacters.map((character) => {
      const statesByDefinitionId = new Map(
        trackerStates
          .filter((state) => state.characterId === character.id)
          .map((state) => [state.trackerDefinitionId, state])
      );

      const mythicPlus = deriveSeasonMythicPlusGoal(
        buildResolvedTracker(ratingDefinition, statesByDefinitionId)
      );
      const summary = summarizeSeasonGoals([mythicPlus]);

      return {
        ...character,
        mythicPlus,
        ...summary
      };
    });

    const warbandGoals = warbandSeasonGoalGaps().map((entry) => ({
      key: entry.key,
      title: entry.title,
      state: "CAPTURE_PENDING" as const,
      label: "—",
      detail: entry.captureGap ?? "Capture not available yet"
    }));

    return {
      season: activeScope
        ? {
            key: activeScope.key,
            name: activeScope.name
          }
        : null,
      characters: characterItems,
      warbandGoals,
      blockedCharacterGoals: blockedCharacterSeasonGoalGaps(),
      summary: {
        characterCount: characterItems.length,
        goalsOpen: characterItems.reduce(
          (total, character) => total + character.goalsOpen,
          0
        ),
        goalsComplete: characterItems.reduce(
          (total, character) => total + character.goalsComplete,
          0
        ),
        goalsUnknown: characterItems.reduce(
          (total, character) => total + character.goalsUnknown,
          0
        ),
        warbandGoalsPending: warbandGoals.length
      }
    };
  }
}
