import { describe, expect, it } from "vitest";
import { deriveWeeklyGameplay } from "./weekly-gameplay.deriver.js";
import { formatVaultSlotSymbol } from "../weekly-progress/weekly-progress-display.js";
import {
  thisWeekMythicPlusRuns,
  thisWeekRaidKills
} from "./weekly-gameplay.vault.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

function snapshot(
  overrides: Partial<WeeklyGameplaySnapshotInput> = {}
): WeeklyGameplaySnapshotInput {
  return {
    characterId: "char-1",
    vaultCaptured: true,
    vaultCurrentPeriod: true,
    vaultGenerated: false,
    vaultCanClaim: false,
    vaultHasAvailable: false,
    mythicPlusCaptured: true,
    raidCaptured: true,
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

function activities(
  family: "mythic-plus" | "raid" | "world",
  thresholds: number[],
  progress: number[]
) {
  const type = family === "mythic-plus" ? 1 : family === "raid" ? 3 : 6;
  const typeName =
    family === "mythic-plus"
      ? "Activities"
      : family === "raid"
        ? "Raid"
        : "World";

  return thresholds.map((threshold, index) => ({
    type,
    typeName,
    index: index + 1,
    threshold,
    progress: progress[index] ?? 0,
    level: family === "mythic-plus" ? 15 - index : null
  }));
}

describe("Great Vault authority", () => {
  it("Synblast-equivalent: 3 Raid + 3 Dungeon + known-zero World = 6/9", () => {
    const input = snapshot({
      mythicPlusRuns: runs(3),
      raidLockouts: raidLockout(2, 8),
      vaultActivities: [
        ...activities("mythic-plus", [1, 4, 8], [16, 16, 16]),
        ...activities("raid", [2, 4, 6], [6, 6, 6]),
        ...activities("world", [2, 4, 8], [0, 0, 0])
      ]
    });

    expect(thisWeekMythicPlusRuns(input)).toBe(3);
    expect(thisWeekRaidKills(input)?.killed).toBe(2);

    const view = deriveWeeklyGameplay(input);

    expect(view.vault).toMatchObject({
      state: "ATTENTION",
      knownUnlockedSlots: 6,
      maxSlots: 9,
      hasUnknownCategories: false
    });
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("6/9");
    expect(view.mythicPlus).toMatchObject({
      state: "READY",
      completeCount: 8,
      applicableTotal: 8,
      rawCompleteCount: 16,
      knownUnlockedSlots: 3
    });
    expect(view.raid).toMatchObject({
      state: "READY",
      completeCount: 6,
      applicableTotal: 6,
      knownUnlockedSlots: 3
    });
    expect(view.delves).toMatchObject({
      completeCount: 0,
      applicableTotal: 8,
      knownUnlockedSlots: 0
    });
    expect(view.mythicPlusAction).toBeNull();
    expect(view.raidAction).toBeNull();
  });

  it("Synlight-equivalent: 3 Raid + 3 Dungeon + 2 World = 8/9, not 4/9", () => {
    const input = snapshot({
      mythicPlusRuns: runs(3),
      raidLockouts: raidLockout(2, 8),
      vaultActivities: [
        ...activities("mythic-plus", [1, 4, 8], [8, 8, 8]),
        ...activities("raid", [2, 4, 6], [6, 6, 6]),
        ...activities("world", [2, 4, 8], [4, 4, 4])
      ]
    });

    const view = deriveWeeklyGameplay(input);

    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("8/9");
    expect(view.vault).toMatchObject({
      knownUnlockedSlots: 8,
      maxSlots: 9,
      hasUnknownCategories: false
    });
    expect(view.mythicPlus).toMatchObject({
      completeCount: 8,
      applicableTotal: 8,
      knownUnlockedSlots: 3
    });
    expect(view.raid).toMatchObject({
      completeCount: 6,
      applicableTotal: 6,
      knownUnlockedSlots: 3
    });
    expect(view.delves).toMatchObject({
      completeCount: 4,
      applicableTotal: 8,
      knownUnlockedSlots: 2
    });
    expect(view.delves.state).not.toBe("UNKNOWN");
    expect(view.raid.completeCount).not.toBe(2);
  });

  it("two unlocked Dungeon slots cannot report compact progress below slot-2 threshold", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusRuns: runs(3),
        vaultActivities: activities("mythic-plus", [1, 4, 8], [4, 4, 4])
      })
    );

    expect(view.mythicPlus.knownUnlockedSlots).toBe(2);
    expect(view.mythicPlus.completeCount).toBe(4);
    expect(view.mythicPlus.applicableTotal).toBe(8);
    expect(view.mythicPlus.completeCount).toBeGreaterThanOrEqual(4);
    expect(view.mythicPlusAction).toBe("4 more M+ runs for Vault slot 3");
  });

  it("direct C_WeeklyRewards progress overrides contradictory M+ history and raid lockouts", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusRuns: runs(3),
        raidLockouts: raidLockout(2, 8),
        vaultActivities: [
          ...activities("mythic-plus", [1, 4, 8], [8, 8, 8]),
          ...activities("raid", [2, 4, 6], [6, 6, 6])
        ]
      })
    );

    expect(view.mythicPlus.completeCount).toBe(8);
    expect(view.raid.completeCount).toBe(6);
    expect(view.vault.knownUnlockedSlots).toBe(6);
    expect(view.vault.unresolvedCategoryLabels).toEqual(["World"]);
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("6/9");
  });

  it("keeps Vault at x/9 when World is unresolved rather than dropping the denominator", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultActivities: [
          ...activities("mythic-plus", [1, 4, 8], [8, 8, 8]),
          ...activities("raid", [2, 4, 6], [6, 6, 6])
        ]
      })
    );

    expect(view.delves.state).toBe("UNKNOWN");
    expect(view.vault.maxSlots).toBe(9);
    expect(view.vault.hasUnknownCategories).toBe(true);
    expect(view.vault.state).toBe("IN_PROGRESS");
  });

  it("Synblast live shape: currentPeriod false is in-week progress, Vault 6/9", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCurrentPeriod: false,
        vaultGenerated: false,
        vaultCanClaim: false,
        vaultHasAvailable: false,
        vaultActivities: [
          ...activities("mythic-plus", [1, 4, 8], [2, 7, 11]),
          ...activities("raid", [2, 4, 6], [9, 9, 9]),
          ...activities("world", [2, 4, 8], [0, 0, 0])
        ]
      })
    );

    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("6/9");
    expect(view.mythicPlus).toMatchObject({
      completeCount: 8,
      applicableTotal: 8,
      knownUnlockedSlots: 3
    });
    expect(view.raid).toMatchObject({
      completeCount: 6,
      applicableTotal: 6,
      knownUnlockedSlots: 3
    });
    expect(view.delves).toMatchObject({
      completeCount: 0,
      applicableTotal: 8,
      knownUnlockedSlots: 0
    });
  });

  it("Synlight live shape: currentPeriod false still yields Vault 8/9", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCurrentPeriod: false,
        vaultCanClaim: false,
        vaultHasAvailable: false,
        vaultActivities: [
          ...activities("mythic-plus", [1, 4, 8], [6, 6, 11]),
          ...activities("raid", [2, 4, 6], [6, 6, 6]),
          ...activities("world", [2, 4, 8], [2, 4, 7])
        ]
      })
    );

    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("8/9");
    expect(view.delves).toMatchObject({
      completeCount: 7,
      applicableTotal: 8,
      knownUnlockedSlots: 2
    });
  });
});
