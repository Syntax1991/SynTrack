import { describe, expect, it } from "vitest";
import { deriveWeeklyGameplay } from "./weekly-gameplay.deriver.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

function snapshot(
  overrides: Partial<WeeklyGameplaySnapshotInput> = {}
): WeeklyGameplaySnapshotInput {
  return {
    characterId: "char-1",
    vaultCaptured: false,
    vaultCurrentPeriod: null,
    mythicPlusCaptured: false,
    raidCaptured: false,
    vaultActivities: [],
    mythicPlusRuns: [],
    raidLockouts: [],
    ...overrides
  };
}

describe("deriveWeeklyGameplay", () => {
  it("keeps missing capture as UNKNOWN, never fabricating 0/8 or 0/3", () => {
    const view = deriveWeeklyGameplay(snapshot());

    expect(view.vault.state).toBe("UNKNOWN");
    expect(view.mythicPlus.state).toBe("UNKNOWN");
    expect(view.raid.state).toBe("UNKNOWN");
    expect(view.delves.state).toBe("UNKNOWN");
    expect(view.mythicPlus.applicableTotal).toBe(0);
  });

  it("treats successful empty M+ history as known 0/8", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: []
      })
    );

    expect(view.mythicPlus).toMatchObject({
      state: "ATTENTION",
      completeCount: 0,
      applicableTotal: 8
    });
    expect(view.mythicPlusAction).toBe(
      "8 more M+ runs for Vault slot 3"
    );
  });

  it("counts this-week completed keys toward the 8-run vault cap", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: [
          { keyLevel: 8, completed: true, thisWeek: true },
          { keyLevel: 7, completed: true, thisWeek: true },
          { keyLevel: 6, completed: true, thisWeek: true },
          { keyLevel: 6, completed: true, thisWeek: true },
          { keyLevel: 6, completed: true, thisWeek: true },
          { keyLevel: 6, completed: true, thisWeek: true }
        ]
      })
    );

    expect(view.mythicPlus.completeCount).toBe(6);
    expect(view.mythicPlus.applicableTotal).toBe(8);
    expect(view.mythicPlusAction).toBe(
      "2 more M+ runs for Vault slot 3"
    );
  });

  it("derives raid 6/8 from captured encounter kills", () => {
    const encounters = [
      { isKilled: true },
      { isKilled: true },
      { isKilled: true },
      { isKilled: true },
      { isKilled: true },
      { isKilled: true },
      { isKilled: false },
      { isKilled: false }
    ];

    const view = deriveWeeklyGameplay(
      snapshot({
        raidCaptured: true,
        raidLockouts: [
          {
            instanceName: "Manaforge Omega",
            encounterProgress: 6,
            numEncounters: 8,
            encountersJson: JSON.stringify(encounters)
          }
        ]
      })
    );

    expect(view.raid).toMatchObject({
      state: "ATTENTION",
      completeCount: 6,
      applicableTotal: 8
    });
    expect(view.raidAction).toBe("2 raid bosses remaining");
  });

  it("keeps raid UNKNOWN when capture succeeded but no lockout exists", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        raidCaptured: true,
        raidLockouts: []
      })
    );

    expect(view.raid.state).toBe("UNKNOWN");
  });

  it("derives Vault 2/3 and Delves from fresh World/Raid/M+ activities", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        vaultActivities: [
          { typeName: "Activities", threshold: 1, progress: 2 },
          { typeName: "Raid", threshold: 2, progress: 0 },
          { typeName: "World", threshold: 1, progress: 1 },
          { typeName: "World", threshold: 4, progress: 1 },
          { typeName: "World", threshold: 8, progress: 1 }
        ]
      })
    );

    expect(view.vault).toMatchObject({
      state: "ATTENTION",
      completeCount: 2,
      applicableTotal: 3
    });
    expect(view.delves).toMatchObject({
      state: "ATTENTION",
      completeCount: 1,
      applicableTotal: 3
    });
  });

  it("does not trust stale vault payloads from a previous reward period", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: false,
        vaultActivities: [
          { typeName: "World", threshold: 1, progress: 8 }
        ]
      })
    );

    expect(view.vault.state).toBe("UNKNOWN");
    expect(view.delves.state).toBe("UNKNOWN");
  });
});
