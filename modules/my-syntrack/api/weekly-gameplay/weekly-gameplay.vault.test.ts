import { describe, expect, it } from "vitest";
import {
  resolveVaultCategory,
  vaultFamily
} from "./weekly-gameplay.vault.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

function snapshot(
  overrides: Partial<WeeklyGameplaySnapshotInput> = {}
): WeeklyGameplaySnapshotInput {
  return {
    characterId: "char-1",
    vaultCaptured: true,
    vaultCurrentPeriod: true,
    mythicPlusCaptured: false,
    raidCaptured: false,
    vaultActivities: [],
    mythicPlusRuns: [],
    raidLockouts: [],
    ...overrides
  };
}

describe("vaultFamily", () => {
  it("maps live enum names before numeric fallbacks", () => {
    expect(vaultFamily("Activities", 1)).toBe("mythic-plus");
    expect(vaultFamily("Raid", 3)).toBe("raid");
    expect(vaultFamily("World", 6)).toBe("world");
    expect(vaultFamily("AlsoWorld", 99)).toBe("world");
  });

  it("does not treat AlsoReceive (4) as World", () => {
    expect(vaultFamily("AlsoReceive", 4)).toBeNull();
    expect(vaultFamily(null, 4)).toBeNull();
  });

  it("maps type 6 to World when the name is missing", () => {
    expect(vaultFamily(null, 6)).toBe("world");
  });

  it("ignores RankedPvP and Concession", () => {
    expect(vaultFamily("RankedPvP", 2)).toBeNull();
    expect(vaultFamily("Concession", 5)).toBeNull();
  });
});

describe("resolveVaultCategory", () => {
  it("ignores AlsoReceive rows when counting World slots", () => {
    const world = resolveVaultCategory(
      snapshot({
        vaultActivities: [
          {
            type: 4,
            typeName: "AlsoReceive",
            index: 1,
            threshold: 1,
            progress: 1,
            level: null
          },
          {
            type: 6,
            typeName: "World",
            index: 1,
            threshold: 2,
            progress: 4,
            level: null
          },
          {
            type: 6,
            typeName: "World",
            index: 2,
            threshold: 4,
            progress: 4,
            level: null
          },
          {
            type: 6,
            typeName: "World",
            index: 3,
            threshold: 8,
            progress: 4,
            level: null
          }
        ]
      }),
      "world"
    );

    expect(world.known).toBe(true);
    expect(world.unlocked).toBe(2);
    expect(world.slots).toBe(3);
    expect(world.progress).toBe(4);
    expect(world.finalThreshold).toBe(8);
  });

  it("uses activities when currentPeriod is null, not only when true", () => {
    const mythicPlus = resolveVaultCategory(
      snapshot({
        vaultCurrentPeriod: null,
        vaultActivities: [
          {
            type: 1,
            typeName: "Activities",
            index: 1,
            threshold: 1,
            progress: 1,
            level: null
          },
          {
            type: 1,
            typeName: "Activities",
            index: 2,
            threshold: 4,
            progress: 1,
            level: null
          },
          {
            type: 1,
            typeName: "Activities",
            index: 3,
            threshold: 8,
            progress: 1,
            level: null
          }
        ]
      }),
      "mythic-plus"
    );

    expect(mythicPlus.known).toBe(true);
    expect(mythicPlus.unlocked).toBe(1);
    expect(mythicPlus.progress).toBe(1);
  });
});
