import { describe, expect, it } from "vitest";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { ResolvedTrackerDefinition } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import {
  blizzardWarbandAchievementSignal,
  withAchievementBlizzardMerge
} from "./season-achievement-blizzard-merge.js";

const AOTC_ID = 63650;
const CE_ID = 63651;
const PORTAL_ID = 62437; // proven-safe, CHARACTER_SCOPE_PROVEN_BLIZZARD_ACHIEVEMENT_IDS

function resolvedBoolean(
  value: boolean,
  trackerKey = "season-achievement-63650"
): ResolvedTrackerDefinition {
  const definition: TrackerDefinitionRow = {
    id: "def-1",
    scopeKey: "MIDNIGHT-S2",
    key: trackerKey,
    name: trackerKey,
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

describe("withAchievementBlizzardMerge - CHARACTER-scope allowlist (post-Phase-E corrective review)", () => {
  it("AOTC (unverified): a Blizzard true CANNOT complete a CHARACTER AOTC goal while its scope remains unproven", () => {
    const addonFalse = resolvedBoolean(false);
    const result = withAchievementBlizzardMerge(addonFalse, AOTC_ID, new Map([[AOTC_ID, true]]));

    expect(result).toBe(addonFalse);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: false });
  });

  it("CE (unverified): a Blizzard true CANNOT complete a CHARACTER CE goal while its scope remains unproven", () => {
    const addonFalse = resolvedBoolean(false);
    const result = withAchievementBlizzardMerge(addonFalse, CE_ID, new Map([[CE_ID, true]]));

    expect(result).toBe(addonFalse);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: false });
  });

  it("AOTC: addon true still completes the goal regardless of what Blizzard reports (live-caught case: Blizzard false, addon true)", () => {
    const addonTrue = resolvedBoolean(true);
    const result = withAchievementBlizzardMerge(addonTrue, AOTC_ID, new Map([[AOTC_ID, false]]));

    expect(result).toBe(addonTrue);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: true });
  });

  it("CE: addon true still completes the goal regardless of what Blizzard reports", () => {
    const addonTrue = resolvedBoolean(true, "season-achievement-63651");
    const result = withAchievementBlizzardMerge(addonTrue, CE_ID, new Map([[CE_ID, false]]));

    expect(result).toBe(addonTrue);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: true });
  });

  it("AOTC: Blizzard cannot even downgrade to false when the addon has no recorded state - unverified ids never contribute in either direction", () => {
    const noStateYet: ResolvedTrackerDefinition = { ...resolvedBoolean(false), state: null };
    const result = withAchievementBlizzardMerge(noStateYet, AOTC_ID, new Map([[AOTC_ID, true]]));

    expect(result).toBe(noStateYet);
    expect(result?.state).toBeNull();
  });

  it("Dungeon Portals (proven-safe): Blizzard true DOES contribute to the CHARACTER goal", () => {
    const noStateYet: ResolvedTrackerDefinition = {
      ...resolvedBoolean(false, "season-portal-62437"),
      state: null
    };
    const result = withAchievementBlizzardMerge(noStateYet, PORTAL_ID, new Map([[PORTAL_ID, true]]));

    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: true });
    expect(result?.state?.source).toBe("BLIZZARD");
  });

  it("Dungeon Portals (proven-safe): Blizzard's false never downgrades an addon-confirmed true (monotonic)", () => {
    const addonTrue = resolvedBoolean(true, "season-portal-62437");
    const result = withAchievementBlizzardMerge(addonTrue, PORTAL_ID, new Map([[PORTAL_ID, false]]));

    expect(result).toBe(addonTrue);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: true });
  });

  it("returns the original object unchanged when Blizzard has no evidence at all (no spurious BLIZZARD source label)", () => {
    const resolved = resolvedBoolean(true, "season-portal-62437");
    const result = withAchievementBlizzardMerge(resolved, PORTAL_ID, new Map());

    expect(result).toBe(resolved);
  });

  it("returns null unchanged when no addon tracker definition was ever bootstrapped, even for a proven-safe id", () => {
    const result = withAchievementBlizzardMerge(null, PORTAL_ID, new Map([[PORTAL_ID, true]]));

    expect(result).toBeNull();
  });

  it("a Blizzard true for an unrelated/account-wide achievement id never leaks into a different CHARACTER goal's evaluation", () => {
    const resolved = resolvedBoolean(false, "season-portal-62437");
    const result = withAchievementBlizzardMerge(resolved, PORTAL_ID, new Map([[99999, true]]));

    expect(result).toBe(resolved);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: false });
  });

  it("Valeera (WARBAND-only, never a CHARACTER-scope allowlist entry): a Blizzard true cannot feed a CHARACTER evaluation even if misused this way", () => {
    const addonFalse = resolvedBoolean(false, "season-achievement-63435");
    const result = withAchievementBlizzardMerge(addonFalse, 63435, new Map([[63435, true]]));

    expect(result).toBe(addonFalse);
    expect(result?.state?.value).toEqual({ valueType: "BOOLEAN", boolean: false });
  });
});

describe("blizzardWarbandAchievementSignal (WARBAND aggregation - NOT gated by the CHARACTER allowlist)", () => {
  it("returns null (contributes nothing) when no character has ever produced a Blizzard snapshot", () => {
    const result = blizzardWarbandAchievementSignal(62437, new Map(), "portals");

    expect(result).toBeNull();
  });

  it("Dungeon Portals: COMPLETE when at least one tracked character's Blizzard data confirms the achievement", () => {
    const maps = new Map([
      ["char-1", new Map([[62437, false]])],
      ["char-2", new Map([[62437, true]])]
    ]);

    const result = blizzardWarbandAchievementSignal(62437, maps, "portals");

    expect(result?.state).toBe("COMPLETE");
  });

  it("Tier Visual (account-wide, proven): Blizzard true contributes to the Warband goal", () => {
    const maps = new Map([
      ["char-1", new Map([[63473, true]])],
      ["char-2", new Map([[63473, true]])]
    ]);

    const result = blizzardWarbandAchievementSignal(63473, maps, "tier-visual");

    expect(result?.state).toBe("COMPLETE");
  });

  it("Valeera (WARBAND-only): Blizzard true contributes to the Warband goal via the same cross-character path", () => {
    const maps = new Map([
      ["char-1", new Map([[63435, false]])],
      ["char-2", new Map([[63435, true]])]
    ]);

    const result = blizzardWarbandAchievementSignal(63435, maps, "valeera-80");

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
