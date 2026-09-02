import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type { TrackerDefinitionRepositoryContract } from "../trackers/tracker-repository.types.js";
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";

export async function ensureSeasonEvidenceTrackerDefinitions(
  scopeKey: string,
  repository: TrackerDefinitionRepositoryContract
): Promise<void> {
  await Promise.all(
    SEASON_EVIDENCE_CATALOG.map(async (evidence, index) => {
      const existing = await repository.findByIdentity(
        scopeKey,
        evidence.trackerKey
      );

      if (existing) {
        return;
      }

      await repository.create({
        scopeKey,
        key: evidence.trackerKey,
        name: `Season evidence ${evidence.externalId}`,
        valueType: "BOOLEAN",
        resetBehavior: "SEASONAL",
        category: "SEASON_EVIDENCE",
        sortOrder: 100 + index,
        isPinned: false
      });
    })
  );
}

export type SeasonEvidenceActiveScopeLookup = {
  getActive(): Promise<{ key: string } | null>;
};

export async function ensureSeasonEvidenceTrackerDefinitionsForImport(
  repository: TrackerDefinitionRepositoryContract = new TrackerDefinitionRepository(),
  scopeProfileService: SeasonEvidenceActiveScopeLookup = new TrackerScopeProfileService(
    new TrackerScopeProfileRepository()
  )
): Promise<string> {
  const activeScope = await scopeProfileService.getActive();
  const scopeKey = activeScope?.key ?? GLOBAL_TRACKER_SCOPE_KEY;

  await ensureSeasonEvidenceTrackerDefinitions(scopeKey, repository);

  return scopeKey;
}
