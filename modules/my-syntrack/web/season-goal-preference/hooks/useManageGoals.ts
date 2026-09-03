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
      await saveSeasonGoalPreference(input);
      await reload();
    },
    [reload]
  );

  const reset = useCallback(
    async (goalKey: string, characterId: string | null) => {
      await resetSeasonGoalPreference(goalKey, characterId);
      await reload();
    },
    [reload]
  );

  return { view, isLoading, error, save, reset };
}
