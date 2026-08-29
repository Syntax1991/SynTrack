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

/*
 * Weekly Quest and Treatise are shown as two separate user-facing
 * values, never merged into one combined "Prof KP" number - a 3/4
 * doesn't tell you whether it's the Quest or the Treatise still
 * missing, which defeats the point of an automatic tracker. See the
 * profession weekly correctness follow-up.
 */
export type ProfessionWeeklyProfessionSummary = {
  professionKey: string;
  name: string;
  quest: ProfessionWeeklySourceStatus | null;
  treatise: ProfessionWeeklySourceStatus | null;
  drops: ProfessionWeeklySourceStatus | null;
};

export type CharacterProfessionWeeklyStatus = {
  id: string;
  name: string;
  quest: ProfessionWeeklyAggregate;
  treatise: ProfessionWeeklyAggregate;
  drops: ProfessionWeeklyAggregate;
  professions: ProfessionWeeklyProfessionSummary[];
};
