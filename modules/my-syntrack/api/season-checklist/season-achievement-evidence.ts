import type { SeasonEvidenceScope } from "./season-evidence-catalog.js";

/**
 * Resolve which captured achievement fact applies for catalog scope.
 *
 * CHARACTER: earnedByCharacter only — never treat accountCompleted as
 * character completion (would falsely complete every alt).
 *
 * WARBAND: accountCompleted only — wasEarnedByMe is irrelevant.
 *
 * Missing scoped fact → null (UNKNOWN). Never invent false.
 */
export function resolveSeasonAchievementCompletion(
  scope: SeasonEvidenceScope,
  accountCompleted: boolean | null,
  earnedByCharacter: boolean | null
): boolean | null {
  if (scope === "WARBAND") {
    return accountCompleted;
  }

  return earnedByCharacter;
}
