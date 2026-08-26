import type {
  TrackerDefinitionRepositoryContract,
  TrackerDefinitionRow,
  TrackerValueRepositoryContract,
  TrackerValueRow
} from "./tracker-repository.types.js";
import type { TrackerValueColumns } from "./tracker-value-invariants.js";
import type {
  TrackerDefinitionCreateInput,
  TrackerDefinitionMetadataUpdate
} from "./tracker.types.js";

/*
 * In-memory stand-ins for the Prisma-backed repositories, matching the
 * same plain-data contracts (tracker-repository.types.ts) the real
 * repositories implement. This codebase has no established pattern for
 * hitting a real test database, so service-level logic (identity
 * checks, invariant enforcement, period resolution) is proven against
 * these fakes instead - the same approach already used for every other
 * tested mapper/service in this repo, one layer up.
 */
export class FakeTrackerDefinitionRepository
  implements
    TrackerDefinitionRepositoryContract
{
  private readonly rows = new Map<
    string,
    TrackerDefinitionRow
  >();

  private nextId = 1;

  async findByScope(scopeKey: string) {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.scopeKey === scopeKey
      )
      .sort(
        (left, right) =>
          left.sortOrder -
            right.sortOrder ||
          left.name.localeCompare(
            right.name
          )
      );
  }

  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }

  async findByIdentity(
    scopeKey: string,
    key: string
  ) {
    return (
      [...this.rows.values()].find(
        (row) =>
          row.scopeKey === scopeKey &&
          row.key === key
      ) ?? null
    );
  }

  async create(
    input: TrackerDefinitionCreateInput
  ) {
    const id = `def-${this.nextId++}`;
    const now = new Date();

    const row: TrackerDefinitionRow = {
      id,
      scopeKey: input.scopeKey,
      key: input.key,
      name: input.name,
      valueType: input.valueType,
      resetBehavior:
        input.resetBehavior,
      category:
        input.category ?? null,
      sortOrder: input.sortOrder ?? 0,
      isPinned:
        input.isPinned ?? true,
      enabled: true,
      createdAt: now,
      updatedAt: now
    };

    this.rows.set(id, row);

    return row;
  }

  async updateMetadata(
    id: string,
    update: TrackerDefinitionMetadataUpdate
  ) {
    const existing = this.rows.get(id);

    if (!existing) {
      throw new Error(
        "definition not found"
      );
    }

    const updated: TrackerDefinitionRow =
      {
        ...existing,
        name:
          update.name ??
          existing.name,
        category:
          update.category !==
          undefined
            ? update.category
            : existing.category,
        sortOrder:
          update.sortOrder ??
          existing.sortOrder,
        isPinned:
          update.isPinned ??
          existing.isPinned,
        enabled:
          update.enabled ??
          existing.enabled,
        updatedAt: new Date()
      };

    this.rows.set(id, updated);

    return updated;
  }
}

export class FakeTrackerValueRepository
  implements
    TrackerValueRepositoryContract
{
  private readonly rows = new Map<
    string,
    TrackerValueRow
  >();

  private key(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ) {
    return `${trackerDefinitionId}:${characterId}:${periodKey}`;
  }

  async findOne(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ) {
    return (
      this.rows.get(
        this.key(
          trackerDefinitionId,
          characterId,
          periodKey
        )
      ) ?? null
    );
  }

  async upsert(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string,
    columns: TrackerValueColumns,
    source: string
  ) {
    const row: TrackerValueRow = {
      trackerDefinitionId,
      characterId,
      periodKey,
      ...columns,
      source
    };

    this.rows.set(
      this.key(
        trackerDefinitionId,
        characterId,
        periodKey
      ),
      row
    );

    return row;
  }

  async delete(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ) {
    this.rows.delete(
      this.key(
        trackerDefinitionId,
        characterId,
        periodKey
      )
    );
  }

  async findByDefinitionGroups(
    definitionIdsByPeriodKey: Map<
      string,
      string[]
    >,
    characterIds: string[]
  ) {
    const results: TrackerValueRow[] =
      [];

    for (const [
      periodKey,
      definitionIds
    ] of definitionIdsByPeriodKey) {
      for (const row of this.rows.values()) {
        if (
          row.periodKey === periodKey &&
          definitionIds.includes(
            row.trackerDefinitionId
          ) &&
          characterIds.includes(
            row.characterId
          )
        ) {
          results.push(row);
        }
      }
    }

    return results;
  }

  /* Test-only direct seed, bypassing the write service's invariants -
   * used to simulate a prior period's row already existing. */
  seed(row: TrackerValueRow) {
    this.rows.set(
      this.key(
        row.trackerDefinitionId,
        row.characterId,
        row.periodKey
      ),
      row
    );
  }
}
