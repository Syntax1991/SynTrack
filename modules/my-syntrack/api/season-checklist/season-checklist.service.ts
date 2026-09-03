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
import {
  deriveSeasonMythicPlusGoal,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
import {
  deriveBooleanEvidenceGoal,
  deriveRaidGoal,
  deriveWarbandBooleanGoal,
  deriveWarbandPortalsGoal
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
  SEASON_WARBAND_PORTAL_EVIDENCE,
  primarySeasonEvidenceForGoal
} from "./season-evidence-catalog.js";
import { ensureSeasonEvidenceTrackerDefinitionsForImport } from "./season-evidence-tracker-definitions.service.js";
import {
  enabledWarbandSeasonGoals
} from "./season-goal-catalog.js";
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

    const [trackerStates, mythicPlusSeasonProgressByCharacterId] =
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
            )
          ])
        : [[], new Map()];

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

    const characterSignalsForTrackerKey = (
      trackerKey: string,
      fallbackGoalKey: string
    ) => {
      const definition = evidenceDefinitions.get(trackerKey) ?? null;
      return activeCharacters.map((character) =>
        deriveBooleanEvidenceGoal(
          buildResolvedTracker(
            definition,
            statesByCharacterId.get(character.id) ?? new Map()
          ),
          fallbackGoalKey
        )
      );
    };

    const characterItems = gameplayCharacters.map((character) => {
      const statesByDefinitionId =
        statesByCharacterId.get(character.id) ?? new Map();

      const mythicPlus = deriveSeasonMythicPlusGoal(
        buildResolvedTracker(ratingDefinition, statesByDefinitionId)
      );
      const resi = deriveResilientKeystoneGoal(
        mythicPlusSeasonProgressByCharacterId.get(character.id) ?? null
      );
      const gearCharacter = gearByCharacterId.get(character.id);
      const tier = deriveSeasonTierGoal(
        resolveSeasonTierOverviewState(gearCharacter)
      );
      const embellishments = deriveSeasonEmbellishmentGoal(
        resolveSeasonEmbellishmentOverviewState(gearCharacter)
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
      const cracked = deriveBooleanEvidenceGoal(
        resolveEvidence(crackedEvidence?.trackerKey ?? ""),
        "cracked-keystone"
      );
      const nemesis = deriveBooleanEvidenceGoal(
        resolveEvidence(nemesisEvidence?.trackerKey ?? ""),
        "nemesis-aztarec"
      );
      const raid = deriveRaidGoal(
        resolveEvidence(aotcEvidence?.trackerKey ?? ""),
        resolveEvidence(ceEvidence?.trackerKey ?? "")
      );
      // Action priority: Tier → Emb → Cracked → M+ → Nemesis → Raid.
      // Portals moved to Warband; Resi is informational; Serpent Scion /
      // Catalyst is intentionally excluded from product goals.
      const summary = summarizeSeasonGoals([
        tier,
        embellishments,
        cracked,
        mythicPlus,
        nemesis,
        raid
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

    const enabledWarband = enabledWarbandSeasonGoals();
    // Each Warband goal resolves its own canonical evidence — never reuse
    // one goal's derived signals for another (that bug let every enabled
    // Warband goal silently collapse onto whichever one was computed first).
    const warbandGoals = enabledWarband.map((goal) => {
      if (goal.key === "portals") {
        return deriveWarbandPortalsGoal(
          SEASON_WARBAND_PORTAL_EVIDENCE.map((evidence) =>
            characterSignalsForTrackerKey(evidence.trackerKey, "portals")
          )
        );
      }

      const evidence = primarySeasonEvidenceForGoal(goal.key);
      const signals = evidence
        ? characterSignalsForTrackerKey(evidence.trackerKey, goal.key)
        : [];
      return deriveWarbandBooleanGoal(signals, goal.key);
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
