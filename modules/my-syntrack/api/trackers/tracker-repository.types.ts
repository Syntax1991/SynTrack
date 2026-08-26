import type { TrackerValueColumns } from "./tracker-value-invariants.js";
import type {
  TrackerDefinitionCreateInput,
  TrackerDefinitionMetadataUpdate
} from "./tracker.types.js";

/*
 * Plain-data contracts the services depend on, rather than the concrete
 * Prisma-backed repository classes - this is what lets tests inject a
 * lightweight in-memory fake (tracker.fakes.ts) without needing to
 * fabricate Prisma's own branded PrismaPromise return types.
 */
export type TrackerDefinitionRow = {
  id: string;
  scopeKey: string;
  key: string;
  name: string;
  valueType: string;
  resetBehavior: string;
  category: string | null;
  sortOrder: number;
  isPinned: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface TrackerDefinitionRepositoryContract {
  findByScope(
    scopeKey: string
  ): Promise<TrackerDefinitionRow[]>;
  findById(
    id: string
  ): Promise<TrackerDefinitionRow | null>;
  findByIdentity(
    scopeKey: string,
    key: string
  ): Promise<TrackerDefinitionRow | null>;
  create(
    input: TrackerDefinitionCreateInput
  ): Promise<TrackerDefinitionRow>;
  updateMetadata(
    id: string,
    update: TrackerDefinitionMetadataUpdate
  ): Promise<TrackerDefinitionRow>;
}

export type TrackerValueRow = {
  trackerDefinitionId: string;
  characterId: string;
  periodKey: string;
  booleanValue: boolean | null;
  progressCurrent: number | null;
  progressTotal: number | null;
  numberValue: number | null;
  textValue: string | null;
  source: string;
};

export interface TrackerValueRepositoryContract {
  findOne(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ): Promise<TrackerValueRow | null>;
  upsert(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string,
    columns: TrackerValueColumns,
    source: string
  ): Promise<TrackerValueRow>;
  delete(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ): Promise<unknown>;
  findByDefinitionGroups(
    definitionIdsByPeriodKey: Map<
      string,
      string[]
    >,
    characterIds: string[]
  ): Promise<TrackerValueRow[]>;
}
