import { describe, expect, it } from "vitest";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { ResolvedTrackerDefinition } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import {
  blizzardWarbandAchievementSignal,
  withAchievementBlizzardMerge
} from "./season-achievement-blizzard-merge.js";

function resolvedBoolean(value: boolean): ResolvedTrackerDefinition {
  const definition: TrackerDefinitionRow = {
    id: "def-1",
    scopeKey: "MIDNIGHT-S2",
    key: "season-achievement-63650",
    name: "AOTC: Ula'tek",
    valueType: "BOOLEAN",
    resetBehavior: "SEASONAL",
    category: "SEASON_EVIDENCE",
    sortOrder: 1,
    isPinned: false,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    definition,
    state: {
      trackerDefinitionId: "def-1",
      characterId: "char-1",
      periodKey: "ALWAYS",
      state: "RECORDED",
      source: "ADDON",
      value: { valueType: "BOOLEAN", boolean: value }
    }
  };
}

describe("withAchievementBlizzardMerge (CHARACTER-scoped)", () => {
  it("returns the original object unchanged when Blizzard has no evidence (no spurious BLIZZARD source label)", () => {
    const resolved = resolvedBoolean(true);
    const result = withAchievementBlizzardMerge(resolved, 63650, new Map());

    expect(result).toBe(resolved);
  });

  it("regression guard: Blizzard's false does not downgrade an addon-confirmed true (live-caught AOTC case)", () => {
    const resolved = resolvedBoolean(true);
    const result = withAchievementBlizzardMerge(resolved, 63650, new Map([[63650, false]]));

    expect(result).toBe(resolved);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: true });
  });

  it("synthesizes a BLIZZARD-sourced true when the addon has a definition but no recorded state yet", () => {
    const noStateYet: ResolvedTrackerDefinition = {
      ...resolvedBoolean(false),
      state: null
    };
    const result = withAchievementBlizzardMerge(noStateYet, 63650, new Map([[63650, true]]));

    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: true });
    expect(result?.state?.source).toBe("BLIZZARD");
  });

  it("returns null unchanged when no addon tracker definition was ever bootstrapped (nothing to attach Blizzard evidence to)", () => {
    const result = withAchievementBlizzardMerge(null, 63650, new Map([[63650, true]]));

    expect(result).toBeNull();
  });

  it("account-wide achievement does not incorrectly satisfy a character-specific goal: Blizzard true for an UNRELATED achievement id never leaks into this one", () => {
    const resolved = resolvedBoolean(false);
    const result = withAchievementBlizzardMerge(resolved, 63650, new Map([[99999, true]]));

    expect(result).toBe(resolved);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: false });
  });
});

describe("blizzardWarbandAchievementSignal (WARBAND aggregation)", () => {
  it("returns null (contributes nothing) when no character has ever produced a Blizzard snapshot", () => {
    const result = blizzardWarbandAchievementSignal(62437, new Map(), "portals");

    expect(result).toBeNull();
  });

  it("COMPLETE when at least one tracked character's Blizzard data confirms the achievement", () => {
    const maps = new Map([
      ["char-1", new Map([[62437, false]])],
      ["char-2", new Map([[62437, true]])]
    ]);

    const result = blizzardWarbandAchievementSignal(62437, maps, "portals");

    expect(result?.state).toBe("COMPLETE");
  });

  it("character-specific evidence does not incorrectly constrain a Warband goal: one character's false does not block another's confirmed true", () => {
    const maps = new Map([
      ["char-1", new Map([[62437, false]])],
      ["char-2", new Map([[62437, false]])],
      ["char-3", new Map([[62437, true]])]
    ]);

    const result = blizzardWarbandAchievementSignal(62437, maps, "portals");

    expect(result?.state).toBe("COMPLETE");
  });

  it("INCOMPLETE when Blizzard evidence exists but nobody has earned it yet", () => {
    const maps = new Map([
      ["char-1", new Map([[62437, false]])],
      ["char-2", new Map([[62437, false]])]
    ]);

    const result = blizzardWarbandAchievementSignal(62437, maps, "portals");

    expect(result?.state).toBe("INCOMPLETE");
  });
});
