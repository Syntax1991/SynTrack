export const professionWeeklySourceTypes = [
  "WEEKLY_QUEST",
  "TREATISE",
  "KNOWLEDGE_DROPS"
] as const;

export type ProfessionWeeklySourceType =
  (typeof professionWeeklySourceTypes)[number];

export type ProfessionWeeklySourceDefinitionView = {
  id: string;
  scopeKey: string;
  professionKey: string;
  sourceKey: string;
  name: string;
  sourceType: ProfessionWeeklySourceType;
  externalQuestId: number | null;
  externalCurrencyId: number | null;
  enabled: boolean;
  sortOrder: number;
};

/*
 * The one seed/config shape a season's sources are declared through
 * (see profession-weekly-definition.service.ts's ensureDefinition).
 * `enabled` defaults to false at the repository level - a definition
 * only ever becomes visible to a user after its externalQuestId/
 * externalCurrencyId has been live-verified against a real character
 * (see the Automatic Profession Weekly audit's quest-ID caveats).
 */
export type ProfessionWeeklySourceDefinitionSeedInput = {
  scopeKey: string;
  professionKey: string;
  sourceKey: string;
  name: string;
  sourceType: ProfessionWeeklySourceType;
  externalQuestId?: number | null;
  externalCurrencyId?: number | null;
  enabled?: boolean;
  sortOrder?: number;
};
