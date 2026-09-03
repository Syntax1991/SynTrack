/** Sentinel characterId used for a WARBAND-scoped preference row — see the
 * SeasonGoalPreference schema comment for why this isn't a nullable column. */
export const SEASON_GOAL_PREFERENCE_WARBAND_SCOPE = "WARBAND";

export type SeasonGoalPreferenceValue = {
  enabled: boolean;
  numericTarget: number | null;
  enumTarget: string | null;
};

export type SeasonGoalPreferenceRow = SeasonGoalPreferenceValue & {
  goalKey: string;
  characterId: string;
};

export type SeasonGoalPreferenceInput = {
  goalKey: string;
  /** null for a WARBAND-scoped goal, a real Character id otherwise. */
  characterId: string | null;
  enabled: boolean;
  numericTarget: number | null;
  enumTarget: string | null;
};
