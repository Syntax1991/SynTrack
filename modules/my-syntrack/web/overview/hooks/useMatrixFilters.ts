import { useMemo, useState } from "react";
import type { CharacterWeeklyState } from "../types/overview.types";

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
  state: CharacterWeeklyState,
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
  characters: CharacterWeeklyState[]
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

  const [sortBy, setSortBy] =
    useState<MatrixSortBy>("default");

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
      sortBy
    ]
  );

  return {
    readinessFilter,
    setReadinessFilter,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    visibleCharacters
  };
}
