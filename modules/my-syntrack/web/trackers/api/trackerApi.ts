import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  CharacterTrackerState,
  TrackerDefinitionCreateInput,
  TrackerDefinitionMetadataUpdate,
  TrackerDefinitionView,
  TrackerValueInput
} from "../types/tracker.types";

export function listTrackerDefinitions(
  scopeKey: string
): Promise<TrackerDefinitionView[]> {
  return apiRequest<
    TrackerDefinitionView[]
  >(
    `/tracker-definitions/${encodeURIComponent(scopeKey)}`
  );
}

export function createTrackerDefinition(
  input: TrackerDefinitionCreateInput
): Promise<TrackerDefinitionView> {
  return apiRequest<TrackerDefinitionView>(
    "/tracker-definitions",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function updateTrackerDefinition(
  id: string,
  update: TrackerDefinitionMetadataUpdate
): Promise<TrackerDefinitionView> {
  return apiRequest<TrackerDefinitionView>(
    `/tracker-definitions/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(update)
    }
  );
}

export function setTrackerValue(
  trackerDefinitionId: string,
  characterId: string,
  input: TrackerValueInput
): Promise<CharacterTrackerState> {
  return apiRequest<CharacterTrackerState>(
    `/tracker-values/${encodeURIComponent(trackerDefinitionId)}/${encodeURIComponent(characterId)}`,
    {
      method: "PUT",
      body: JSON.stringify(input)
    }
  );
}

export function clearTrackerValue(
  trackerDefinitionId: string,
  characterId: string
): Promise<CharacterTrackerState> {
  return apiRequest<CharacterTrackerState>(
    `/tracker-values/${encodeURIComponent(trackerDefinitionId)}/${encodeURIComponent(characterId)}`,
    { method: "DELETE" }
  );
}
