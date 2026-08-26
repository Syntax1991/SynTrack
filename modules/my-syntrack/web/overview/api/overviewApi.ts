import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { OverviewResponse } from "../types/overview.types";

export function getOverview(): Promise<OverviewResponse> {
  return apiRequest<OverviewResponse>(
    "/overview"
  );
}
