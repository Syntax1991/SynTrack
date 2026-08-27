import { useMemo, useState } from "react";
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

function matchesReadinessFilter(
  state: CharacterOverviewRow,
  filter: MatrixReadinessFilter
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "not-tracked") {
    /*
     * readinessState has no dedicated "not tracked" value - "unknown"
     * (nothing proven ready, nothing flagged) is the closest honest
     * character-level equivalent, so the filter reuses it rather than
     * inventing a new classification.
     */
    return (
      state.readinessState === "unknown"
    );
  }

  return state.readinessState === filter;
}

export function useMatrixFilters(
  characters: CharacterOverviewRow[]
) {
  const [
    readinessFilter,
    setReadinessFilter
  ] =
    useState<MatrixReadinessFilter>(
      "all"
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [tagFilter, setTagFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState<MatrixSortBy>("default");

  const tagOptions = useMemo(() => {
    const byId = new Map<
      string,
      TagView
    >();

    for (const state of characters) {
      for (const tag of state.tags) {
        byId.set(tag.id, tag);
      }
    }

    return [...byId.values()].sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
          "en"
        )
    );
  }, [characters]);

  const visibleCharacters = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      const filtered =
        characters.filter(
          (state) =>
            matchesReadinessFilter(
              state,
              readinessFilter
            ) &&
            (tagFilter === ""
              ? true
              : state.tags.some(
                  (tag) =>
                    tag.id === tagFilter
                )) &&
            (normalizedSearch === ""
              ? true
              : state.character.name
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  ))
        );

      if (sortBy === "default") {
        return filtered;
      }

      if (sortBy === "name") {
        return [...filtered].sort(
          (left, right) =>
            left.character.name.localeCompare(
              right.character.name,
              "en"
            )
        );
      }

      return [...filtered].sort(
        (left, right) => {
          const leftLevel =
            left.gear.itemLevel;
          const rightLevel =
            right.gear.itemLevel;

          if (
            leftLevel === null &&
            rightLevel === null
          ) {
            return 0;
          }

          if (leftLevel === null) {
            return 1;
          }

          if (rightLevel === null) {
            return -1;
          }

          return (
            rightLevel - leftLevel
          );
        }
      );
    },
    [
      characters,
      readinessFilter,
      searchTerm,
      tagFilter,
      sortBy
    ]
  );

  return {
    readinessFilter,
    setReadinessFilter,
    searchTerm,
    setSearchTerm,
    tagFilter,
    setTagFilter,
    tagOptions,
    sortBy,
    setSortBy,
    visibleCharacters
  };
}
