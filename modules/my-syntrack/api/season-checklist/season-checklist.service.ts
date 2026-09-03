import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
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
import {
  buildResolvedTracker,
  resolveDefinitionByKey
} from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { ensureWeekliesTrackerDefinitionsForImport } from "../weekly-checklist/weeklies-tracker-definitions.service.js";
import { WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY } from "../weekly-checklist/weeklies-tracker-keys.js";
import { MythicPlusSeasonProgressService } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import { SeasonGoalPreferenceService } from "../season-goal-preference/season-goal-preference.service.js";
import type { SeasonGoalPreferenceValue } from "../season-goal-preference/season-goal-preference.types.js";
import {
  applyGoalEnabledGate,
  deriveSeasonMythicPlusGoal,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
import {
  deriveBooleanEvidenceGoal,
  deriveRaidGoal,
  type SeasonRaidGoalTarget
} from "./season-checklist.evidence.js";
import { deriveSeasonEmbellishmentGoal } from "./season-checklist.embellishment.js";
import { deriveResilientKeystoneGoal } from "./season-checklist.resilient.js";
import { deriveSeasonTierGoal } from "./season-checklist.tier.js";
import {
  resolveSeasonEmbellishmentOverviewState,
  resolveSeasonTierOverviewState
} from "./season-checklist.tier-source.js";
import {
  SEASON_EVIDENCE_CATALOG,
  primarySeasonEvidenceForGoal
} from "./season-evidence-catalog.js";
import { ensureSeasonEvidenceTrackerDefinitionsForImport } from "./season-evidence-tracker-definitions.service.js";
import { buildWarbandGoals } from "./season-checklist.warband.js";
import type { SeasonChecklistResponse } from "./season-checklist.types.js";

export class SeasonChecklistService {
  private readonly repository = new WeeklyChecklistRepository();

  private readonly tagService = new TagService(new TagRepository());

  private readonly gearReadinessService = new GearReadinessService(
    new GearReadinessRepository()
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

  private readonly mythicPlusSeasonProgressService =
    new MythicPlusSeasonProgressService();

  private readonly seasonGoalPreferenceService =
    new SeasonGoalPreferenceService();

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

    const [
      trackerStates,
      mythicPlusSeasonProgressByCharacterId,
      goalPreferencesByCharacterId,
      warbandGoalPreferences
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
            this.seasonGoalPreferenceService.getEffectiveWarbandPreferences()
          ])
        : [[], new Map(), new Map(), new Map()];

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

    const noPreference: SeasonGoalPreferenceValue = {
      enabled: true,
      numericTarget: null,
      enumTarget: null
    };

    const characterItems = gameplayCharacters.map((character) => {
      const statesByDefinitionId =
        statesByCharacterId.get(character.id) ?? new Map();
      const preferences =
        goalPreferencesByCharacterId.get(character.id) ?? new Map();
      const preferenceFor = (goalKey: string) =>
        preferences.get(goalKey) ?? noPreference;

      const scorePreference = preferenceFor("mythic-plus-score");
      const mythicPlus = applyGoalEnabledGate(
        deriveSeasonMythicPlusGoal(
          buildResolvedTracker(ratingDefinition, statesByDefinitionId),
          scorePreference.numericTarget ?? 2000
        ),
        scorePreference.enabled
      );

      const resiPreference = preferenceFor("resilient-keystone");
      // Disabled -> still informational (target null), never a real goal.
      const resiTarget = resiPreference.enabled
        ? resiPreference.numericTarget
        : null;
      const resi = deriveResilientKeystoneGoal(
        mythicPlusSeasonProgressByCharacterId.get(character.id) ?? null,
        resiTarget
      );
      const resiIsActiveGoal = resiTarget !== null;

      const gearCharacter = gearByCharacterId.get(character.id);
      const tierPreference = preferenceFor("tier-four-piece");
      const tier = applyGoalEnabledGate(
        deriveSeasonTierGoal(resolveSeasonTierOverviewState(gearCharacter)),
        tierPreference.enabled
      );
      const embPreference = preferenceFor("embellishments");
      const embellishments = applyGoalEnabledGate(
        deriveSeasonEmbellishmentGoal(
          resolveSeasonEmbellishmentOverviewState(gearCharacter)
        ),
        embPreference.enabled
      );
      const resolveEvidence = (trackerKey: string) =>
        buildResolvedTracker(
          evidenceDefinitions.get(trackerKey) ?? null,
          statesByDefinitionId
        );
      const crackedEvidence = primarySeasonEvidenceForGoal("cracked-keystone");
      const nemesisEvidence = primarySeasonEvidenceForGoal("nemesis-aztarec");
      const aotcEvidence = primarySeasonEvidenceForGoal("aotc-ulatek");
      const ceEvidence = primarySeasonEvidenceForGoal("ce-ulatek");
      const crackedPreference = preferenceFor("cracked-keystone");
      const cracked = applyGoalEnabledGate(
        deriveBooleanEvidenceGoal(
          resolveEvidence(crackedEvidence?.trackerKey ?? ""),
          "cracked-keystone"
        ),
        crackedPreference.enabled
      );
      const nemesisPreference = preferenceFor("nemesis");
      const nemesis = applyGoalEnabledGate(
        deriveBooleanEvidenceGoal(
          resolveEvidence(nemesisEvidence?.trackerKey ?? ""),
          "nemesis-aztarec"
        ),
        nemesisPreference.enabled
      );
      const raidPreference = preferenceFor("raid");
      const raid = deriveRaidGoal(
        resolveEvidence(aotcEvidence?.trackerKey ?? ""),
        resolveEvidence(ceEvidence?.trackerKey ?? ""),
        (raidPreference.enumTarget as SeasonRaidGoalTarget | null) ?? "AOTC"
      );
      // Action priority: Tier → Emb → Cracked → M+ → Nemesis → Raid.
      // Portals moved to Warband; Resi only counts when the user configured
      // an explicit target; disabled goals are NOT_APPLICABLE and are
      // skipped by summarizeSeasonGoals automatically. Serpent Scion /
      // Catalyst is intentionally excluded from product goals.
      const summary = summarizeSeasonGoals([
        tier,
        embellishments,
        cracked,
        mythicPlus,
        nemesis,
        raid,
        ...(resiIsActiveGoal ? [resi] : [])
      ]);

      return {
        ...character,
        mythicPlus,
        resi,
        tier,
        embellishments,
        cracked,
        nemesis,
        raid,
        ...summary
      };
    });

    const warbandGoals = buildWarbandGoals(
      activeCharacters,
      statesByCharacterId,
      evidenceDefinitions,
      warbandGoalPreferences
    );

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
