import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { SettingsTrustSnapshot } from "../types/settingsTrust.types";

export function getSettingsTrustSnapshot():
  Promise<SettingsTrustSnapshot> {
  return apiRequest<SettingsTrustSnapshot>(
    "/settings/trust"
  );
}
