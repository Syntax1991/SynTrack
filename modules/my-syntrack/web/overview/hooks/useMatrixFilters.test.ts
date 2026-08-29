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
});
