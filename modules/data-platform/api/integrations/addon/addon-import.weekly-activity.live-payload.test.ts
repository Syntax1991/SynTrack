import { describe, expect, it } from "vitest";
import { LuaSavedVariablesParser } from "./lua-saved-variables.parser.js";
import { normalizeWeeklyActivitySnapshot } from "./addon-import.weekly-activity.normalizer.js";
import { deriveWeeklyGameplay } from "../../../../my-syntrack/api/weekly-gameplay/weekly-gameplay.deriver.js";
import { formatVaultSlotSymbol } from "../../../../my-syntrack/api/weekly-progress/weekly-progress-display.js";
import type { AddonWeeklyActivitySnapshot } from "./addon-import.weekly-activity.types.js";
import type { WeeklyGameplaySnapshotInput } from "../../../../my-syntrack/api/weekly-gameplay/weekly-gameplay.types.js";
import type { LuaTable } from "./addon-import.types.js";

/*
 * Structural copy of Synblast's live SynTrackCoreDB weekly-activity
 * module after /reload: currentPeriod false, generated false, per-slot
 * Dungeon progress 2/7/11, Raid 9, World 0.
 */
const synblastLiveLua = `
SynTrackCoreDB = {
  ["schemaVersion"] = 1,
  ["characters"] = {
    ["eu:antonidas:synblast"] = {
      ["modules"] = {
        ["weekly-activity"] = {
          ["version"] = "0.1.1",
          ["schemaVersion"] = 1,
          ["data"] = {
            ["vault"] = {
              ["captured"] = true,
              ["generated"] = false,
              ["currentPeriod"] = false,
              ["canClaim"] = false,
              ["hasAvailable"] = false,
              ["activities"] = {
                { ["type"] = 6, ["typeName"] = "World", ["index"] = 1, ["threshold"] = 2, ["progress"] = 0, ["level"] = 0, ["id"] = 207 },
                { ["type"] = 6, ["typeName"] = "World", ["index"] = 2, ["threshold"] = 4, ["progress"] = 0, ["level"] = 0, ["id"] = 208 },
                { ["type"] = 6, ["typeName"] = "World", ["index"] = 3, ["threshold"] = 8, ["progress"] = 0, ["level"] = 0, ["id"] = 209 },
                { ["type"] = 3, ["typeName"] = "Raid", ["index"] = 1, ["threshold"] = 2, ["progress"] = 9, ["level"] = 15, ["id"] = 210 },
                { ["type"] = 3, ["typeName"] = "Raid", ["index"] = 2, ["threshold"] = 4, ["progress"] = 9, ["level"] = 15, ["id"] = 211 },
                { ["type"] = 3, ["typeName"] = "Raid", ["index"] = 3, ["threshold"] = 6, ["progress"] = 9, ["level"] = 15, ["id"] = 212 },
                { ["type"] = 1, ["typeName"] = "Activities", ["index"] = 1, ["threshold"] = 1, ["progress"] = 2, ["level"] = 15, ["id"] = 213 },
                { ["type"] = 1, ["typeName"] = "Activities", ["index"] = 2, ["threshold"] = 4, ["progress"] = 7, ["level"] = 14, ["id"] = 214 },
                { ["type"] = 1, ["typeName"] = "Activities", ["index"] = 3, ["threshold"] = 8, ["progress"] = 11, ["level"] = 13, ["id"] = 215 }
              }
            },
            ["mythicPlus"] = { ["captured"] = true, ["runs"] = {} },
            ["raids"] = { ["captured"] = true, ["raids"] = {} }
          }
        }
      }
    }
  }
}
`;

function snapshotFromAddon(
  addon: AddonWeeklyActivitySnapshot
): WeeklyGameplaySnapshotInput {
  return {
    characterId: "char-synblast",
    vaultCaptured: addon.vaultCaptured,
    vaultCurrentPeriod: addon.vaultCurrentPeriod,
    vaultGenerated: addon.vaultGenerated,
    vaultCanClaim: addon.vaultCanClaim,
    vaultHasAvailable: addon.vaultHasAvailable,
    mythicPlusCaptured: addon.mythicPlusCaptured,
    raidCaptured: addon.raidCaptured,
    vaultActivities: addon.vaultActivities.map((activity) => ({
      type: activity.type,
      typeName: activity.typeName,
      index: activity.index,
      threshold: activity.threshold,
      progress: activity.progress,
      level: activity.level
    })),
    mythicPlusRuns: addon.mythicPlusRuns.map((run) => ({
      keyLevel: run.keyLevel,
      completed: run.completed,
      thisWeek: run.thisWeek
    })),
    raidLockouts: addon.raids.map((raid) => ({
      instanceName: raid.name,
      encounterProgress: raid.encounterProgress,
      numEncounters: raid.numEncounters,
      encountersJson: JSON.stringify(raid.encounters)
    }))
  };
}

describe("weekly activity live SavedVariables pipeline", () => {
  it("parses, normalizes, and derives Synblast Vault 6/9 from the live payload shape", () => {
    const table = new LuaSavedVariablesParser(synblastLiveLua).parse();
    const characters = table.characters as LuaTable;
    const character = characters["eu:antonidas:synblast"] as LuaTable;
    const modules = character.modules as LuaTable;
    const addon = normalizeWeeklyActivitySnapshot(modules["weekly-activity"]);

    expect(addon).not.toBeNull();
    expect(addon?.vaultCurrentPeriod).toBe(false);
    expect(addon?.vaultCanClaim).toBe(false);
    expect(addon?.vaultActivities).toHaveLength(9);

    const view = deriveWeeklyGameplay(snapshotFromAddon(addon!));

    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: view.vault.knownUnlockedSlots,
        maxSlots: view.vault.maxSlots
      })
    ).toBe("6/9");
    expect(view.mythicPlus.completeCount).toBe(8);
    expect(view.raid.completeCount).toBe(6);
    expect(view.delves.completeCount).toBe(0);
    expect(view.delves.state).toBe("ATTENTION");
  });

  it("keeps UNKNOWN when the weekly-activity module is absent", () => {
    const addon = normalizeWeeklyActivitySnapshot(undefined);
    expect(addon).toBeNull();
  });
});
