import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
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
import { ensureWeekliesTrackerDefinitionsForImport } from "../weekly-checklist/weeklies-tracker-definitions.service.js";
import { WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY } from "../weekly-checklist/weeklies-tracker-keys.js";
import {
  deriveSeasonMythicPlusGoal,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
import {
  deriveBooleanEvidenceGoal,
  derivePortalsGoal,
  deriveRaidGoal,
  deriveWarbandBooleanGoal
} from "./season-checklist.evidence.js";
import {
  SEASON_EVIDENCE_CATALOG,
  seasonEvidenceForGoal
} from "./season-evidence-catalog.js";
import { ensureSeasonEvidenceTrackerDefinitionsForImport } from "./season-evidence-tracker-definitions.service.js";
import {
  enabledWarbandSeasonGoals
} from "./season-goal-catalog.js";
import type { SeasonChecklistResponse } from "./season-checklist.types.js";

export class SeasonChecklistService {
  private readonly repository = new WeeklyChecklistRepository();

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

    const [characters, tags, tagAssignments] = await Promise.all([
      this.repository.findCharactersForSeason(),
      this.tagService.list(),
      this.tagService.listAllAssignments()
    ]);

    const tagsByCharacterId = buildTagsByCharacterId(
      tags,
      tagAssignments
    );

    // Active SynTrack Characters only (RemovedCharacter rows are deleted
    // from Character). Warband evidence uses this full roster; the Season
    // Character table still filters to gameplay-applicable Characters.
    const activeCharacters = characters.map((character) => {
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
        trackingProfile
      };
    });

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

    const trackerStates = characterIds.length > 0
      ? (
          await Promise.all(
            uniqueScopeKeys.map((scopeKey) =>
              this.trackerValueService.getStatesForScope(
                scopeKey,
                characterIds
              )
            )
          )
        ).flat()
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
      const resolveEvidence = (trackerKey: string) =>
        buildResolvedTracker(
          evidenceDefinitions.get(trackerKey) ?? null,
          statesByDefinitionId
        );
      const portals = derivePortalsGoal(
        seasonEvidenceForGoal("portals").map((evidence) =>
          resolveEvidence(evidence.trackerKey)
        )
      );
      const catalyst = deriveBooleanEvidenceGoal(
        resolveEvidence("season-achievement-62872")
      );
      const cracked = deriveBooleanEvidenceGoal(
        resolveEvidence("season-quest-cracked-keystone")
      );
      const nemesis = deriveBooleanEvidenceGoal(
        resolveEvidence("season-achievement-63326")
      );
      const raid = deriveRaidGoal(
        resolveEvidence("season-achievement-63650"),
        resolveEvidence("season-achievement-63651")
      );
      const summary = summarizeSeasonGoals([
        mythicPlus,
        portals,
        catalyst,
        cracked,
        nemesis,
        raid
      ]);

      return {
        ...character,
        mythicPlus,
        portals,
        catalyst,
        cracked,
        nemesis,
        raid,
        ...summary
      };
    });

    const tierDefinition = evidenceDefinitions.get(
      "season-achievement-63473"
    ) ?? null;
    const tierSignals = activeCharacters.map((character) => {
      const statesByDefinitionId = new Map(
        trackerStates
          .filter((state) => state.characterId === character.id)
          .map((state) => [state.trackerDefinitionId, state])
      );
      return deriveBooleanEvidenceGoal(
        buildResolvedTracker(tierDefinition, statesByDefinitionId)
      );
    });
    const warbandGoals: SeasonChecklistResponse["warbandGoals"] =
      enabledWarbandSeasonGoals().map((goal) => {
        const derived = deriveWarbandBooleanGoal(
          tierSignals,
          goal.key,
          goal.title,
          "Earn Sssensational!"
        );

        return {
          ...derived,
          detail: "Account-tier achievement 63473"
        };
      });

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
