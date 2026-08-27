import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type {
  ResourceDefinitionRepositoryContract,
  ResourceDefinitionRow
} from "./resource-definition-repository.types.js";
import type {
  ResourceDefinitionSeedInput,
  ResourceDefinitionView
} from "./resource-definition.types.js";

function toView(
  row: ResourceDefinitionRow
): ResourceDefinitionView {
  return {
    id: row.id,
    key: row.key,
    scopeKey: row.scopeKey,
    externalCurrencyId: row.externalCurrencyId,
    externalItemId: row.externalItemId,
    name: row.name,
    category:
      row.category as ResourceDefinitionView["category"],
    resetBehavior:
      row.resetBehavior as ResourceDefinitionView["resetBehavior"],
    ownershipScope:
      row.ownershipScope as ResourceDefinitionView["ownershipScope"],
    enabled: row.enabled,
    sortOrder: row.sortOrder
  };
}

/*
 * Season scoping mirrors TrackerDefinition's own GLOBAL + active-season
 * combination (see overview.service.ts's combinePinnedTrackerColumns) -
 * no second independent "active season" mechanism is introduced.
 * Enabling next season is a data change here (ensureDefinition calls
 * with the new season's real, live-confirmed ids), never a business
 * logic change in the addon/backend/UI that consume this service.
 */
export type ActiveScopeLookup = {
  getActive(): Promise<{ key: string } | null>;
};

export class ResourceDefinitionService {
  constructor(
    private readonly repository: ResourceDefinitionRepositoryContract,
    private readonly trackerScopeProfileService: ActiveScopeLookup =
      new TrackerScopeProfileService(
        new TrackerScopeProfileRepository()
      )
  ) {}

  async listEnabledForScopes(
    scopeKeys: string[]
  ): Promise<ResourceDefinitionView[]> {
    const rows =
      await this.repository.findByScopeKeys(scopeKeys);

    return rows
      .filter((row) => row.enabled)
      .map(toView);
  }

  async listEnabledForActiveSeason(): Promise<
    ResourceDefinitionView[]
  > {
    const activeScope =
      await this.trackerScopeProfileService.getActive();

    const scopeKeys = activeScope
      ? [activeScope.key, GLOBAL_TRACKER_SCOPE_KEY]
      : [GLOBAL_TRACKER_SCOPE_KEY];

    return this.listEnabledForScopes(scopeKeys);
  }

  async ensureDefinition(
    input: ResourceDefinitionSeedInput
  ): Promise<ResourceDefinitionView> {
    const hasCurrencyId =
      input.externalCurrencyId !== undefined &&
      input.externalCurrencyId !== null;

    const hasItemId =
      input.externalItemId !== undefined &&
      input.externalItemId !== null;

    if (!hasCurrencyId && !hasItemId) {
      throw new AppError(
        400,
        `Resource definition "${input.key}" needs an externalCurrencyId or an externalItemId to be captured automatically.`
      );
    }

    const created =
      await this.repository.upsertByKey(input);

    return toView(created);
  }
}
