import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { WeeklyChecklistService } from "../weekly-checklist/weekly-checklist.service.js";
import { VaultMythicPlusRepository } from "../vault-mythic-plus/vault-mythic-plus.repository.js";
import { VaultMythicPlusService } from "../vault-mythic-plus/vault-mythic-plus.service.js";
import { GearReadinessRepository } from "../gear-readiness/gear-readiness.repository.js";
import { GearReadinessService } from "../gear-readiness/gear-readiness.service.js";
import { ResourceReadinessRepository } from "../resources/resource-readiness.repository.js";
import { ResourceReadinessService } from "../resources/resource-readiness.service.js";
import { ProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.repository.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerDefinitionService } from "../trackers/tracker-definition.service.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import { TrackerValueRepository } from "../trackers/tracker-value.repository.js";
import { TrackerValueService } from "../trackers/tracker-value.service.js";
import type { TrackerDefinitionView } from "../trackers/tracker.types.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";
import { DataHealthRepository } from "../data-health/data-health.repository.js";
import { DataHealthService } from "../data-health/data-health.service.js";
import {
  attachCharacterExtras,
  buildTagsByCharacterId
} from "./overview-character-extras.js";
import { findCharacterControlDetail } from "./overview-character-state.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { loadProfessionIssuesByCharacter } from "./overview.profession-issues.js";
import { combinePinnedTrackerColumns } from "./overview-tracker-scopes.js";
import { buildTrackerStatesByCharacterId } from "./overview-tracker-state-map.js";
import type {
  CharacterControlDetailResponse,
  OverviewResponse
} from "./overview.types.js";

/*
 * Read-model orchestrator for the "My SynTrack" Overview. It owns no
 * completion state of its own - it calls the exact same domain services
 * Weekly Checklist, Vault/M+, Gear and Professions already use, then
 * normalizes and prioritizes the result (see overview.aggregator.ts).
 * A future duplicate-state bug class (a second "is this done" answer
 * diverging from the domain's own) is structurally impossible here
 * because no completion math is reimplemented - only read and reshaped.
 */
export class OverviewService {
  private readonly weeklyChecklistService =
    new WeeklyChecklistService(
      new WeeklyChecklistRepository()
    );

  private readonly vaultMythicPlusService =
    new VaultMythicPlusService(
      new VaultMythicPlusRepository()
    );

  private readonly gearReadinessService =
    new GearReadinessService(
      new GearReadinessRepository()
    );

  private readonly resourceReadinessService =
    new ResourceReadinessService(
      new ResourceReadinessRepository()
    );

  private readonly professionWeeklyStatusService =
    new ProfessionWeeklyStatusService(
      new ProfessionWeeklyStatusRepository()
    );

  private readonly trackerDefinitionService =
    new TrackerDefinitionService(
      new TrackerDefinitionRepository()
    );

  private readonly trackerValueService =
    new TrackerValueService(
      new TrackerValueRepository(),
      new TrackerDefinitionRepository()
    );

  private readonly trackerScopeProfileService =
    new TrackerScopeProfileService(
      new TrackerScopeProfileRepository()
    );

  private readonly tagService =
    new TagService(new TagRepository());

  private readonly dataHealthService =
    new DataHealthService(
      new DataHealthRepository()
    );

  async getOverview(): Promise<OverviewResponse> {
    const activeScope =
      await this.trackerScopeProfileService.getActive();

    const seasonalScopeKey =
      activeScope?.key ?? null;

    const [
      weeklyChecklist,
      vaultOverview,
      gearOverview,
      resourceOverview,
      professionWeeklyOverview,
      professionIssuesByCharacter,
      seasonalTrackerDefinitions,
      globalTrackerDefinitions,
      tags,
      tagAssignments
    ] = await Promise.all([
      this.weeklyChecklistService.getChecklist(),
      this.vaultMythicPlusService.getOverview(),
      this.gearReadinessService.getOverview(),
      this.resourceReadinessService.getOverview(),
      this.professionWeeklyStatusService.getOverview(),
      loadProfessionIssuesByCharacter(),
      seasonalScopeKey
        ? this.trackerDefinitionService.listByScope(
            seasonalScopeKey
          )
        : Promise.resolve<
            TrackerDefinitionView[]
          >([]),
      this.trackerDefinitionService.listByScope(
        GLOBAL_TRACKER_SCOPE_KEY
      ),
      this.tagService.list(),
      this.tagService.listAllAssignments()
    ]);

    /*
     * Every matrix tracker column combines the active season's pinned
     * trackers with GLOBAL's pinned trackers - GLOBAL survives season
     * switches by definition, so it is always included regardless of
     * which season is currently active.
     */
    const trackerColumns =
      combinePinnedTrackerColumns(
        seasonalTrackerDefinitions,
        globalTrackerDefinitions
      );

    const characterIds =
      weeklyChecklist.characters.map(
        (character) => character.id
      );

    const trackerStatesByCharacterId =
      await buildTrackerStatesByCharacterId(
        this.trackerValueService,
        trackerColumns,
        characterIds
      );

    const weeklyByCharacterId =
      new Map(
        weeklyChecklist.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const vaultByCharacterId =
      new Map(
        vaultOverview.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const gearByCharacterId =
      new Map(
        gearOverview.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const resourceByCharacterId =
      new Map(
        resourceOverview.characters.map(
          (character) => [
            character.id,
            {
              id: character.id,
              name: character.name,
              resources: character.resources
            }
          ]
        )
      );

    const professionWeeklyByCharacterId =
      new Map(
        professionWeeklyOverview.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const professionByCharacterId =
      new Map(
        [
          ...professionIssuesByCharacter.entries()
        ].map(
          ([
            characterId,
            entry
          ]) => [
            characterId,
            {
              id: characterId,
              name:
                weeklyByCharacterId.get(
                  characterId
                )?.name ?? "",
              hasTrackedProfession:
                entry.hasTrackedProfession,
              partialProfessionIssues:
                entry.partialIssues,
              professions:
                entry.professions
            }
          ]
        )
      );

    const {
      characters,
      attentionItems,
      summary
    } =
      aggregateCharacterWeeklyStates({
        period:
          weeklyChecklist.period,
        weeklyTaskCount:
          weeklyChecklist.tasks
            .length,
        characters:
          weeklyChecklist.characters.map(
            (character) => ({
              id: character.id,
              name: character.name,
              realm: character.realm,
              region:
                character.region,
              className:
                character.className,
              level: character.level
            })
          ),
        weeklyByCharacterId,
        vaultByCharacterId,
        gearByCharacterId,
        professionByCharacterId,
        resourceByCharacterId,
        professionWeeklyByCharacterId,
        trackerStatesByCharacterId
      });

    /*
     * Tags and Data Health are attached AFTER the core aggregation
     * runs - neither participates in readinessState/attentionItems/
     * nextAction, so overview.aggregator.ts's tested pure-function
     * chain never needs to know about either concept.
     */
    const tagsByCharacterId =
      buildTagsByCharacterId(
        tags,
        tagAssignments
      );

    const healthByCharacterId =
      await this.dataHealthService.getHealthByCharacterIds(
        characterIds
      );

    const {
      characters: charactersWithExtras,
      refreshNeededCount
    } = attachCharacterExtras(
      characters,
      tagsByCharacterId,
      healthByCharacterId
    );

    return {
      summary: {
        ...summary,
        refreshNeededCount
      },
      attentionItems,
      characters: charactersWithExtras,
      trackerColumns,
      activeScope,
      accountResources:
        resourceOverview.accountResources
    };
  }

  /*
   * The Character Detail Hub's read path - reuses getOverview() (the
   * exact same aggregation every domain already goes through) and
   * narrows to one character. This is not a second aggregator: no
   * completion/attention logic is reimplemented here.
   */
  async getCharacterState(
    characterId: string
  ): Promise<CharacterControlDetailResponse> {
    const overview =
      await this.getOverview();

    const detail =
      findCharacterControlDetail(
        overview,
        characterId
      );

    if (!detail) {
      throw new AppError(
        404,
        "Character not found."
      );
    }

    return detail;
  }
}
