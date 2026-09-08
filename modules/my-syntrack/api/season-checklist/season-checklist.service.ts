import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
import { GearReadinessRepository } from "../gear-readiness/gear-readiness.repository.js";
import { GearReadinessService } from "../gear-readiness/gear-readiness.service.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";
import { buildTagsByCharacterId } from "../overview/overview-character-extras.js";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import { TrackerValueRepository } from "../trackers/tracker-value.repository.js";
import { TrackerValueService } from "../trackers/tracker-value.service.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import { resolveDefinitionByKey } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { ensureWeekliesTrackerDefinitionsForImport } from "../weekly-checklist/weeklies-tracker-definitions.service.js";
import { WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY } from "../weekly-checklist/weeklies-tracker-keys.js";
import { MythicPlusSeasonProgressService } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import { CharacterAchievementAuthorityService } from "../character-external-sync/character-achievement-authority.service.js";
import { CharacterMythicPlusAuthorityService } from "../character-external-sync/character-mythic-plus-authority.service.js";
import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { SeasonGoalPreferenceService } from "../season-goal-preference/season-goal-preference.service.js";
import { resolveActiveSeasonCharacters } from "./season-checklist.identity.js";
import { buildSeasonChecklistCharacters } from "./season-checklist.characters.js";
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";
import { ensureSeasonEvidenceTrackerDefinitionsForImport } from "./season-evidence-tracker-definitions.service.js";
import { buildWarbandGoals } from "./season-checklist.warband.js";
import { buildWarbandNumericGoals } from "./season-checklist.warband-numeric.js";
import type { SeasonChecklistResponse } from "./season-checklist.types.js";

export class SeasonChecklistService {
  private readonly repository = new WeeklyChecklistRepository();

  private readonly tagService = new TagService(new TagRepository());

  private readonly gearReadinessService = new GearReadinessService(
    new GearReadinessRepository()
  );

  private readonly trackerScopeProfileService = new TrackerScopeProfileService(new TrackerScopeProfileRepository());

  private readonly trackerDefinitionRepository = new TrackerDefinitionRepository();

  private readonly trackerValueService = new TrackerValueService(
    new TrackerValueRepository(),
    new TrackerDefinitionRepository()
  );

  private readonly mythicPlusSeasonProgressService = new MythicPlusSeasonProgressService();

  private readonly achievementAuthorityService = new CharacterAchievementAuthorityService(new CharacterExternalSnapshotRepository());

  private readonly seasonGoalPreferenceService = new SeasonGoalPreferenceService();

  // Constructor-injectable so wiring tests can prove the effective M+ rating/level-class paths are used.
  constructor(
    private readonly mythicPlusAuthorityService = new CharacterMythicPlusAuthorityService(new CharacterExternalSnapshotRepository()),
    private readonly profileAuthorityService = new CharacterProfileAuthorityService(new CharacterExternalSnapshotRepository())
  ) {}

  async getChecklist(): Promise<SeasonChecklistResponse> {
    const [weekliesScopeKey, evidenceScopeKey] = await Promise.all([
      ensureWeekliesTrackerDefinitionsForImport(
        this.trackerDefinitionRepository
      ),
      ensureSeasonEvidenceTrackerDefinitionsForImport(
        this.trackerDefinitionRepository
      )
    ]);

    const activeScope =
      await this.trackerScopeProfileService.getActive();

    const [characters, tags, tagAssignments, gearOverview] =
      await Promise.all([
        this.repository.findCharactersForSeason(),
        this.tagService.list(),
        this.tagService.listAllAssignments(),
        this.gearReadinessService.getOverview()
      ]);

    const gearByCharacterId = new Map(
      gearOverview.characters.map(
        (character) => [character.id, character] as const
      )
    );

    const tagsByCharacterId = buildTagsByCharacterId(
      tags,
      tagAssignments
    );

    const activeCharacters = await resolveActiveSeasonCharacters(
      characters,
      tagsByCharacterId,
      this.profileAuthorityService
    );

    const gameplayCharacters = activeCharacters.filter((character) =>
      isWeeklyGameplayEnabled(character.trackingProfile)
    );

    const characterIds = activeCharacters.map((character) => character.id);

    const scopeKeys = [
      ...(activeScope ? [activeScope.key] : []),
      weekliesScopeKey,
      evidenceScopeKey,
      GLOBAL_TRACKER_SCOPE_KEY
    ];
    const uniqueScopeKeys = [...new Set(scopeKeys)];

    const definitionsByScope = new Map(
      await Promise.all(
        uniqueScopeKeys.map(async (scopeKey) => [
          scopeKey,
          await this.trackerDefinitionRepository.findByScope(
            scopeKey
          )
        ] as const)
      )
    );

    const ratingDefinition = resolveDefinitionByKey(
      definitionsByScope,
      uniqueScopeKeys,
      WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY
    );

    const evidenceDefinitions = new Map(
      SEASON_EVIDENCE_CATALOG.map((evidence) => [
        evidence.trackerKey,
        resolveDefinitionByKey(
          definitionsByScope,
          uniqueScopeKeys,
          evidence.trackerKey
        )
      ])
    );

    const [
      trackerStates,
      mythicPlusSeasonProgressByCharacterId,
      goalPreferencesByCharacterId,
      warbandGoalPreferences,
      blizzardEarnedByCharacterMaps,
      mythicPlusRatingByCharacterId
    ] =
      characterIds.length > 0
        ? await Promise.all([
            Promise.all(
              uniqueScopeKeys.map((scopeKey) =>
                this.trackerValueService.getStatesForScope(
                  scopeKey,
                  characterIds
                )
              )
            ).then((states) => states.flat()),
            this.mythicPlusSeasonProgressService.getForCharacters(
              gameplayCharacters.map((character) => character.id)
            ),
            this.seasonGoalPreferenceService.getEffectivePreferencesByCharacter(
              gameplayCharacters.map((character) => character.id)
            ),
            this.seasonGoalPreferenceService.getEffectiveWarbandPreferences(),
            this.achievementAuthorityService.getBlizzardEarnedByCharacterMaps(
              characterIds
            ),
            this.mythicPlusAuthorityService.getAuthoritativeMythicPlusMap(
              gameplayCharacters.map((character) => character.id)
            )
          ])
        : [
            [],
            new Map(),
            new Map(),
            await this.seasonGoalPreferenceService.getEffectiveWarbandPreferences(),
            new Map(),
            new Map()
          ];

    const statesByCharacterId = new Map<
      string,
      Map<string, CharacterTrackerState>
    >();
    for (const state of trackerStates) {
      const existing =
        statesByCharacterId.get(state.characterId) ?? new Map();
      existing.set(state.trackerDefinitionId, state);
      statesByCharacterId.set(state.characterId, existing);
    }

    const {
      characters: characterItems,
      gameplayRatings,
      gameplayResiProgress
    } = buildSeasonChecklistCharacters({
      gameplayCharacters,
      statesByCharacterId,
      goalPreferencesByCharacterId,
      ratingDefinition,
      mythicPlusRatingByCharacterId,
      mythicPlusSeasonProgressByCharacterId,
      gearByCharacterId,
      evidenceDefinitions,
      blizzardEarnedByCharacterMaps
    });

    const warbandGoals = [
      ...buildWarbandNumericGoals(
        gameplayRatings,
        gameplayResiProgress,
        warbandGoalPreferences
      ),
      ...buildWarbandGoals(
        activeCharacters,
        statesByCharacterId,
        evidenceDefinitions,
        warbandGoalPreferences,
        blizzardEarnedByCharacterMaps
      )
    ];

    return {
      season: activeScope
        ? {
            key: activeScope.key,
            name: activeScope.name
          }
        : null,
      characters: characterItems,
      warbandGoals,
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
        )
      }
    };
  }
}
