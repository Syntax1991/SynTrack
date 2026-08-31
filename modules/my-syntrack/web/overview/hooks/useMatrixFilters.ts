import { useMemo, useState } from "react";
import {
  formatCharacterListViewCount,
  matchesCharacterListView,
  resolveCharacterListViewFlags,
  type CharacterListView,
  type CharacterListViewFlags
} from "../../../api/character-tracking/character-list-view.js";
import type {
  CharacterOverviewRow,
  TagView
} from "../types/overview.types";

export type MatrixReadinessFilter =
  | "all"
  | "attention"
  | "ready"
  | "not-tracked";

export type MatrixSortBy =
  | "default"
  | "name"
  | "item-level";

function overviewListViewFlags(
  state: CharacterOverviewRow
): CharacterListViewFlags {
  return resolveCharacterListViewFlags({
    trackingProfile: state.trackingProfile,
    professions: {
      setupState: state.professionSetup.state,
      professionItemCount: state.professions.items.length,
      weeklyProfessionCount: state.professionWeekly.professions.length,
      weeklyQuestApplicable: state.professionWeekly.quest.applicableTotal,
      weeklyTreatiseApplicable:
        state.professionWeekly.treatise.applicableTotal,
      weeklyDropsApplicable: state.professionWeekly.drops.applicableTotal
    }
  });
}

function matchesReadinessFilter(
  state: CharacterOverviewRow,
  filter: MatrixReadinessFilter
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "not-tracked") {
    return state.readinessState === "unknown";
  }

  return state.readinessState === filter;
}

function sortCharacters(
  characters: CharacterOverviewRow[],
  sortBy: MatrixSortBy
) {
  if (sortBy === "default") {
    return characters;
  }

  if (sortBy === "name") {
    return [...characters].sort((left, right) =>
      left.character.name.localeCompare(right.character.name, "en")
    );
  }

  return [...characters].sort((left, right) => {
    const leftLevel = left.gear.itemLevel;
    const rightLevel = right.gear.itemLevel;

    if (leftLevel === null && rightLevel === null) {
      return 0;
    }

    if (leftLevel === null) {
      return 1;
    }

    if (rightLevel === null) {
      return -1;
    }

    return rightLevel - leftLevel;
  });
}

export function useMatrixFilters(characters: CharacterOverviewRow[]) {
  const [listView, setListView] = useState<CharacterListView>("all");
  const [readinessFilter, setReadinessFilter] =
    useState<MatrixReadinessFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState<MatrixSortBy>("default");

  const tagOptions = useMemo(() => {
    const byId = new Map<string, TagView>();

    for (const state of characters) {
      for (const tag of state.tags) {
        byId.set(tag.id, tag);
      }
    }

    return [...byId.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "en")
    );
  }, [characters]);

  const scopeCounts = useMemo(() => {
    let gameplayCount = 0;
    let professionCount = 0;

    for (const state of characters) {
      const flags = overviewListViewFlags(state);

      if (flags.hasGameplayTracking) {
        gameplayCount += 1;
      }

      if (flags.hasProfessionTracking) {
        professionCount += 1;
      }
    }

    return {
      totalCount: characters.length,
      gameplayCount,
      professionCount
    };
  }, [characters]);

  const visibleCharacters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = characters.filter((state) => {
      const flags = overviewListViewFlags(state);

      return (
        matchesCharacterListView(listView, flags) &&
        matchesReadinessFilter(state, readinessFilter) &&
        (tagFilter === "" ||
          state.tags.some((tag) => tag.id === tagFilter)) &&
        (normalizedSearch === "" ||
          state.character.name.toLowerCase().includes(normalizedSearch))
      );
    });

    return sortCharacters(filtered, sortBy);
  }, [
    characters,
    listView,
    readinessFilter,
    searchTerm,
    tagFilter,
    sortBy
  ]);

  const hasOtherFilters =
    readinessFilter !== "all" ||
    searchTerm.trim() !== "" ||
    tagFilter !== "";

  const scopeSummaryText = formatCharacterListViewCount(
    listView,
    visibleCharacters.length,
    scopeCounts.totalCount,
    scopeCounts.gameplayCount,
    scopeCounts.professionCount
  );

  return {
    listView,
    setListView,
    readinessFilter,
    setReadinessFilter,
    searchTerm,
    setSearchTerm,
    tagFilter,
    setTagFilter,
    tagOptions,
    sortBy,
    setSortBy,
    visibleCharacters,
    hasOtherFilters,
    scopeSummaryText,
    scopeCounts
  };
}
