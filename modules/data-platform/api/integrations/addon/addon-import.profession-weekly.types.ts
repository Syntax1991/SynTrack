/*
 * One captured source attempt (a weekly quest flag, a Treatise flag, or
 * the Knowledge Drops aggregate) for one profession. The addon reports
 * raw evidence (flaggedCompleted / current+max), never a pre-computed
 * COMPLETE/INCOMPLETE label - deriving that from raw evidence is the
 * backend's job (see addon-import.profession-weekly.persistence.ts),
 * exactly like Gear/Resources never compute UI status in Lua.
 */
export type AddonProfessionWeeklySource = {
  sourceKey: string;
  externalQuestId: number | null;
  flaggedCompleted: boolean | null;
  currentValue: number | null;
  maxValue: number | null;
};

export type AddonProfessionWeeklyEntry = {
  professionName: string;
  professionKey: string | null;
  sources: AddonProfessionWeeklySource[];
};

/*
 * Returns null (not an empty entry) for an absent/unsupported-schema
 * professionWeekly table - a character who never ran this capture must
 * never be confused with one who ran it and found zero sources.
 */
export type AddonProfessionWeeklySnapshot = {
  schemaVersion: number;
  capturedAt: string | null;
  professions: AddonProfessionWeeklyEntry[];
};
