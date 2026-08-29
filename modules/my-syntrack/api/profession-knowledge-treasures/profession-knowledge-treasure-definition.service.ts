import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type {
  ProfessionKnowledgeTreasureDefinitionRepositoryContract,
  ProfessionKnowledgeTreasureDefinitionRow
} from "./profession-knowledge-treasure-definition-repository.types.js";
import type {
  ProfessionKnowledgeTreasureDefinitionSeedInput,
  ProfessionKnowledgeTreasureDefinitionView
} from "./profession-knowledge-treasure-definition.types.js";

function toView(
  row: ProfessionKnowledgeTreasureDefinitionRow
): ProfessionKnowledgeTreasureDefinitionView {
  return {
    id: row.id,
    scopeKey: row.scopeKey,
    professionKey: row.professionKey,
    sourceKey: row.sourceKey,
    name: row.name,
    externalQuestId: row.externalQuestId,
    knowledgePoints: row.knowledgePoints,
    enabled: row.enabled,
    sortOrder: row.sortOrder
  };
}

export type ActiveScopeLookup = {
  getActive(): Promise<{ key: string } | null>;
};

/*
 * Season/content scoping mirrors ResourceDefinitionService and
 * ProfessionWeeklyDefinitionService exactly - no second independent
 * "active content" mechanism, even though a treasure's own completion
 * is permanent once captured (only the catalog of which treasures
 * exist is content-scoped).
 */
export class ProfessionKnowledgeTreasureDefinitionService {
  constructor(
    private readonly repository: ProfessionKnowledgeTreasureDefinitionRepositoryContract,
    private readonly trackerScopeProfileService: ActiveScopeLookup =
      new TrackerScopeProfileService(
        new TrackerScopeProfileRepository()
      )
  ) {}

  async listForScopes(
    scopeKeys: string[]
  ): Promise<ProfessionKnowledgeTreasureDefinitionView[]> {
    const rows = await this.repository.findByScopeKeys(scopeKeys);

    return rows.map(toView);
  }

  async listEnabledForActiveSeason(): Promise<
    ProfessionKnowledgeTreasureDefinitionView[]
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
    input: ProfessionKnowledgeTreasureDefinitionSeedInput
  ): Promise<ProfessionKnowledgeTreasureDefinitionView> {
    const created =
      await this.repository.upsertByScopeProfessionSource(input);

    return toView(created);
  }
}
