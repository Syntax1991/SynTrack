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
  progress: number[],
  typeOverride?: number
) {
  const type =
    typeOverride ??
    (family === "mythic-plus" ? 1 : family === "raid" ? 3 : 6);
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
    level: null
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

  it("does not treat M+ run history alone as Vault progress", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        mythicPlusCaptured: true,
        mythicPlusRuns: runs(16)
      })
    );

    expect(view.mythicPlus.state).toBe("UNKNOWN");
    expect(view.mythicPlusAction).toBe("Mythic+ progress unresolved");
  });

  it("does not treat raid lockouts alone as Vault Raid progress", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        raidCaptured: true,
        raidLockouts: raidLockout(6, 8)
      })
    );

    expect(view.raid.state).toBe("UNKNOWN");
    expect(view.raidAction).toBeNull();
  });

  it("treats successful current-period World progress 0 as known zero", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        vaultActivities: vaultActivities("world", [2, 4, 8], [0, 0, 0])
      })
    );

    expect(view.delves).toMatchObject({
      state: "ATTENTION",
      completeCount: 0,
      applicableTotal: 8,
      rawCompleteCount: 0
    });
    expect(view.delvesAction).toBe("2 World activities for Vault slot 1");
  });

  it("derives Delves from World Great Vault progress / final threshold", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        vaultActivities: vaultActivities("world", [2, 4, 8], [4, 4, 4])
      })
    );

    expect(view.delves).toMatchObject({
      state: "ATTENTION",
      completeCount: 4,
      applicableTotal: 8,
      knownUnlockedSlots: 2,
      maxSlots: 3
    });
    expect(view.delvesAction).toBe(
      "4 more World activities for Vault slot 3"
    );
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
    expect(view.mythicPlusAction).toBe("Mythic+ progress unresolved");
    expect(view.delvesAction).toBe("Delves Vault progress unresolved");
  });

  it("uses next unmet Dungeon threshold for the M+ action", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        vaultActivities: vaultActivities("mythic-plus", [1, 4, 8], [0, 0, 0])
      })
    );

    expect(view.mythicPlusAction).toBe("1 M+ run for Vault slot 1");
  });

  it("uses next unmet Raid threshold for the Raid action", () => {
    const view = deriveWeeklyGameplay(
      snapshot({
        vaultCaptured: true,
        vaultCurrentPeriod: true,
        vaultActivities: vaultActivities("raid", [2, 4, 6], [2, 2, 2])
      })
    );

    expect(view.raidAction).toBe("2 more Raid bosses for Vault slot 2");
  });
});
