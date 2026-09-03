import { describe, expect, it } from "vitest";
import { SeasonGoalPreferenceService } from "./season-goal-preference.service.js";
import { SEASON_GOAL_PREFERENCE_WARBAND_SCOPE } from "./season-goal-preference.types.js";
import type { SeasonGoalPreferenceRow } from "./season-goal-preference.types.js";

function fakeRepository(seed: SeasonGoalPreferenceRow[] = []) {
  const rows = [...seed];
  return {
    findAll: async () => rows,
    upsert: async (
      goalKey: string,
      characterId: string,
      value: { enabled: boolean; numericTarget: number | null; enumTarget: string | null }
    ) => {
      const existingIndex = rows.findIndex(
        (row) => row.goalKey === goalKey && row.characterId === characterId
      );
      const row: SeasonGoalPreferenceRow = { goalKey, characterId, ...value };
      if (existingIndex >= 0) {
        rows[existingIndex] = row;
      } else {
        rows.push(row);
      }
      return row;
    },
    delete: async (goalKey: string, characterId: string) => {
      const index = rows.findIndex(
        (row) => row.goalKey === goalKey && row.characterId === characterId
      );
      if (index >= 0) {
        rows.splice(index, 1);
      }
    }
  };
}

describe("SeasonGoalPreferenceService defaults", () => {
  it("returns catalog defaults when no preference rows exist", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    const byCharacter = await service.getEffectivePreferencesByCharacter([
      "char-1"
    ]);
    const character = byCharacter.get("char-1")!;

    expect(character.get("mythic-plus-score")).toEqual({
      enabled: true,
      numericTarget: 2000,
      enumTarget: null
    });
    expect(character.get("resilient-keystone")).toEqual({
      enabled: false,
      numericTarget: null,
      enumTarget: null
    });
    expect(character.get("raid")).toEqual({
      enabled: true,
      numericTarget: null,
      enumTarget: "AOTC"
    });
    expect(character.get("tier-four-piece")?.enabled).toBe(true);
    expect(character.get("embellishments")?.enabled).toBe(true);
    expect(character.get("cracked-keystone")?.enabled).toBe(true);
    expect(character.get("nemesis")?.enabled).toBe(true);

    const warband = await service.getEffectiveWarbandPreferences();
    expect(warband.get("portals")?.enabled).toBe(true);
    expect(warband.get("valeera-80")?.enabled).toBe(true);
  });

  it("does not eagerly create rows just from reading defaults", async () => {
    const repository = fakeRepository();
    const service = new SeasonGoalPreferenceService(repository as any);

    await service.getEffectivePreferencesByCharacter(["char-1"]);

    expect(await repository.findAll()).toEqual([]);
  });
});

describe("SeasonGoalPreferenceService overrides", () => {
  it("an override replaces the default for that Character/goal only", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await service.savePreference({
      goalKey: "mythic-plus-score",
      characterId: "char-1",
      enabled: true,
      numericTarget: 3000,
      enumTarget: null
    });

    const byCharacter = await service.getEffectivePreferencesByCharacter([
      "char-1",
      "char-2"
    ]);

    expect(byCharacter.get("char-1")?.get("mythic-plus-score")).toEqual({
      enabled: true,
      numericTarget: 3000,
      enumTarget: null
    });
    // char-2 is untouched — still the catalog default.
    expect(byCharacter.get("char-2")?.get("mythic-plus-score")).toEqual({
      enabled: true,
      numericTarget: 2000,
      enumTarget: null
    });
  });

  it("does not create a second tracker when the target changes, only updates the row", async () => {
    const repository = fakeRepository();
    const service = new SeasonGoalPreferenceService(repository as any);

    await service.savePreference({
      goalKey: "mythic-plus-score",
      characterId: "char-1",
      enabled: true,
      numericTarget: 2000,
      enumTarget: null
    });
    await service.savePreference({
      goalKey: "mythic-plus-score",
      characterId: "char-1",
      enabled: true,
      numericTarget: 3000,
      enumTarget: null
    });

    const rows = await repository.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.numericTarget).toBe(3000);
  });

  it("reset deletes the override and falls back to the catalog default", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await service.savePreference({
      goalKey: "nemesis",
      characterId: "char-1",
      enabled: false,
      numericTarget: null,
      enumTarget: null
    });
    let byCharacter = await service.getEffectivePreferencesByCharacter([
      "char-1"
    ]);
    expect(byCharacter.get("char-1")?.get("nemesis")?.enabled).toBe(false);

    await service.resetPreference("nemesis", "char-1");
    byCharacter = await service.getEffectivePreferencesByCharacter(["char-1"]);
    expect(byCharacter.get("char-1")?.get("nemesis")?.enabled).toBe(true);
  });

  it("stores Warband preferences under the sentinel scope, independent of any Character", async () => {
    const repository = fakeRepository();
    const service = new SeasonGoalPreferenceService(repository as any);

    await service.savePreference({
      goalKey: "portals",
      characterId: null,
      enabled: false,
      numericTarget: null,
      enumTarget: null
    });

    const rows = await repository.findAll();
    expect(rows).toEqual([
      {
        goalKey: "portals",
        characterId: SEASON_GOAL_PREFERENCE_WARBAND_SCOPE,
        enabled: false,
        numericTarget: null,
        enumTarget: null
      }
    ]);

    const warband = await service.getEffectiveWarbandPreferences();
    expect(warband.get("portals")?.enabled).toBe(false);
  });
});

describe("SeasonGoalPreferenceService validation", () => {
  it("rejects an unknown goal key", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await expect(
      service.savePreference({
        goalKey: "not-a-real-goal",
        characterId: "char-1",
        enabled: true,
        numericTarget: null,
        enumTarget: null
      })
    ).rejects.toThrow();
  });

  it("rejects a Character-scoped goal without a characterId", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await expect(
      service.savePreference({
        goalKey: "mythic-plus-score",
        characterId: null,
        enabled: true,
        numericTarget: 2000,
        enumTarget: null
      })
    ).rejects.toThrow();
  });

  it("rejects a Warband-scoped goal with a characterId", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await expect(
      service.savePreference({
        goalKey: "portals",
        characterId: "char-1",
        enabled: true,
        numericTarget: null,
        enumTarget: null
      })
    ).rejects.toThrow();
  });

  it("rejects a Resilient Keystone target below 12 when enabled", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await expect(
      service.savePreference({
        goalKey: "resilient-keystone",
        characterId: "char-1",
        enabled: true,
        numericTarget: 10,
        enumTarget: null
      })
    ).rejects.toThrow();
  });

  it("accepts a disabled Resilient Keystone goal with no target", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    const value = await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: false,
      numericTarget: null,
      enumTarget: null
    });

    expect(value.enabled).toBe(false);
  });

  it("rejects a raid target outside AOTC/CE/OFF", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await expect(
      service.savePreference({
        goalKey: "raid",
        characterId: "char-1",
        enabled: true,
        numericTarget: null,
        enumTarget: "HEROIC"
      })
    ).rejects.toThrow();
  });

  it("accepts raid target OFF", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    const value = await service.savePreference({
      goalKey: "raid",
      characterId: "char-1",
      enabled: true,
      numericTarget: null,
      enumTarget: "OFF"
    });

    expect(value.enumTarget).toBe("OFF");
  });
});
