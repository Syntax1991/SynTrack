import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CharacterOverviewRow } from "../types/overview.types";
import { useMatrixFilters } from "./useMatrixFilters";

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

function buildCharacter(
  overrides: Partial<CharacterOverviewRow> & {
    character: CharacterOverviewRow["character"];
  }
): CharacterOverviewRow {
  return {
    weekly: {
      state: "IN_PROGRESS",
      completed: 0,
      total: 5,
      source: "MANUAL_CHECKLIST"
    },
    vault: {
      state: "UNKNOWN",
      unlockedSlots: 0,
      slotsTotal: 3,
      highestKeyLevel: null,
      source: "MANUAL_LOG"
    },
    professions: {
      state: "NOT_TRACKED",
      issueCount: 0,
      issues: [],
      items: []
    },
    gear: {
      state: "NOT_TRACKED",
      readinessPercent: null,
      trackedSlots: 0,
      totalRelevantSlots: 16,
      missingEnchantCount: 0,
      emptySocketCount: 0,
      itemLevel: null
    },
    resources: {
      state: "NOT_TRACKED",
      trackedResourceCount: 0,
      totalRelevantResourceCount: 0,
      attentionCount: 0,
      items: []
    },
    tier: { state: "NOT_TRACKED" },
    embellishments: { state: "NOT_TRACKED" },
    professionWeekly: {
      state: "NOT_TRACKED",
      profKp: zeroAggregate,
      drops: zeroAggregate,
      professions: []
    },
    trackers: [],
    attentionItems: [],
    readinessState: "unknown",
    nextAction: null,
    tags: [],
    health: {
      characterId: "char-1",
      character: {
        state: "MANUAL",
        lastSyncedAt: null
      },
      professions: { state: "NOT_TRACKED", items: [] },
      gear: { state: "NOT_TRACKED", lastSyncedAt: null },
      resources: { state: "NOT_TRACKED", lastSyncedAt: null },
      professionWeekly: { state: "NOT_TRACKED", items: [] }
    },
    ...overrides
  };
}

const raidTag = {
  id: "tag-raid",
  name: "Raid",
  color: null,
  sortOrder: 0,
  createdAt:
    "2026-08-01T00:00:00.000Z",
  updatedAt:
    "2026-08-01T00:00:00.000Z"
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
  readinessState: "attention",
  gear: {
    state: "ATTENTION",
    readinessPercent: 40,
    trackedSlots: 3,
    totalRelevantSlots: 16,
    missingEnchantCount: 1,
    emptySocketCount: 0,
    itemLevel: 650
  },
  tags: [raidTag]
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
  readinessState: "ready",
  gear: {
    state: "READY",
    readinessPercent: 100,
    trackedSlots: 5,
    totalRelevantSlots: 16,
    missingEnchantCount: 0,
    emptySocketCount: 0,
    itemLevel: 700
  }
});

const synspin = buildCharacter({
  character: {
    id: "char-3",
    name: "Synspin",
    realm: "Antonidas",
    region: "eu",
    className: "Mage",
    level: 80
  },
  readinessState: "unknown"
});

const allCharacters = [
  synblast,
  synbloom,
  synspin
];

describe("useMatrixFilters", () => {
  it("defaults to showing every character unfiltered", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    expect(
      result.current
        .visibleCharacters
    ).toHaveLength(3);
  });

  it("filters to only attention characters without mixing in ready/unknown characters", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    act(() => {
      result.current.setReadinessFilter(
        "attention"
      );
    });

    expect(
      result.current
        .visibleCharacters
    ).toHaveLength(1);

    expect(
      result.current
        .visibleCharacters[0]
        ?.character.id
    ).toBe("char-1");
  });

  it("filters to only ready characters", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    act(() => {
      result.current.setReadinessFilter(
        "ready"
      );
    });

    expect(
      result.current
        .visibleCharacters
    ).toHaveLength(1);

    expect(
      result.current
        .visibleCharacters[0]
        ?.character.id
    ).toBe("char-2");
  });

  it("filters to only not-tracked (unknown) characters", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    act(() => {
      result.current.setReadinessFilter(
        "not-tracked"
      );
    });

    expect(
      result.current
        .visibleCharacters
    ).toHaveLength(1);

    expect(
      result.current
        .visibleCharacters[0]
        ?.character.id
    ).toBe("char-3");
  });

  it("filters by character name search, case-insensitively", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    act(() => {
      result.current.setSearchTerm(
        "bloom"
      );
    });

    expect(
      result.current
        .visibleCharacters
    ).toHaveLength(1);

    expect(
      result.current
        .visibleCharacters[0]
        ?.character.name
    ).toBe("Synbloom");
  });

  it("sorts by item level descending, pushing untracked (null) item levels last", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    act(() => {
      result.current.setSortBy(
        "item-level"
      );
    });

    expect(
      result.current.visibleCharacters.map(
        (state) => state.character.id
      )
    ).toEqual([
      "char-2",
      "char-1",
      "char-3"
    ]);
  });

  it("derives tag filter options from every character's tags, deduplicated", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    expect(
      result.current.tagOptions.map(
        (tag) => tag.name
      )
    ).toEqual(["Raid"]);
  });

  it("filters to only characters holding the selected tag", () => {
    const { result } = renderHook(
      () =>
        useMatrixFilters(
          allCharacters
        )
    );

    act(() => {
      result.current.setTagFilter(
        "tag-raid"
      );
    });

    expect(
      result.current
        .visibleCharacters
    ).toHaveLength(1);

    expect(
      result.current
        .visibleCharacters[0]
        ?.character.id
    ).toBe("char-1");
  });
});
