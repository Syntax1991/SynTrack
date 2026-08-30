import { describe, expect, it } from "vitest";
import { normalizeWeeklyActivitySnapshot } from "./addon-import.weekly-activity.normalizer.js";
import type { LuaTable } from "./addon-import.types.js";

function weeklyActivityModule(
  data: LuaTable,
  schemaVersion = 1
): LuaTable {
  return {
    schemaVersion,
    data
  };
}

describe("normalizeWeeklyActivitySnapshot", () => {
  it("returns null for an absent or unsupported module", () => {
    expect(normalizeWeeklyActivitySnapshot(undefined)).toBeNull();
    expect(
      normalizeWeeklyActivitySnapshot(
        weeklyActivityModule({ vault: { captured: true } }, 2)
      )
    ).toBeNull();
  });

  it("keeps successful empty M+ history as captured, never fabricating runs", () => {
    const snapshot = normalizeWeeklyActivitySnapshot(
      weeklyActivityModule({
        vault: { captured: true, currentPeriod: true, activities: {} },
        mythicPlus: { captured: true, runs: {} },
        raids: { captured: true, raids: {} }
      })
    );

    expect(snapshot?.mythicPlusCaptured).toBe(true);
    expect(snapshot?.mythicPlusRuns).toEqual([]);
    expect(snapshot?.raidCaptured).toBe(true);
    expect(snapshot?.raids).toEqual([]);
  });

  it("normalizes vault activities and this-week M+ runs", () => {
    const snapshot = normalizeWeeklyActivitySnapshot(
      weeklyActivityModule({
        vault: {
          captured: true,
          currentPeriod: true,
          generated: true,
          activities: {
            "1": {
              type: 1,
              typeName: "Activities",
              index: 1,
              threshold: 1,
              progress: 1,
              id: 10
            }
          }
        },
        mythicPlus: {
          captured: true,
          runs: {
            "1": {
              mapChallengeModeId: 503,
              level: 8,
              completed: true,
              thisWeek: true
            }
          }
        },
        raids: { captured: false }
      })
    );

    expect(snapshot?.vaultActivities[0]?.threshold).toBe(1);
    expect(snapshot?.mythicPlusRuns[0]?.keyLevel).toBe(8);
    expect(snapshot?.raidCaptured).toBe(false);
  });
});
