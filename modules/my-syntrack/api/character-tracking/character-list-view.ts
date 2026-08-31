import type { CharacterTrackingProfile } from "./character-tracking-profile.js";
import { isWeeklyGameplayEnabled } from "./domain-applicability.js";

export type CharacterListView = "all" | "gameplay" | "professions";

export type ProfessionTrackingSignals = {
  setupState?: string | null;
  professionItemCount?: number;
  weeklyProfessionCount?: number;
  weeklyQuestApplicable?: number;
  weeklyTreatiseApplicable?: number;
  weeklyDropsApplicable?: number;
};

export type CharacterListViewFlags = {
  hasGameplayTracking: boolean;
  hasProfessionTracking: boolean;
};

export function characterHasGameplayTracking(
  trackingProfile: CharacterTrackingProfile
): boolean {
  return isWeeklyGameplayEnabled(trackingProfile);
}

export function characterHasProfessionTracking(
  signals: ProfessionTrackingSignals
): boolean {
  if (signals.setupState && signals.setupState !== "NOT_TRACKED") {
    return true;
  }

  if ((signals.professionItemCount ?? 0) > 0) {
    return true;
  }

  if ((signals.weeklyProfessionCount ?? 0) > 0) {
    return true;
  }

  return (
    (signals.weeklyQuestApplicable ?? 0) > 0 ||
    (signals.weeklyTreatiseApplicable ?? 0) > 0 ||
    (signals.weeklyDropsApplicable ?? 0) > 0
  );
}

export function resolveCharacterListViewFlags(input: {
  trackingProfile: CharacterTrackingProfile;
  professions: ProfessionTrackingSignals;
}): CharacterListViewFlags {
  return {
    hasGameplayTracking: characterHasGameplayTracking(
      input.trackingProfile
    ),
    hasProfessionTracking: characterHasProfessionTracking(
      input.professions
    )
  };
}

export function matchesCharacterListView(
  view: CharacterListView,
  flags: CharacterListViewFlags
): boolean {
  if (view === "all") {
    return true;
  }

  if (view === "gameplay") {
    return flags.hasGameplayTracking;
  }

  return flags.hasProfessionTracking;
}

export function characterListViewEmptyMessage(
  view: CharacterListView,
  hasOtherFilters: boolean
): string {
  if (hasOtherFilters) {
    return "No characters match the current filters.";
  }

  if (view === "gameplay") {
    return "No gameplay-tracked characters.";
  }

  if (view === "professions") {
    return "No profession-tracked characters.";
  }

  return "No characters match this filter.";
}

export function formatCharacterListViewCount(
  view: CharacterListView,
  visibleCount: number,
  totalCount: number,
  gameplayCount: number,
  professionCount: number
): string {
  if (view === "all") {
    return `${totalCount} total · ${gameplayCount} gameplay · ${professionCount} professions`;
  }

  if (view === "gameplay") {
    return `${visibleCount} gameplay · ${totalCount} total`;
  }

  return `${visibleCount} professions · ${totalCount} total`;
}

export const CHARACTER_LIST_VIEW_OPTIONS: {
  value: CharacterListView;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "gameplay", label: "Gameplay" },
  { value: "professions", label: "Professions" }
];
