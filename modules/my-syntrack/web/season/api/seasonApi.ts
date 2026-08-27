import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  TrackerScopeProfileCreateInput,
  TrackerScopeProfileView
} from "../types/season.types";

export function listTrackerScopeProfiles(): Promise<{
  items: TrackerScopeProfileView[];
}> {
  return apiRequest<{
    items: TrackerScopeProfileView[];
  }>("/tracker-scopes");
}

export function getActiveTrackerScopeProfile(): Promise<TrackerScopeProfileView | null> {
  return apiRequest<TrackerScopeProfileView | null>(
    "/tracker-scopes/active"
  );
}

export function createTrackerScopeProfile(
  input: TrackerScopeProfileCreateInput
): Promise<TrackerScopeProfileView> {
  return apiRequest<TrackerScopeProfileView>(
    "/tracker-scopes",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function activateTrackerScopeProfile(
  key: string
): Promise<TrackerScopeProfileView> {
  return apiRequest<TrackerScopeProfileView>(
    `/tracker-scopes/${encodeURIComponent(key)}/activate`,
    { method: "PUT" }
  );
}
