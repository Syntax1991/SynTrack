import { useState } from "react";
import type {
  QualityFilterOption
} from "../utils/professionItemQuality.helpers";

/*
 * Same plain, namespaced localStorage pattern already used by
 * apps/web/src/shared/api/raiderSession.ts - no new persistence
 * mechanism introduced for this one preference.
 */
const storageKey =
  "syntrack.professions.findCraftQualityFilter";

const validValues: QualityFilterOption[] = [
  "ALL",
  "EPIC",
  "RARE"
];

function readStoredQualityFilter(): QualityFilterOption {
  try {
    const stored =
      localStorage.getItem(
        storageKey
      );

    if (
      stored &&
      (
        validValues as string[]
      ).includes(stored)
    ) {
      return stored as QualityFilterOption;
    }
  }
  catch {
    // localStorage unavailable (private mode, etc.) - fall through to default.
  }

  return "ALL";
}

function writeStoredQualityFilter(
  value: QualityFilterOption
): void {
  try {
    localStorage.setItem(
      storageKey,
      value
    );
  }
  catch {
    // Not persistable in this environment - the in-memory value still works.
  }
}

/*
 * Default is always "ALL" - Rare recipes are never silently hidden for
 * a user who hasn't chosen a filter. Once a user picks Epic or Rare, it
 * persists across Browse/Search/By Character and across visits.
 */
export function useFindCraftQualityFilter(): [
  QualityFilterOption,
  (value: QualityFilterOption) => void
] {
  const [
    qualityFilter,
    setQualityFilterState
  ] =
    useState<QualityFilterOption>(
      readStoredQualityFilter
    );

  function setQualityFilter(
    value: QualityFilterOption
  ) {
    setQualityFilterState(value);
    writeStoredQualityFilter(value);
  }

  return [
    qualityFilter,
    setQualityFilter
  ];
}
