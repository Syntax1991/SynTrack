import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import type { WeekliesProfessionWeeklySummary } from "../weekly-checklist/weeklies-profession-summary.mapper.js";

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
  twoKRio: SeasonGoalSignal;
  professionWeeklySummary: WeekliesProfessionWeeklySummary;
  goalsOpen: number;
  goalsComplete: number;
  goalsUnknown: number;
  action: string | null;
};

export type SeasonChecklistResponse = {
  season: {
    key: string;
    name: string;
  } | null;
  characters: SeasonChecklistCharacter[];
  summary: {
    characterCount: number;
    goalsOpen: number;
    goalsComplete: number;
    goalsUnknown: number;
  };
};
