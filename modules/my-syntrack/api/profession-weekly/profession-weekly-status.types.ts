import type { ProfessionWeeklySourceType } from "./profession-weekly-definition.types.js";

export type ProfessionWeeklySourceStatus = {
  sourceKey: string;
  name: string;
  sourceType: ProfessionWeeklySourceType;
  state: "COMPLETE" | "INCOMPLETE" | "UNKNOWN";
  currentValue: number | null;
  maxValue: number | null;
  capturedAt: string | null;
};

/*
 * completeCount/incompleteCount/unknownCount always sum to
 * applicableTotal - callers must never collapse unknownCount into
 * incompleteCount (see the Automatic Profession Weekly audit's
 * UNKNOWN > WRONG rule). applicableTotal excludes any source whose
 * definition is disabled/unverified - those never enter this count at
 * all, they are simply absent (see AddonProfessionWeeklyPersistence).
 */
export type ProfessionWeeklyAggregate = {
  completeCount: number;
  incompleteCount: number;
  unknownCount: number;
  applicableTotal: number;
};

export type ProfessionWeeklyProfessionSummary = {
  professionKey: string;
  name: string;
  profKp: ProfessionWeeklyAggregate;
  sources: ProfessionWeeklySourceStatus[];
  drops: ProfessionWeeklySourceStatus | null;
};

export type CharacterProfessionWeeklyStatus = {
  id: string;
  name: string;
  profKp: ProfessionWeeklyAggregate;
  drops: ProfessionWeeklyAggregate;
  professions: ProfessionWeeklyProfessionSummary[];
};
