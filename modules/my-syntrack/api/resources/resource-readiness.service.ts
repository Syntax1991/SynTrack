import { ResourceDefinitionRepository } from "./resource-definition.repository.js";
import { ResourceDefinitionService } from "./resource-definition.service.js";
import type { ResourceDefinitionView } from "./resource-definition.types.js";
import type { ResourceReadinessRepositoryContract, ResourceSnapshotRow } from "./resource-readiness-repository.types.js";
import {
  deriveAttentionNeeded,
  deriveWeeklyComplete,
  deriveWeeklyRemaining
} from "./resource-status.mapper.js";
import type {
  AccountResourceView,
  CharacterResourceOverview,
  ResourceOverviewResponse,
  ResourceSnapshotView
} from "./resource-readiness.types.js";

export type ResourceDefinitionLookup = {
  listEnabledForActiveSeason(): Promise<
    ResourceDefinitionView[]
  >;
};

function toSnapshotView(
  row: ResourceSnapshotRow
): ResourceSnapshotView {
  const weeklyComplete = deriveWeeklyComplete(
    row.isWeeklyCapped,
    row.weeklyQuantity,
    row.maxWeeklyQuantity
  );

  return {
    quantity: row.quantity,
    maxQuantity: row.maxQuantity,
    weeklyQuantity: row.weeklyQuantity,
    maxWeeklyQuantity: row.maxWeeklyQuantity,
    isCapped: row.isCapped,
    weeklyRemaining: deriveWeeklyRemaining(
      row.weeklyQuantity,
      row.maxWeeklyQuantity
    ),
    weeklyComplete,
    capturedAt: row.capturedAt.toISOString()
  };
}

/*
 * Picks the single value to display for an ACCOUNT_WIDE resource -
 * never sums or duplicates per character. A captured snapshot whose raw
 * accountWide evidence explicitly disagrees (=== false) with the
 * definition's configured ACCOUNT_WIDE scope is excluded from the
 * "trustworthy" pool; only if EVERY snapshot disagrees does this return
 * no value at all (conservative UNKNOWN, never a false per-character
 * read). ownershipMismatch stays true whenever any disagreement was
 * observed, even if a trustworthy value was still found.
 */
function pickAccountWideSnapshot(
  rows: ResourceSnapshotRow[]
): {
  row: ResourceSnapshotRow | null;
  characterId: string | null;
  mismatch: boolean;
} {
  if (rows.length === 0) {
    return { row: null, characterId: null, mismatch: false };
  }

  const trustworthy = rows.filter(
    (row) => row.accountWide !== false
  );

  const mismatch = trustworthy.length < rows.length;

  if (trustworthy.length === 0) {
    return { row: null, characterId: null, mismatch: true };
  }

  const freshest = trustworthy.reduce((latest, row) =>
    row.capturedAt.getTime() > latest.capturedAt.getTime()
      ? row
      : latest
  );

  return {
    row: freshest,
    characterId: freshest.characterId,
    mismatch
  };
}

/*
 * Read model composed from ResourceDefinition (config) +
 * CharacterResourceSnapshot (raw authoritative game state) - it persists
 * nothing. Definitions are scoped to the active season + GLOBAL (see
 * ResourceDefinitionService.listEnabledForActiveSeason). CHARACTER-scoped
 * definitions are surfaced per character; ACCOUNT_WIDE ones are
 * aggregated into a single shared value; a definition left UNKNOWN is
 * deliberately excluded from both views rather than guessed into either.
 */
export class ResourceReadinessService {
  constructor(
    private readonly repository: ResourceReadinessRepositoryContract,
    private readonly resourceDefinitionService: ResourceDefinitionLookup =
      new ResourceDefinitionService(
        new ResourceDefinitionRepository()
      )
  ) {}

  async getOverview(): Promise<ResourceOverviewResponse> {
    const definitions =
      await this.resourceDefinitionService.listEnabledForActiveSeason();

    const definitionIds = definitions.map(
      (definition) => definition.id
    );

    const [characters, snapshots] = await Promise.all([
      this.repository.findCharacters(),
      this.repository.findSnapshotsByDefinitionIds(
        definitionIds
      )
    ]);

    const snapshotByCharacterAndDefinition = new Map<
      string,
      ResourceSnapshotRow
    >(
      snapshots.map((row) => [
        `${row.characterId}:${row.resourceDefinitionId}`,
        row
      ])
    );

    const snapshotsByDefinitionId = new Map<
      string,
      ResourceSnapshotRow[]
    >();

    for (const row of snapshots) {
      const existing =
        snapshotsByDefinitionId.get(
          row.resourceDefinitionId
        ) ?? [];

      existing.push(row);

      snapshotsByDefinitionId.set(
        row.resourceDefinitionId,
        existing
      );
    }

    const characterScopedDefinitions = definitions.filter(
      (definition) =>
        definition.ownershipScope === "CHARACTER"
    );

    const accountWideDefinitions = definitions.filter(
      (definition) =>
        definition.ownershipScope === "ACCOUNT_WIDE"
    );

    const characterOverviews: CharacterResourceOverview[] =
      characters.map((character) => {
        const resources = characterScopedDefinitions.map(
          (definition) => {
            const row =
              snapshotByCharacterAndDefinition.get(
                `${character.id}:${definition.id}`
              );

            const snapshot = row
              ? toSnapshotView(row)
              : null;

            return {
              resourceDefinitionId: definition.id,
              key: definition.key,
              name: definition.name,
              category: definition.category,
              snapshot,
              attentionNeeded: snapshot
                ? deriveAttentionNeeded(
                    snapshot.weeklyComplete
                  )
                : false
            };
          }
        );

        return {
          id: character.id,
          name: character.name,
          resources,
          trackedResourceCount: resources.filter(
            (resource) => resource.snapshot !== null
          ).length,
          totalRelevantResourceCount: resources.length,
          attentionCount: resources.filter(
            (resource) => resource.attentionNeeded
          ).length
        };
      });

    const accountResources: AccountResourceView[] =
      accountWideDefinitions.map((definition) => {
        const rows =
          snapshotsByDefinitionId.get(definition.id) ??
          [];

        const picked = pickAccountWideSnapshot(rows);

        const snapshot = picked.row
          ? toSnapshotView(picked.row)
          : null;

        return {
          resourceDefinitionId: definition.id,
          key: definition.key,
          name: definition.name,
          category: definition.category,
          capturedByCharacterId: picked.characterId,
          ownershipMismatch: picked.mismatch,
          snapshot,
          attentionNeeded: snapshot
            ? deriveAttentionNeeded(
                snapshot.weeklyComplete
              )
            : false
        };
      });

    return {
      characters: characterOverviews,
      accountResources
    };
  }
}
