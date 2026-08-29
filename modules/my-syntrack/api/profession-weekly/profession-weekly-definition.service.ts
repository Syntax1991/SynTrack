import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type {
  ProfessionWeeklySourceDefinitionRepositoryContract,
  ProfessionWeeklySourceDefinitionRow
} from "./profession-weekly-definition-repository.types.js";
import type {
  ProfessionWeeklySourceDefinitionSeedInput,
  ProfessionWeeklySourceDefinitionView,
  ProfessionWeeklySourceType
} from "./profession-weekly-definition.types.js";

function toView(
  row: ProfessionWeeklySourceDefinitionRow
): ProfessionWeeklySourceDefinitionView {
  return {
    id: row.id,
    scopeKey: row.scopeKey,
    professionKey: row.professionKey,
    sourceKey: row.sourceKey,
    name: row.name,
    sourceType: row.sourceType as ProfessionWeeklySourceType,
    externalQuestId: row.externalQuestId,
    externalCurrencyId: row.externalCurrencyId,
    enabled: row.enabled,
    sortOrder: row.sortOrder
  };
}

/*
 * Season scoping mirrors ResourceDefinitionService exactly - no second
 * independent "active season" mechanism. Enabling a source for a new
 * season is a data change here (ensureDefinition calls with the new
 * season's live-confirmed ids), never a business logic change in the
 * addon/backend/UI that consume this service.
 */
export type ActiveScopeLookup = {
  getActive(): Promise<{ key: string } | null>;
};

export class ProfessionWeeklyDefinitionService {
  constructor(
    private readonly repository: ProfessionWeeklySourceDefinitionRepositoryContract,
    private readonly trackerScopeProfileService: ActiveScopeLookup =
      new TrackerScopeProfileService(
        new TrackerScopeProfileRepository()
      )
  ) {}

  async listForScopes(
    scopeKeys: string[]
  ): Promise<ProfessionWeeklySourceDefinitionView[]> {
    const rows = await this.repository.findByScopeKeys(scopeKeys);

    return rows.map(toView);
  }

  async listEnabledForActiveSeason(): Promise<
    ProfessionWeeklySourceDefinitionView[]
  > {
    const activeScope =
      await this.trackerScopeProfileService.getActive();

    const scopeKeys = activeScope
      ? [activeScope.key, GLOBAL_TRACKER_SCOPE_KEY]
      : [GLOBAL_TRACKER_SCOPE_KEY];

    const rows = await this.repository.findByScopeKeys(scopeKeys);

    return rows.filter((row) => row.enabled).map(toView);
  }

  async ensureDefinition(
    input: ProfessionWeeklySourceDefinitionSeedInput
  ): Promise<ProfessionWeeklySourceDefinitionView> {
    /*
     * Knowledge Drops is captured via the exact same flaggedCompleted
     * hidden-quest evidence as Weekly Quest/Treatise (each "slot" is
     * its own any-one-candidate hidden quest) - it is NOT currency-
     * based, so every sourceType requires an externalQuestId. See the
     * profession weekly correctness follow-up.
     */
    const hasQuestId =
      input.externalQuestId !== undefined &&
      input.externalQuestId !== null;

    if (!hasQuestId) {
      throw new AppError(
        400,
        `Profession weekly source "${input.scopeKey}/${input.professionKey}/${input.sourceKey}" needs an externalQuestId to be captured automatically.`
      );
    }

    const created =
      await this.repository.upsertByScopeProfessionSource(input);

    return toView(created);
  }
}
