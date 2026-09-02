import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";

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
  portals: SeasonGoalSignal;
  catalyst: SeasonGoalSignal;
  cracked: SeasonGoalSignal;
  nemesis: SeasonGoalSignal;
  raid: SeasonGoalSignal;
  goalsOpen: number;
  goalsComplete: number;
  goalsUnknown: number;
  action: string | null;
};

/**
 * Live warband season goals only. Capture-gap catalog entries are never
 * projected into this list — unsupported ≠ incomplete player state.
 */
export type SeasonWarbandGoalView = {
  key: string;
  title: string;
  state: SeasonGoalState;
  label: string;
  detail: string;
  actionLabel: string | null;
};

export type SeasonChecklistResponse = {
  season: {
    key: string;
    name: string;
  } | null;
  characters: SeasonChecklistCharacter[];
  /** Empty until at least one warband goal has trackable evidence. */
  warbandGoals: SeasonWarbandGoalView[];
  summary: {
    characterCount: number;
    goalsOpen: number;
    goalsComplete: number;
    goalsUnknown: number;
  };
};
