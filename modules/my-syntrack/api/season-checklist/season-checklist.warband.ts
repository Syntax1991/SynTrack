import { buildResolvedTracker } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { SeasonGoalPreferenceValue } from "../season-goal-preference/season-goal-preference.types.js";
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
 */
export function buildWarbandGoals(
  activeCharacters: Array<{ id: string }>,
  statesByCharacterId: Map<string, Map<string, CharacterTrackerState>>,
  evidenceDefinitions: Map<string, TrackerDefinitionRow | null>,
  warbandGoalPreferences: Map<string, SeasonGoalPreferenceValue>
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

  const enabledWarband = enabledWarbandSeasonGoals().filter(
    (goal) =>
      (warbandGoalPreferences.get(goal.key)?.enabled ?? true) !== false
  );

  return enabledWarband.map((goal) => {
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
}
