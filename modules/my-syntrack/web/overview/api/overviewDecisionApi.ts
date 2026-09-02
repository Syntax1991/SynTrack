import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { OverviewDecisionResponse } from "../types/overviewDecision.types";

export function getOverviewDecisions() {
  return apiRequest<OverviewDecisionResponse>("/overview");
}
