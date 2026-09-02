import { SEASON_EVIDENCE_CATALOG } from "../../../../my-syntrack/api/season-checklist/season-evidence-catalog.js";
import { ensureSeasonEvidenceTrackerDefinitionsForImport } from "../../../../my-syntrack/api/season-checklist/season-evidence-tracker-definitions.service.js";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../../../../my-syntrack/api/trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../../../../my-syntrack/api/trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../../../../my-syntrack/api/trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../../../../my-syntrack/api/trackers/tracker-scope-profile.service.js";
import type { TrackerDefinitionRow } from "../../../../my-syntrack/api/trackers/tracker-repository.types.js";

export type SeasonEvidenceDefinitionsByKey = Map<
  string,
  TrackerDefinitionRow
>;

export async function findSeasonEvidenceTrackerDefinitionsForImport(): Promise<SeasonEvidenceDefinitionsByKey> {
  const repository = new TrackerDefinitionRepository();
  const scopeKey =
    await ensureSeasonEvidenceTrackerDefinitionsForImport(repository);
  const activeScope = await new TrackerScopeProfileService(
    new TrackerScopeProfileRepository()
  ).getActive();
  const scopeKeys = [...new Set([
    scopeKey,
    ...(activeScope ? [activeScope.key] : []),
    GLOBAL_TRACKER_SCOPE_KEY
  ])];
  const definitionsByScope = await Promise.all(
    scopeKeys.map((key) => repository.findByScope(key))
  );
  const result: SeasonEvidenceDefinitionsByKey = new Map();

  for (const evidence of SEASON_EVIDENCE_CATALOG) {
    for (const definitions of definitionsByScope) {
      const definition = definitions.find(
        (candidate) =>
          candidate.key === evidence.trackerKey && candidate.enabled
      );

      if (definition) {
        result.set(evidence.trackerKey, definition);
        break;
      }
    }
  }

  return result;
}
