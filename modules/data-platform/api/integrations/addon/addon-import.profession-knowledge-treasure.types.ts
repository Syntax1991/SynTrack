/*
 * One captured permanent-treasure quest flag for one profession. The
 * addon reports raw evidence (flaggedCompleted), never a pre-computed
 * COMPLETE/INCOMPLETE label - see
 * addon-import.profession-knowledge-treasure.persistence.ts. Fully
 * separate from AddonProfessionWeeklySource: these never reset weekly.
 */
export type AddonProfessionKnowledgeTreasureSource = {
  sourceKey: string;
  externalQuestId: number | null;
  flaggedCompleted: boolean | null;
};

export type AddonProfessionKnowledgeTreasureEntry = {
  professionName: string;
  professionKey: string | null;
  sources: AddonProfessionKnowledgeTreasureSource[];
};

/*
 * Returns null (not an empty entry) for an absent/unsupported-schema
 * knowledgeTreasures table - a character who never ran this capture
 * must never be confused with one who ran it and found zero sources.
 */
export type AddonProfessionKnowledgeTreasureSnapshot = {
  schemaVersion: number;
  capturedAt: string | null;
  professions: AddonProfessionKnowledgeTreasureEntry[];
};
