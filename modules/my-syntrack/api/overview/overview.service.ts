import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { WeeklyChecklistService } from "../weekly-checklist/weekly-checklist.service.js";
import { GearReadinessRepository } from "../gear-readiness/gear-readiness.repository.js";
import { GearReadinessService } from "../gear-readiness/gear-readiness.service.js";
import { ResourceReadinessRepository } from "../resources/resource-readiness.repository.js";
import { ResourceReadinessService } from "../resources/resource-readiness.service.js";
import { ProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.repository.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import { ProfessionKnowledgeTreasureStatusRepository } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.repository.js";
import { ProfessionKnowledgeTreasureStatusService } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.service.js";
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
import { WeeklyGameplayRepository } from "../weekly-gameplay/weekly-gameplay.repository.js";
import { WeeklyGameplayService } from "../weekly-gameplay/weekly-gameplay.service.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import { applyAuthoritativeProfile } from "./overview-profile-effective.js";
import { applyAuthoritativeProfessionSkill } from "./overview-profession-effective.js";
import {
  attachCharacterExtras,
  buildTagsByCharacterId
} from "./overview-character-extras.js";
import { findCharacterControlDetail } from "./overview-character-state.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { loadProfessionIssuesByCharacter } from "./overview.profession-issues.js";
import {
  buildCharacterIdMap,
  buildProfessionByCharacterId,
  buildProfessionKnowledgeTreasureByCharacterId,
  buildProfessionWeeklyByCharacterId,
  buildResourceByCharacterId
} from "./overview.service.maps.js";
import { combinePinnedTrackerColumns } from "./overview-tracker-scopes.js";
import { buildTrackerStatesByCharacterId } from "./overview-tracker-state-map.js";
import type {
  CharacterControlDetailResponse,
  OverviewResponse
} from "./overview.types.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";

/*
 * Read-model orchestrator for the "My SynTrack" Overview. It owns no
 * completion state of its own - it calls the exact same domain services
 * Weekly Checklist, Vault/M+, Gear and Professions already use, then
 * normalizes and prioritizes the result (see overview.aggregator.ts).
 */
export class OverviewService {
  private readonly weeklyChecklistService = new WeeklyChecklistService(
    new WeeklyChecklistRepository()
  );

  private readonly gearReadinessService = new GearReadinessService(
    new GearReadinessRepository()
  );

  private readonly resourceReadinessService = new ResourceReadinessService(
    new ResourceReadinessRepository()
  );

  private readonly professionWeeklyStatusService =
    new ProfessionWeeklyStatusService(
      new ProfessionWeeklyStatusRepository()
    );

  private readonly professionKnowledgeTreasureStatusService =
    new ProfessionKnowledgeTreasureStatusService(
      new ProfessionKnowledgeTreasureStatusRepository()
    );

  private readonly trackerDefinitionService = new TrackerDefinitionService(
    new TrackerDefinitionRepository()
  );

  private readonly trackerValueService = new TrackerValueService(
    new TrackerValueRepository(),
    new TrackerDefinitionRepository()
  );

  private readonly trackerScopeProfileService =
    new TrackerScopeProfileService(new TrackerScopeProfileRepository());

  private readonly tagService = new TagService(new TagRepository());

  private readonly dataHealthService = new DataHealthService(
    new DataHealthRepository()
  );

  private readonly weeklyGameplayService = new WeeklyGameplayService(
    new WeeklyGameplayRepository()
  );

  private readonly profileAuthorityService = new CharacterProfileAuthorityService(
    new CharacterExternalSnapshotRepository()
  );

  private readonly professionAuthorityService = new CharacterProfessionAuthorityService(
    new CharacterExternalSnapshotRepository()
  );

  async getOverview(): Promise<OverviewResponse> {
    const activeScope =
      await this.trackerScopeProfileService.getActive();
    const seasonalScopeKey = activeScope?.key ?? null;

    const [
      weeklyChecklist,
      gearOverview,
      resourceOverview,
      professionWeeklyOverview,
      professionKnowledgeTreasureOverview,
      professionIssuesByCharacter,
      seasonalTrackerDefinitions,
      globalTrackerDefinitions,
      tags,
      tagAssignments,
      weeklyGameplayOverview
    ] = await Promise.all([
      this.weeklyChecklistService.getChecklist(),
      this.gearReadinessService.getOverview(),
      this.resourceReadinessService.getOverview(),
      this.professionWeeklyStatusService.getOverview(),
      this.professionKnowledgeTreasureStatusService.getOverview(),
      loadProfessionIssuesByCharacter(),
      seasonalScopeKey
        ? this.trackerDefinitionService.listByScope(seasonalScopeKey)
        : Promise.resolve<TrackerDefinitionView[]>([]),
      this.trackerDefinitionService.listByScope(GLOBAL_TRACKER_SCOPE_KEY),
      this.tagService.list(),
      this.tagService.listAllAssignments(),
      this.weeklyGameplayService.getOverview()
    ]);

    await applyAuthoritativeProfessionSkill(
      professionIssuesByCharacter,
      this.professionAuthorityService
    );

    const trackerColumns = combinePinnedTrackerColumns(
      seasonalTrackerDefinitions,
      globalTrackerDefinitions
    );

    const characterIds = weeklyChecklist.characters.map(
      (character) => character.id
    );

    const trackerStatesByCharacterId =
      await buildTrackerStatesByCharacterId(
        this.trackerValueService,
        trackerColumns,
        characterIds
      );

    const weeklyByCharacterId = buildCharacterIdMap(
      weeklyChecklist.characters
    );

    const tagsByCharacterId = buildTagsByCharacterId(tags, tagAssignments);

    const {
      characters,
      attentionItems,
      summary
    } = aggregateCharacterWeeklyStates({
      period: weeklyChecklist.period,
      weeklyTaskCount: weeklyChecklist.tasks.length,
      characters: weeklyChecklist.characters.map((character) => ({
        id: character.id,
        name: character.name,
        realm: character.realm,
        region: character.region,
        className: character.className,
        level: character.level
      })),
      weeklyByCharacterId,
      vaultByCharacterId: new Map(),
      gearByCharacterId: buildCharacterIdMap(gearOverview.characters),
      professionByCharacterId: buildProfessionByCharacterId(
        professionIssuesByCharacter,
        weeklyByCharacterId
      ),
      resourceByCharacterId: buildResourceByCharacterId(
        resourceOverview.characters
      ),
      professionWeeklyByCharacterId: buildProfessionWeeklyByCharacterId(
        professionWeeklyOverview.characters
      ),
      professionKnowledgeTreasureByCharacterId:
        buildProfessionKnowledgeTreasureByCharacterId(
          professionKnowledgeTreasureOverview.characters
        ),
      trackerStatesByCharacterId,
      tagsByCharacterId,
      weeklyGameplayByCharacterId: new Map(
        weeklyGameplayOverview.characters.map((character) => [
          character.characterId,
          character
        ])
      )
    });

    const healthByCharacterId =
      await this.dataHealthService.getHealthByCharacterIds(characterIds);

    const {
      characters: charactersWithExtras,
      refreshNeededCount
    } = attachCharacterExtras(
      characters,
      tagsByCharacterId,
      healthByCharacterId
    );

    await applyAuthoritativeProfile(
      charactersWithExtras,
      this.profileAuthorityService
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
      accountResources: resourceOverview.accountResources
    };
  }

  /*
   * Character Detail Hub - reuses getOverview() and narrows to one
   * character. No second aggregator: no completion logic reimplemented.
   */
  async getCharacterState(
    characterId: string
  ): Promise<CharacterControlDetailResponse> {
    const overview = await this.getOverview();
    const detail = findCharacterControlDetail(overview, characterId);

    if (!detail) {
      throw new AppError(404, "Character not found.");
    }

    return detail;
  }
}
