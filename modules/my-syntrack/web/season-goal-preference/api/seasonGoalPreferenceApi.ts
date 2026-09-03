import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  ManageGoalsView,
  SeasonGoalPreferenceInput,
  SeasonGoalPreferenceValue
} from "../types/seasonGoalPreference.types.js";

export function getManageGoalsView() {
  return apiRequest<ManageGoalsView>("/season-goal-preferences");
}

export function saveSeasonGoalPreference(input: SeasonGoalPreferenceInput) {
  return apiRequest<SeasonGoalPreferenceValue>("/season-goal-preferences", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function resetSeasonGoalPreference(
  goalKey: string,
  characterId: string | null
) {
  const params = new URLSearchParams({ goalKey });
  if (characterId) {
    params.set("characterId", characterId);
  }

  return apiRequest<SeasonGoalPreferenceValue>(
    `/season-goal-preferences?${params.toString()}`,
    { method: "DELETE" }
  );
}
