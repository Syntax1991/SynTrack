import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { SeasonChecklistResponse } from "../../../api/season-checklist/season-checklist.types.js";

export function getSeasonChecklist() {
  return apiRequest<SeasonChecklistResponse>("/season-checklist");
}
