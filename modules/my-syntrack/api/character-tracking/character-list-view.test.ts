import { describe, expect, it } from "vitest";
import {
  characterListViewEmptyMessage,
  formatCharacterListViewCount,
  matchesCharacterListView,
  resolveCharacterListViewFlags
} from "./character-list-view.js";

describe("character list view membership", () => {
  it("dual-purpose character appears in ALL, GAMEPLAY, and PROFESSIONS", () => {
    const flags = resolveCharacterListViewFlags({
      trackingProfile: "FULL",
      professions: { setupState: "READY", professionItemCount: 1 }
    });

    expect(flags).toEqual({
      hasGameplayTracking: true,
      hasProfessionTracking: true
    });
    expect(matchesCharacterListView("all", flags)).toBe(true);
    expect(matchesCharacterListView("gameplay", flags)).toBe(true);
    expect(matchesCharacterListView("professions", flags)).toBe(true);
  });

  it("profession-only character is excluded from GAMEPLAY", () => {
    const flags = resolveCharacterListViewFlags({
      trackingProfile: "PROFESSION",
      professions: {
        setupState: "ATTENTION",
        weeklyQuestApplicable: 1
      }
    });

    expect(flags.hasGameplayTracking).toBe(false);
    expect(flags.hasProfessionTracking).toBe(true);
    expect(matchesCharacterListView("gameplay", flags)).toBe(false);
    expect(matchesCharacterListView("professions", flags)).toBe(true);
  });

  it("gameplay-only character is excluded from PROFESSIONS", () => {
    const flags = resolveCharacterListViewFlags({
      trackingProfile: "WEEKLY",
      professions: { setupState: "NOT_TRACKED" }
    });

    expect(flags.hasGameplayTracking).toBe(true);
    expect(flags.hasProfessionTracking).toBe(false);
    expect(matchesCharacterListView("gameplay", flags)).toBe(true);
    expect(matchesCharacterListView("professions", flags)).toBe(false);
  });

  it("does not treat PROFESSION tracking mode alone as profession membership", () => {
    const flags = resolveCharacterListViewFlags({
      trackingProfile: "PROFESSION",
      professions: { setupState: "NOT_TRACKED" }
    });

    expect(flags.hasProfessionTracking).toBe(false);
  });

  it("returns scope-specific empty copy", () => {
    expect(characterListViewEmptyMessage("gameplay", false)).toBe(
      "No gameplay-tracked characters."
    );
    expect(characterListViewEmptyMessage("professions", false)).toBe(
      "No profession-tracked characters."
    );
    expect(characterListViewEmptyMessage("all", true)).toBe(
      "No characters match the current filters."
    );
  });

  it("counts dual-purpose characters in both category totals", () => {
    expect(
      formatCharacterListViewCount("all", 22, 22, 6, 18)
    ).toBe("22 total · 6 gameplay · 18 professions");
    expect(
      formatCharacterListViewCount("gameplay", 6, 22, 6, 18)
    ).toBe("6 gameplay · 22 total");
  });
});
