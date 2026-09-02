import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import type { WeekliesProfessionWeeklySummary } from "../weekly-checklist/weeklies-profession-summary.mapper.js";
import type { SeasonGoalCatalogEntry } from "./season-goal-catalog.js";

export type SeasonGoalState =
  | "COMPLETE"
  | "INCOMPLETE"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export type SeasonGoalSignal = {
  key: string;
  title: string;
  state: SeasonGoalState;
  label: string;
  detail: string;
  actionLabel: string | null;
};

export type SeasonChecklistCharacter = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  trackingProfile: CharacterTrackingProfile;
  mythicPlus: SeasonGoalSignal;
  professionWeeklySummary: WeekliesProfessionWeeklySummary;
  goalsOpen: number;
  goalsComplete: number;
  goalsUnknown: number;
  action: string | null;
};

export type SeasonWarbandGoalView = {
  key: string;
  title: string;
  state: "CAPTURE_PENDING";
  label: string;
  detail: string;
};

export type SeasonChecklistResponse = {
  season: {
    key: string;
    name: string;
  } | null;
  characters: SeasonChecklistCharacter[];
  warbandGoals: SeasonWarbandGoalView[];
  blockedCharacterGoals: SeasonGoalCatalogEntry[];
  summary: {
    characterCount: number;
    goalsOpen: number;
    goalsComplete: number;
    goalsUnknown: number;
    warbandGoalsPending: number;
  };
};
