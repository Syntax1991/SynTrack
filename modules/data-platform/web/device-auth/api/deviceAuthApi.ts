import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { DeviceCredentialView } from "../types/device-auth.types";

export function approveDeviceLink(
  userCode: string
): Promise<{ approved: boolean }> {
  return apiRequest<{ approved: boolean }>(
    `/client/link/${encodeURIComponent(userCode)}/approve`,
    { method: "POST" }
  );
}

export function listDevices(): Promise<{
  items: DeviceCredentialView[];
}> {
  return apiRequest<{
    items: DeviceCredentialView[];
  }>("/client/devices");
}

export function revokeDevice(
  id: string
): Promise<DeviceCredentialView> {
  return apiRequest<DeviceCredentialView>(
    `/client/devices/${encodeURIComponent(id)}/revoke`,
    { method: "POST" }
  );
}
