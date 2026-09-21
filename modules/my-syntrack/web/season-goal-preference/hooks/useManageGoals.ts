import { useCallback, useEffect, useState } from "react";
import {
  getManageGoalsView,
  resetSeasonGoalPreference,
  saveSeasonGoalPreference
} from "../api/seasonGoalPreferenceApi.js";
import type {
  ManageGoalsView,
  SeasonGoalPreferenceInput,
  SeasonGoalPreferenceValue
} from "../types/seasonGoalPreference.types.js";

function applyPreference(
  view: ManageGoalsView,
  goalKey: string,
  characterId: string | null,
  value: SeasonGoalPreferenceValue
): ManageGoalsView {
  if (!characterId) {
    return {
      ...view,
      warband: { ...view.warband, [goalKey]: value }
    };
  }

  return {
    ...view,
    characters: view.characters.map((character) =>
      character.id === characterId
        ? {
            ...character,
            preferences: {
              ...character.preferences,
              [goalKey]: value
            }
          }
        : character
    )
  };
}

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

  const save = useCallback(async (input: SeasonGoalPreferenceInput) => {
    setView((current) =>
      current
        ? applyPreference(current, input.goalKey, input.characterId, {
            enabled: input.enabled,
            numericTarget: input.numericTarget,
            enumTarget: input.enumTarget
          })
        : current
    );
    setError(null);

    try {
      const saved = await saveSeasonGoalPreference(input);
      setView((current) =>
        current
          ? applyPreference(
              current,
              input.goalKey,
              input.characterId,
              saved
            )
          : current
      );
    } catch (saveError) {
      // Roll back the optimistic patch so a failed POST never leaves a
      // checked-but-unsaved control. Full reload (not a local undo) so
      // we also pick up any concurrent edits.
      await reload();
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Season goal preference could not be saved."
      );
    }
  }, [reload]);

  const reset = useCallback(
    async (goalKey: string, characterId: string | null) => {
      setError(null);

      try {
        const restored = await resetSeasonGoalPreference(
          goalKey,
          characterId
        );
        setView((current) =>
          current
            ? applyPreference(current, goalKey, characterId, restored)
            : current
        );
      } catch (resetError) {
        setError(
          resetError instanceof Error
            ? resetError.message
            : "Season goal preference could not be reset."
        );
      }
    },
    []
  );

  return { view, isLoading, error, save, reset };
}
