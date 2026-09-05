import { buildResolvedTracker } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { SeasonGoalPreferenceValue } from "../season-goal-preference/season-goal-preference.types.js";
import { blizzardWarbandAchievementSignal } from "./season-achievement-blizzard-merge.js";
import {
  deriveBooleanEvidenceGoal,
  deriveWarbandBooleanGoal,
  deriveWarbandPortalsGoal
} from "./season-checklist.evidence.js";
import {
  SEASON_WARBAND_PORTAL_EVIDENCE,
  primarySeasonEvidenceForGoal
} from "./season-evidence-catalog.js";
import { enabledWarbandSeasonGoals } from "./season-goal-catalog.js";
import type { SeasonWarbandGoalView } from "./season-checklist.types.js";

/**
 * Builds every live Warband Season goal. System catalog decides which
 * Warband goals exist at all; the user's own preference decides which of
 * those they actually want to see — a disabled Warband goal is hidden from
 * the panel entirely, never shown as a placeholder row. Each goal resolves
 * its own canonical evidence — never reuse one goal's derived signals for
 * another (that was a real bug: every enabled Warband goal silently
 * collapsed onto whichever one was computed first).
 *
 * Phase E: `blizzardEarnedByCharacterMaps` (per-character Blizzard
 * ACHIEVEMENTS evidence, empty map for any character with no successful
 * snapshot yet) contributes one synthetic cross-character signal per
 * achievement, added alongside the existing addon-derived per-character
 * signals - deriveWarbandBooleanGoal/deriveWarbandPortalsGoal are
 * completely unmodified and have no idea a signal might be Blizzard-
 * sourced (see season-achievement-blizzard-merge.ts).
 */
export function buildWarbandGoals(
  activeCharacters: Array<{ id: string }>,
  statesByCharacterId: Map<string, Map<string, CharacterTrackerState>>,
  evidenceDefinitions: Map<string, TrackerDefinitionRow | null>,
  warbandGoalPreferences: Map<string, SeasonGoalPreferenceValue>,
  blizzardEarnedByCharacterMaps: Map<string, Map<number, boolean>> = new Map()
): SeasonWarbandGoalView[] {
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

  const withBlizzardSignal = (
    signals: ReturnType<typeof characterSignalsForTrackerKey>,
    achievementId: number,
    goalKey: string
  ) => {
    const blizzardSignal = blizzardWarbandAchievementSignal(
      achievementId,
      blizzardEarnedByCharacterMaps,
      goalKey
    );

    return blizzardSignal ? [...signals, blizzardSignal] : signals;
  };

  const enabledWarband = enabledWarbandSeasonGoals().filter(
    (goal) =>
      (warbandGoalPreferences.get(goal.key)?.enabled ?? true) !== false
  );

  return enabledWarband.map((goal) => {
    if (goal.key === "portals") {
      return deriveWarbandPortalsGoal(
        SEASON_WARBAND_PORTAL_EVIDENCE.map((evidence) =>
          withBlizzardSignal(
            characterSignalsForTrackerKey(evidence.trackerKey, "portals"),
            evidence.externalId,
            "portals"
          )
        )
      );
    }

    const evidence = primarySeasonEvidenceForGoal(goal.key);
    const signals = evidence
      ? withBlizzardSignal(
          characterSignalsForTrackerKey(evidence.trackerKey, goal.key),
          evidence.externalId,
          goal.key
        )
      : [];
    return deriveWarbandBooleanGoal(signals, goal.key);
  });
}
