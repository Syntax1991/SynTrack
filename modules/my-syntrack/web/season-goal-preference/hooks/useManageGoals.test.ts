import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManageGoalsView } from "../types/seasonGoalPreference.types.js";

const getManageGoalsView = vi.fn();
const saveSeasonGoalPreference = vi.fn();
const resetSeasonGoalPreference = vi.fn();

vi.mock("../api/seasonGoalPreferenceApi.js", () => ({
  getManageGoalsView: (...args: unknown[]) => getManageGoalsView(...args),
  saveSeasonGoalPreference: (...args: unknown[]) =>
    saveSeasonGoalPreference(...args),
  resetSeasonGoalPreference: (...args: unknown[]) =>
    resetSeasonGoalPreference(...args)
}));

import { useManageGoals } from "./useManageGoals.js";

const view: ManageGoalsView = {
  definitions: [
    {
      key: "mythic-plus-score",
      label: "Mythic+ Score",
      detail: "score",
      scope: "CHARACTER",
      targetType: "NUMBER",
      defaultEnabled: true,
      defaultNumericTarget: 2000,
      defaultEnumTarget: null,
      numericPresets: [2000, 2500, 3000],
      enumOptions: null,
      minNumericTarget: 1
    }
  ],
  characters: [
    {
      id: "char-1",
      name: "Synblast",
      realm: "Antonidas",
      className: "Shaman",
      preferences: {
        "mythic-plus-score": {
          enabled: true,
          numericTarget: 2000,
          enumTarget: null
        }
      }
    }
  ],
  warband: {}
};

describe("useManageGoals", () => {
  beforeEach(() => {
    getManageGoalsView.mockReset();
    saveSeasonGoalPreference.mockReset();
    resetSeasonGoalPreference.mockReset();
    getManageGoalsView.mockResolvedValue(view);
  });

  it("patches the loaded view on save without a full reload", async () => {
    saveSeasonGoalPreference.mockResolvedValue({
      enabled: true,
      numericTarget: 3150,
      enumTarget: null
    });

    const { result } = renderHook(() => useManageGoals(true));

    await waitFor(() => {
      expect(result.current.view).not.toBeNull();
    });

    expect(getManageGoalsView).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.save({
        goalKey: "mythic-plus-score",
        characterId: "char-1",
        enabled: true,
        numericTarget: 3150,
        enumTarget: null
      });
    });

    expect(getManageGoalsView).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(
      result.current.view?.characters[0]?.preferences["mythic-plus-score"]
    ).toEqual({
      enabled: true,
      numericTarget: 3150,
      enumTarget: null
    });
  });
});
