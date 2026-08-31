import type { ProfessionWeeklyOverviewState } from "../../overview/types/professionWeekly.types";
import type { CharacterTrackingProfile } from "../../../api/character-tracking/character-tracking-profile.js";
import type { WeeklyGameplayCharacterView } from "../../../api/weekly-gameplay/weekly-gameplay.types.js";

export type WeeklyChecklistPeriod = {
  key: string;
  startsAt: string;
  endsAt: string;
};

export type WeeklyChecklistTask = {
  key: string;
  title: string;
  description: string;
  category: string;
  sortOrder: number;
};

export type WeeklyChecklistCharacter = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  trackingProfile: CharacterTrackingProfile;
  completedTaskKeys: string[];
  professionWeekly: ProfessionWeeklyOverviewState;
  weeklyGameplay: WeeklyGameplayCharacterView | null;
};

export type {
  ProfessionWeeklyAggregate,
  ProfessionWeeklyOverviewState
} from "../../overview/types/professionWeekly.types";

export type WeeklyChecklistResponse = {
  period: WeeklyChecklistPeriod;
  tasks: WeeklyChecklistTask[];
  characters: WeeklyChecklistCharacter[];
  summary: {
    completedTaskCount: number;
    totalTaskCount: number;
    completedCharacterCount: number;
  };
};
