import type { CharacterTrackingProfile } from "../../../api/character-tracking/character-tracking-profile.js";
import type { WeekliesGameplaySignals } from "../../../api/weekly-checklist/weeklies-gameplay-signals.types.js";
import type { WeekliesProfessionWeeklySummary } from "../../../api/weekly-checklist/weeklies-profession-summary.mapper.js";
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
  professionWeeklySummary: WeekliesProfessionWeeklySummary;
  weeklyGameplay: WeeklyGameplayCharacterView | null;
  gameplaySignals: WeekliesGameplaySignals;
};

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
