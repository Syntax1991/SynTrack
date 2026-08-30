import { describe, expect, it } from "vitest";
import { deriveWeeklyGameplay } from "./weekly-gameplay.deriver.js";
import { formatVaultSlotSymbol } from "../weekly-progress/weekly-progress-display.js";
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

function runs(count: number) {
  return Array.from({ length: count }, () => ({
    keyLevel: 10,
    completed: true,
    thisWeek: true
  }));
}

function raidLockout(killed: number, total: number) {
  return [
    {
      instanceName: "Manaforge Omega",
      encounterProgress: killed,
      numEncounters: total,
      encountersJson: JSON.stringify(
        Array.from({ length: total }, (_, index) => ({
          isKilled: index < killed
        }))
      )
    }
  ];
}

function vaultActivities(
  family: "mythic-plus" | "raid" | "world",
  thresholds: number[],
  progress: number[]
) {
  const type =
    family === "mythic-plus" ? 1 : family === "raid" ? 3 : 4;
  const typeName =
    family === "mythic-plus"
      ? "Activities"
      : family === "raid"
        ? "Raid"
        : "World";

  return thresholds.map((threshold, index) => ({
    type,
    typeName,
    threshold,
    progress: progress[index] ?? 0
  }));
}

describe("deriveWeeklyGameplay", () => {
  it("keeps missing capture as UNKNOWN, never fabricating 0/8 or 0/9", () => {
    const view = deriveWeeklyGameplay(snapshot());

    expect(view.vault.state).toBe("UNKNOWN");
    expect(view.mythicPlus.state).toBe("UNKNOWN");
    expect(view.raid.state).toBe("UNKNOWN");
    expect(view.delves.state).toBe("UNKNOWN");
    expect(view.mythicPlus.applicableTotal).toBe(0);
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("?");
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
      applicableTotal: 8,
      rawCompleteCount: 0
    });
    expect(view.mythicPlusAction).toBe(
      "8 more M+ runs for Vault slot 3"
    );
  });

  it("counts this-week completed keys toward the 8-run vault cap", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: runs(6)
      })
    );

    expect(view.mythicPlus.completeCount).toBe(6);
    expect(view.mythicPlus.applicableTotal).toBe(8);
    expect(view.mythicPlusAction).toBe(
      "2 more M+ runs for Vault slot 3"
    );
  });

  it("Synblast: raw M+ 16 clamps to 8/8 and keeps rawCompleteCount 16", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: runs(16)
      })
    );

    expect(view.mythicPlus).toMatchObject({
      state: "READY",
      completeCount: 8,
      applicableTotal: 8,
      rawCompleteCount: 16
    });
    expect(view.mythicPlusAction).toBeNull();
  });

  it("Synblast: M+ complete + raid complete + Delves UNKNOWN is 6/9 cell, not ?", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: runs(16),
        raidCaptured: true,
        raidLockouts: raidLockout(8, 8)
      })
    );

    expect(view.mythicPlus.completeCount).toBe(8);
    expect(view.raid).toMatchObject({
      state: "READY",
      completeCount: 8,
      applicableTotal: 8
    });
    expect(view.delves.state).toBe("UNKNOWN");
    expect(view.vault).toMatchObject({
      state: "IN_PROGRESS",
      knownUnlockedSlots: 6,
      maxSlots: 9,
      hasUnknownCategories: true,
      unknownCategoryCount: 1
    });
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("6/9");
  });

  it("does not treat unknown Delves as zero unlocked vault slots", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: runs(16),
        raidCaptured: true,
        raidLockouts: raidLockout(8, 8)
      })
    );

    expect(view.vault.knownUnlockedSlots).toBe(6);
    expect(view.vault.hasUnknownCategories).toBe(true);
    expect(view.vault.state).not.toBe("READY");
    expect(view.vault.state).toBe("IN_PROGRESS");
  });

  it("uses exact Vault unlocked/maximum when every category is known", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        mythicPlusCaptured: true,
        mythicPlusRuns: runs(8),
        raidCaptured: true,
        raidLockouts: raidLockout(6, 8),
        vaultActivities: [
          ...vaultActivities("mythic-plus", [1, 4, 8], [8, 8, 8]),
          ...vaultActivities("raid", [2, 4, 6], [6, 6, 6]),
          ...vaultActivities("world", [2, 4, 8], [8, 8, 8])
        ]
      })
    );

    expect(view.vault).toMatchObject({
      state: "READY",
      knownUnlockedSlots: 9,
      maxSlots: 9,
      hasUnknownCategories: false
    });
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("9/9");
    expect(view.delves).toMatchObject({
      completeCount: 3,
      applicableTotal: 3
    });
  });

  it("derives raid 6/8 from captured encounter kills", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        raidCaptured: true,
        raidLockouts: raidLockout(6, 8)
      })
    );

    expect(view.raid).toMatchObject({
      state: "ATTENTION",
      completeCount: 6,
      applicableTotal: 8,
      rawCompleteCount: 6
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

  it("clamps raid display to captured vault raid thresholds", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        raidCaptured: true,
        raidLockouts: raidLockout(8, 8),
        vaultActivities: vaultActivities("raid", [2, 4, 6], [0, 0, 0])
      })
    );

    expect(view.raid).toMatchObject({
      state: "READY",
      completeCount: 6,
      applicableTotal: 6,
      rawCompleteCount: 8
    });
  });

  it("derives Delves from current-period World activities without inventing 0", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        vaultActivities: vaultActivities("world", [2, 4, 8], [4, 4, 4])
      })
    );

    expect(view.delves).toMatchObject({
      state: "ATTENTION",
      completeCount: 2,
      applicableTotal: 3
    });
  });

  it("does not trust stale World progress from a previous reward period", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: false,
        vaultActivities: vaultActivities("world", [2, 4, 8], [8, 8, 8])
      })
    );

    expect(view.delves.state).toBe("UNKNOWN");
    expect(view.vault.state).toBe("UNKNOWN");
  });
});
