import { describe, expect, it } from "vitest";
import {
  deriveWeeklyGameplayDetail,
  formatVaultRewardLabel,
  slotsFromCategory
} from "./weekly-gameplay.detail.js";
import { deriveWeeklyGameplay } from "./weekly-gameplay.deriver.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";
import { resolveVaultCategory } from "./weekly-gameplay.vault.js";

function snapshot(
  overrides: Partial<WeeklyGameplaySnapshotInput> = {}
): WeeklyGameplaySnapshotInput {
  return {
    characterId: "char-1",
    vaultCaptured: true,
    vaultCurrentPeriod: false,
    vaultGenerated: false,
    vaultCanClaim: false,
    vaultHasAvailable: false,
    mythicPlusCaptured: true,
    raidCaptured: true,
    vaultActivities: [
      {
        type: 1,
        typeName: "Activities",
        index: 1,
        threshold: 1,
        progress: 8,
        level: 15
      },
      {
        type: 1,
        typeName: "Activities",
        index: 2,
        threshold: 4,
        progress: 8,
        level: 14
      },
      {
        type: 1,
        typeName: "Activities",
        index: 3,
        threshold: 8,
        progress: 8,
        level: 13
      },
      {
        type: 3,
        typeName: "Raid",
        index: 1,
        threshold: 2,
        progress: 6,
        level: 15
      },
      {
        type: 3,
        typeName: "Raid",
        index: 2,
        threshold: 4,
        progress: 6,
        level: 15
      },
      {
        type: 3,
        typeName: "Raid",
        index: 3,
        threshold: 6,
        progress: 6,
        level: 15
      },
      {
        type: 6,
        typeName: "World",
        index: 1,
        threshold: 2,
        progress: 0,
        level: 0
      },
      {
        type: 6,
        typeName: "World",
        index: 2,
        threshold: 4,
        progress: 0,
        level: 0
      },
      {
        type: 6,
        typeName: "World",
        index: 3,
        threshold: 8,
        progress: 0,
        level: 0
      }
    ],
    mythicPlusRuns: [
      {
        keyLevel: 15,
        completed: true,
        thisWeek: true,
        mapChallengeModeId: 503,
        durationSec: 1800
      },
      {
        keyLevel: 12,
        completed: true,
        thisWeek: true,
        mapChallengeModeId: 505,
        durationSec: 2100
      }
    ],
    raidLockouts: [],
    ...overrides
  };
}

describe("weekly-gameplay.detail", () => {
  it("exposes three M+/Raid/World slots with reward labels and next world action", () => {
    const detail = deriveWeeklyGameplayDetail(snapshot());
    const weeklies = deriveWeeklyGameplay(snapshot());

    expect(detail.gameplay.vault.completeCount).toBe(
      weeklies.vault.completeCount
    );
    expect(detail.gameplay.vault.applicableTotal).toBe(9);
    expect(detail.gameplay.mythicPlus.completeCount).toBe(8);
    expect(detail.gameplay.raid.completeCount).toBe(6);
    expect(detail.gameplay.delves.completeCount).toBe(0);

    expect(detail.mythicPlusSlots.map((slot) => slot.rewardLabel)).toEqual([
      "+15",
      "+14",
      "+13"
    ]);
    expect(detail.mythicPlusSlots.every((slot) => slot.state === "UNLOCKED")).toBe(
      true
    );
    expect(detail.raidSlots[0]?.rewardLabel).toBe("Heroic");
    expect(detail.worldSlots[0]?.state).toBe("LOCKED");
    expect(detail.worldSlots[0]?.progress).toBe(0);
    expect(detail.worldSlots[0]?.threshold).toBe(2);
    expect(detail.action).toContain("Vault slot 1");
    expect(detail.highestKeyLevel).toBe(15);
    expect(detail.mythicPlusRunCount).toBe(2);
  });

  it("keeps unknown slots unknown when vault is not current", () => {
    const detail = deriveWeeklyGameplayDetail(
      snapshot({
        vaultCanClaim: true,
        vaultCurrentPeriod: false,
        vaultHasAvailable: true
      })
    );

    expect(detail.mythicPlusSlots.every((slot) => slot.state === "UNKNOWN")).toBe(
      true
    );
    expect(detail.raidSlots.every((slot) => slot.state === "UNKNOWN")).toBe(true);
    expect(detail.worldSlots.every((slot) => slot.state === "UNKNOWN")).toBe(
      true
    );
  });

  it("formats reward labels without >= or overflow semantics", () => {
    expect(formatVaultRewardLabel("mythic-plus", 15)).toBe("+15");
    expect(formatVaultRewardLabel("raid", 14)).toBe("Normal");
    expect(formatVaultRewardLabel("world", 0)).toBeNull();

    const category = resolveVaultCategory(snapshot(), "mythic-plus");
    const slots = slotsFromCategory("mythic-plus", category);
    expect(slots).toHaveLength(3);
    expect(JSON.stringify(slots)).not.toMatch(/>=|≥|16\/8|8\/6/);
  });
});
