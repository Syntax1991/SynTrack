import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildCharacter } from "../components/characterWeeklyMatrixTestHelpers";
import { useMatrixFilters } from "./useMatrixFilters";

const raidTag = {
  id: "tag-raid",
  name: "Raid",
  color: null,
  sortOrder: 0,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z"
};

const synblast = buildCharacter({
  character: {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80
  },
  tags: [raidTag],
  readinessState: "attention"
});

const synbloom = buildCharacter({
  character: {
    id: "char-2",
    name: "Synbloom",
    realm: "Antonidas",
    region: "eu",
    className: "Druid",
    level: 80
  },
  readinessState: "ready"
});

describe("useMatrixFilters", () => {
  it("filters by readiness and search without leaking another character", () => {
    const { result } = renderHook(() =>
      useMatrixFilters([synblast, synbloom])
    );

    act(() => {
      result.current.setReadinessFilter("attention");
    });

    expect(
      result.current.visibleCharacters.map(
        (entry) => entry.character.id
      )
    ).toEqual(["char-1"]);

    act(() => {
      result.current.setReadinessFilter("all");
      result.current.setSearchTerm("bloom");
    });

    expect(
      result.current.visibleCharacters.map(
        (entry) => entry.character.id
      )
    ).toEqual(["char-2"]);
  });

  it("filters by tag", () => {
    const { result } = renderHook(() =>
      useMatrixFilters([synblast, synbloom])
    );

    act(() => {
      result.current.setTagFilter("tag-raid");
    });

    expect(
      result.current.visibleCharacters.map(
        (entry) => entry.character.id
      )
    ).toEqual(["char-1"]);
  });

  it("composes roster scope with search and preserves sort selection", () => {
    const dual = buildCharacter({
      character: {
        id: "char-1",
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        className: "Shaman",
        level: 80
      },
      trackingProfile: "FULL",
      professionSetup: {
        state: "READY",
        professions: [
          {
            professionId: "alchemy",
            key: "alchemy",
            name: "Alchemy",
            dataStatus: "TRACKED",
            treasures: {
              completeCount: 8,
              incompleteCount: 0,
              unknownCount: 0,
              applicableTotal: 8
            }
          }
        ],
        dataIssues: []
      },
      gear: {
        state: "READY",
        readinessPercent: 100,
        trackedSlots: 16,
        totalRelevantSlots: 16,
        missingEnchantCount: 0,
        emptySocketCount: 0,
        itemLevel: 700
      }
    });

    const professionOnly = buildCharacter({
      character: {
        id: "char-2",
        name: "Synbloom",
        realm: "Antonidas",
        region: "eu",
        className: "Druid",
        level: 80
      },
      trackingProfile: "PROFESSION",
      professionSetup: {
        state: "READY",
        professions: [
          {
            professionId: "herbalism",
            key: "herbalism",
            name: "Herbalism",
            dataStatus: "TRACKED",
            treasures: {
              completeCount: 8,
              incompleteCount: 0,
              unknownCount: 0,
              applicableTotal: 8
            }
          }
        ],
        dataIssues: []
      },
      gear: {
        state: "READY",
        readinessPercent: 100,
        trackedSlots: 16,
        totalRelevantSlots: 16,
        missingEnchantCount: 0,
        emptySocketCount: 0,
        itemLevel: 680
      }
    });

    const { result } = renderHook(() =>
      useMatrixFilters([dual, professionOnly])
    );

    act(() => {
      result.current.setSortBy("item-level");
      result.current.setListView("professions");
      result.current.setSearchTerm("Syn");
    });

    expect(result.current.sortBy).toBe("item-level");
    expect(
      result.current.visibleCharacters.map((entry) => entry.character.id)
    ).toEqual(["char-1", "char-2"]);

    act(() => {
      result.current.setListView("gameplay");
    });

    expect(result.current.sortBy).toBe("item-level");
    expect(result.current.searchTerm).toBe("Syn");
    expect(
      result.current.visibleCharacters.map((entry) => entry.character.id)
    ).toEqual(["char-1"]);
  });
});
