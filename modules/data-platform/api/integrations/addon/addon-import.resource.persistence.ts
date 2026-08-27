import { ResourceDefinitionRepository } from "../../../../my-syntrack/api/resources/resource-definition.repository.js";
import { ResourceDefinitionService } from "../../../../my-syntrack/api/resources/resource-definition.service.js";
import type { ResourceDefinitionView } from "../../../../my-syntrack/api/resources/resource-definition.types.js";
import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import type {
  AddonResourceSnapshot
} from "./addon-import.types.js";

type SnapshotValues = {
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  isWeeklyCapped: boolean | null;
  discovered: boolean | null;
  accountWide: boolean | null;
};

/*
 * The addon may broadly capture many discovered currencies (see
 * Resources.lua) - only currencies/items matching an enabled
 * ResourceDefinition for the active season (+ GLOBAL) are ever
 * persisted. An unmatched external id is intentionally ignored, never
 * stored under a guessed/placeholder definition (see the Currency &
 * Weekly Resource Tracking audit's filtering rule).
 *
 * Definitions are read via the global prisma client rather than the
 * import transaction (ResourceDefinitionService/TrackerScopeProfileService
 * are not transaction-aware) - acceptable here since which resources are
 * configured almost never changes concurrently with a live addon import,
 * unlike the character/gear rows this class writes, which do go through
 * the transaction.
 */
export type ResourceDefinitionLookup = {
  listEnabledForActiveSeason(): Promise<
    ResourceDefinitionView[]
  >;
};

export class AddonResourcePersistence {
  constructor(
    private readonly resourceDefinitionService: ResourceDefinitionLookup =
      new ResourceDefinitionService(
        new ResourceDefinitionRepository()
      )
  ) {}

  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    resources: AddonResourceSnapshot | null,
    result: CharacterPersistenceResult
  ): Promise<void> {
    if (!resources) {
      return;
    }

    const capturedAt = resources.capturedAt
      ? new Date(resources.capturedAt)
      : new Date();

    const definitions =
      await this.resourceDefinitionService.listEnabledForActiveSeason();

    const byCurrencyId = new Map<
      number,
      ResourceDefinitionView
    >(
      definitions
        .filter(
          (definition) =>
            definition.externalCurrencyId !== null
        )
        .map((definition) => [
          definition.externalCurrencyId as number,
          definition
        ])
    );

    const byItemId = new Map<
      number,
      ResourceDefinitionView
    >(
      definitions
        .filter(
          (definition) =>
            definition.externalItemId !== null
        )
        .map((definition) => [
          definition.externalItemId as number,
          definition
        ])
    );

    for (const currency of resources.currencies) {
      const definition = byCurrencyId.get(
        currency.currencyId
      );

      if (!definition) {
        continue;
      }

      await this.upsertSnapshot(
        transaction,
        characterId,
        definition.id,
        capturedAt,
        {
          quantity: currency.quantity,
          maxQuantity: currency.maxQuantity,
          weeklyQuantity: currency.weeklyQuantity,
          maxWeeklyQuantity: currency.maxWeeklyQuantity,
          isCapped: currency.isCapped,
          isWeeklyCapped: currency.isWeeklyCapped,
          discovered: currency.discovered,
          accountWide: currency.accountWide
        }
      );

      result.resourceSnapshots += 1;
    }

    for (const item of resources.items) {
      const definition = byItemId.get(item.itemId);

      if (!definition) {
        continue;
      }

      await this.upsertSnapshot(
        transaction,
        characterId,
        definition.id,
        capturedAt,
        {
          quantity: item.count,
          maxQuantity: null,
          weeklyQuantity: null,
          maxWeeklyQuantity: null,
          isCapped: null,
          isWeeklyCapped: null,
          discovered: null,
          accountWide: null
        }
      );

      result.resourceSnapshots += 1;
    }
  }

  private async upsertSnapshot(
    transaction: AddonImportTransaction,
    characterId: string,
    resourceDefinitionId: string,
    capturedAt: Date,
    values: SnapshotValues
  ): Promise<void> {
    const data = {
      ...values,
      source: "ADDON",
      capturedAt
    };

    await transaction.characterResourceSnapshot.upsert({
      where: {
        characterId_resourceDefinitionId: {
          characterId,
          resourceDefinitionId
        }
      },
      create: {
        characterId,
        resourceDefinitionId,
        ...data
      },
      update: data
    });
  }
}
