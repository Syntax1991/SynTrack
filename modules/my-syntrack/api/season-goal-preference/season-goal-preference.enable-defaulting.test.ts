import { describe, expect, it } from "vitest";
import { SeasonGoalPreferenceService } from "./season-goal-preference.service.js";
import type { SeasonGoalPreferenceRow } from "./season-goal-preference.types.js";

function fakeRepository(seed: SeasonGoalPreferenceRow[] = []) {
  const rows = [...seed];
  return {
    findAll: async () => rows,
    findOne: async (goalKey: string, characterId: string) =>
      rows.find(
        (row) => row.goalKey === goalKey && row.characterId === characterId
      ) ?? null,
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

/*
 * Regression coverage for the Resi "Enabled checkbox does nothing" bug:
 * the UI always sends whatever numericTarget the effective preference
 * currently holds, which is null for a never-configured Resi goal — the
 * server must fill in a sane default rather than reject enabling outright.
 */
describe("SeasonGoalPreferenceService default-on-enable (Resi enable bug)", () => {
  it("enabling from pure default (no row, null target) defaults to 12", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    const value = await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: true,
      numericTarget: null,
      enumTarget: null
    });

    expect(value).toEqual({ enabled: true, numericTarget: 12, enumTarget: null });
  });

  it("enabling with an existing valid target preserves it, never resets to 12", async () => {
    const service = new SeasonGoalPreferenceService(
      fakeRepository([
        {
          goalKey: "resilient-keystone",
          characterId: "char-1",
          enabled: false,
          numericTarget: 14,
          enumTarget: null
        }
      ]) as any
    );

    const value = await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: true,
      numericTarget: null,
      enumTarget: null
    });

    expect(value).toEqual({ enabled: true, numericTarget: 14, enumTarget: null });
  });

  it("disabling retains the configured target instead of erasing it", async () => {
    const repository = fakeRepository();
    const service = new SeasonGoalPreferenceService(repository as any);

    await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: true,
      numericTarget: 14,
      enumTarget: null
    });
    const disabled = await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: false,
      numericTarget: 14,
      enumTarget: null
    });

    expect(disabled).toEqual({
      enabled: false,
      numericTarget: 14,
      enumTarget: null
    });

    const reEnabled = await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: true,
      numericTarget: null,
      enumTarget: null
    });
    expect(reEnabled.numericTarget).toBe(14);
  });

  it("reset removes the override entirely — no redundant default copy", async () => {
    const repository = fakeRepository();
    const service = new SeasonGoalPreferenceService(repository as any);

    await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: true,
      numericTarget: 14,
      enumTarget: null
    });
    await service.resetPreference("resilient-keystone", "char-1");

    expect(await repository.findAll()).toEqual([]);
    const byCharacter = await service.getEffectivePreferencesByCharacter([
      "char-1"
    ]);
    expect(byCharacter.get("char-1")?.get("resilient-keystone")).toEqual({
      enabled: false,
      numericTarget: null,
      enumTarget: null
    });
  });

  it("an explicit invalid target is still rejected, never silently coerced to 12", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    await expect(
      service.savePreference({
        goalKey: "resilient-keystone",
        characterId: "char-1",
        enabled: true,
        numericTarget: 11,
        enumTarget: null
      })
    ).rejects.toThrow(/>= 12/);
  });

  it("a custom target survives a reload (persisted, not defaulted away)", async () => {
    const repository = fakeRepository();
    const service = new SeasonGoalPreferenceService(repository as any);

    await service.savePreference({
      goalKey: "resilient-keystone",
      characterId: "char-1",
      enabled: true,
      numericTarget: 17,
      enumTarget: null
    });

    const byCharacter = await service.getEffectivePreferencesByCharacter([
      "char-1"
    ]);
    expect(byCharacter.get("char-1")?.get("resilient-keystone")).toEqual({
      enabled: true,
      numericTarget: 17,
      enumTarget: null
    });
  });

  it("does not apply default-on-enable to Score (always has an explicit target already)", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    // Score's UI always sends its current effective target; simulate the
    // one edge case where a caller omits it to prove Score still gets its
    // OWN first preset (2000), not Resi's 12 — the rule is goal-generic.
    const value = await service.savePreference({
      goalKey: "mythic-plus-score",
      characterId: "char-1",
      enabled: true,
      numericTarget: null,
      enumTarget: null
    });

    expect(value.numericTarget).toBe(2000);
  });

  it("does not add a numeric target to boolean goals", async () => {
    const service = new SeasonGoalPreferenceService(fakeRepository() as any);

    const value = await service.savePreference({
      goalKey: "nemesis",
      characterId: "char-1",
      enabled: true,
      numericTarget: null,
      enumTarget: null
    });

    expect(value.numericTarget).toBeNull();
  });
});
