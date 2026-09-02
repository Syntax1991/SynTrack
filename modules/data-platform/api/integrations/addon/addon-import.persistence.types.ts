import type {
  Prisma
} from "../../../../../apps/api/src/generated/prisma/client.js";

export type AddonImportTransaction =
  Prisma.TransactionClient;

export type ProfessionIdMap =
  Map<string, string>;

export type AddonNodeIdMap =
  Map<string, string>;

export type CatalogPersistenceResult = {
  catalogs: number;
  trees: number;
  nodes: number;
  nodeIds: AddonNodeIdMap;
};

export type CharacterPersistenceResult = {
  characters: number;
  professionAssignments: number;
  progressEntries: number;
  gearSlots: number;
  resourceSnapshots: number;
  professionWeeklySnapshots: number;
  professionKnowledgeTreasureSnapshots: number;
  weeklyGameplaySnapshots: number;
  weekliesSignalSnapshots: number;
};

export type RecipePersistenceResult = {
  catalogs: number;
  recipes: number;
  learnedRecipes: number;
};