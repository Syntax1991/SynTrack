import { useCallback, useEffect, useState } from "react";
import {
  getManageGoalsView,
  resetSeasonGoalPreference,
  saveSeasonGoalPreference
} from "../api/seasonGoalPreferenceApi.js";
import type {
  ManageGoalsView,
  SeasonGoalPreferenceInput
} from "../types/seasonGoalPreference.types.js";

export function useManageGoals(active: boolean) {
  const [view, setView] = useState<ManageGoalsView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const next = await getManageGoalsView();
      setView(next);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Season goal preferences could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      void reload();
    }
  }, [active, reload]);

  const save = useCallback(
    async (input: SeasonGoalPreferenceInput) => {
      try {
        await saveSeasonGoalPreference(input);
        await reload();
      } catch (saveError) {
        // Never leave a checked-but-unsaved control — view stays at its
        // last successful fetch, so the control re-renders back to the
        // real persisted state, with the error surfaced instead of silent.
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Season goal preference could not be saved."
        );
      }
    },
    [reload]
  );

  const reset = useCallback(
    async (goalKey: string, characterId: string | null) => {
      try {
        await resetSeasonGoalPreference(goalKey, characterId);
        await reload();
      } catch (resetError) {
        setError(
          resetError instanceof Error
            ? resetError.message
            : "Season goal preference could not be reset."
        );
      }
    },
    [reload]
  );

  return { view, isLoading, error, save, reset };
}
