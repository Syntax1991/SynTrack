import type { AuthoritativeMythicPlusResult } from "../character-external-sync/character-external-sync.types.js";
import type { SeasonGoalPreferenceValue } from "../season-goal-preference/season-goal-preference.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { MythicPlusSeasonProgress } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import { buildResolvedTracker } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import { resolveMergedCharacterEvidence } from "./season-achievement-blizzard-merge.js";
import { deriveBooleanEvidenceGoal, deriveRaidGoal, type SeasonRaidGoalTarget } from "./season-checklist.evidence.js";
import { deriveSeasonEmbellishmentGoal } from "./season-checklist.embellishment.js";
import {
  applyGoalEnabledGate,
  deriveSeasonMythicPlusGoal,
  seasonMythicPlusRating,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
import { deriveResilientKeystoneGoal } from "./season-checklist.resilient.js";
import { deriveSeasonTierGoal } from "./season-checklist.tier.js";
import {
  resolveSeasonEmbellishmentOverviewState,
  resolveSeasonTierOverviewState
} from "./season-checklist.tier-source.js";
import { primarySeasonEvidenceForGoal } from "./season-evidence-catalog.js";
import { withAuthoritativeMythicPlusRating } from "./season-mythic-plus-rating-effective.js";
import type { SeasonChecklistCharacter } from "./season-checklist.types.js";

const NO_PREFERENCE: SeasonGoalPreferenceValue = {
  enabled: true,
  numericTarget: null,
  enumTarget: null
};

type SeasonGameplayCharacter = Omit<
  SeasonChecklistCharacter,
  | "mythicPlus"
  | "resi"
  | "tier"
  | "embellishments"
  | "cracked"
  | "nemesis"
  | "raid"
  | "goalsOpen"
  | "goalsComplete"
  | "goalsUnknown"
  | "action"
>;

type GearOverviewCharacter = Parameters<
  typeof resolveSeasonTierOverviewState
>[0];

type BuildSeasonChecklistCharactersInput = {
  gameplayCharacters: SeasonGameplayCharacter[];
  statesByCharacterId: Map<string, Map<string, CharacterTrackerState>>;
  goalPreferencesByCharacterId: Map<string, Map<string, SeasonGoalPreferenceValue>>;
  ratingDefinition: TrackerDefinitionRow | null;
  mythicPlusRatingByCharacterId: Map<string, AuthoritativeMythicPlusResult>;
  mythicPlusSeasonProgressByCharacterId: Map<string, MythicPlusSeasonProgress>;
  gearByCharacterId: Map<string, NonNullable<GearOverviewCharacter>>;
  evidenceDefinitions: Map<string, TrackerDefinitionRow | null>;
  blizzardEarnedByCharacterMaps: Map<string, Map<number, boolean>>;
};

/*
 * Per-Character Season goals. Score/Resi targets stay Character-scoped;
 * Warband Score/Resi are derived separately from the collected ratings
 * and Resi progress (best known fact, never a fabricated Warband rating).
 */
export function buildSeasonChecklistCharacters(
  input: BuildSeasonChecklistCharactersInput
) {
  const gameplayRatings: Array<number | null> = [];
  const gameplayResiProgress: Array<MythicPlusSeasonProgress | null> = [];

  const characters = input.gameplayCharacters.map((character) => {
    const statesByDefinitionId =
      input.statesByCharacterId.get(character.id) ?? new Map();
    const preferences =
      input.goalPreferencesByCharacterId.get(character.id) ?? new Map();
    const preferenceFor = (goalKey: string) =>
      preferences.get(goalKey) ?? NO_PREFERENCE;

    const resolvedRating = withAuthoritativeMythicPlusRating(
      buildResolvedTracker(input.ratingDefinition, statesByDefinitionId),
      character.id,
      input.mythicPlusRatingByCharacterId
    );
    gameplayRatings.push(seasonMythicPlusRating(resolvedRating));
    const scorePreference = preferenceFor("mythic-plus-score");
    const mythicPlus = applyGoalEnabledGate(
      deriveSeasonMythicPlusGoal(
        resolvedRating,
        scorePreference.numericTarget ?? 2000
      ),
      scorePreference.enabled
    );

    const resiProgress =
      input.mythicPlusSeasonProgressByCharacterId.get(character.id) ?? null;
    gameplayResiProgress.push(resiProgress);
    const resiPreference = preferenceFor("resilient-keystone");
    const resiTarget = resiPreference.enabled
      ? resiPreference.numericTarget
      : null;
    const resi = deriveResilientKeystoneGoal(resiProgress, resiTarget);

    const gearCharacter = input.gearByCharacterId.get(character.id);
    const tier = applyGoalEnabledGate(
      deriveSeasonTierGoal(resolveSeasonTierOverviewState(gearCharacter)),
      preferenceFor("tier-four-piece").enabled
    );
    const embellishments = applyGoalEnabledGate(
      deriveSeasonEmbellishmentGoal(
        resolveSeasonEmbellishmentOverviewState(gearCharacter)
      ),
      preferenceFor("embellishments").enabled
    );
    const resolveEvidence = (trackerKey: string) =>
      buildResolvedTracker(
        input.evidenceDefinitions.get(trackerKey) ?? null,
        statesByDefinitionId
      );
    const crackedEvidence = primarySeasonEvidenceForGoal("cracked-keystone");
    const nemesisEvidence = primarySeasonEvidenceForGoal("nemesis-aztarec");
    const cracked = applyGoalEnabledGate(
      deriveBooleanEvidenceGoal(
        resolveEvidence(crackedEvidence?.trackerKey ?? ""),
        "cracked-keystone"
      ),
      preferenceFor("cracked-keystone").enabled
    );
    const nemesis = applyGoalEnabledGate(
      deriveBooleanEvidenceGoal(
        resolveEvidence(nemesisEvidence?.trackerKey ?? ""),
        "nemesis-aztarec"
      ),
      preferenceFor("nemesis").enabled
    );
    const raidPreference = preferenceFor("raid");
    const characterBlizzardEarned =
      input.blizzardEarnedByCharacterMaps.get(character.id) ?? new Map();
    const raid = deriveRaidGoal(
      resolveMergedCharacterEvidence(
        "aotc-ulatek",
        resolveEvidence,
        characterBlizzardEarned
      ),
      resolveMergedCharacterEvidence(
        "ce-ulatek",
        resolveEvidence,
        characterBlizzardEarned
      ),
      (raidPreference.enumTarget as SeasonRaidGoalTarget | null) ?? "AOTC"
    );

    return {
      ...character,
      mythicPlus,
      resi,
      tier,
      embellishments,
      cracked,
      nemesis,
      raid,
      ...summarizeSeasonGoals([
        tier,
        embellishments,
        cracked,
        mythicPlus,
        nemesis,
        raid,
        ...(resiTarget !== null ? [resi] : [])
      ])
    };
  });

  return { characters, gameplayRatings, gameplayResiProgress };
}
