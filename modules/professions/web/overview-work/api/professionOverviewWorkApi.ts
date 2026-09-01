import {
  apiRequest
} from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  ProfessionOverviewWorkResponse
} from "../types/professionOverviewWork.types";

export function getProfessionOverviewWork():
  Promise<ProfessionOverviewWorkResponse> {
  return apiRequest<ProfessionOverviewWorkResponse>(
    "/professions/overview-work"
  );
}
