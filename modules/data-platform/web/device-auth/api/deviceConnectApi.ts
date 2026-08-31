import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { DeviceConnectionPreview } from "../types/device-auth.types";

/*
 * Public/unauthenticated - safe, since the token itself is the
 * high-entropy secret and the endpoint never returns pollToken/deviceCode
 * or the DeviceCredential.
 */
export function previewDeviceConnection(
  token: string
): Promise<DeviceConnectionPreview> {
  return apiRequest<DeviceConnectionPreview>(
    `/client/connect/preview?token=${encodeURIComponent(token)}`
  );
}

/*
 * "Browser already has a valid SynTrack session" fast path - apiRequest
 * automatically attaches the raider session bearer token when one exists
 * in localStorage, which is exactly the precondition for this call.
 */
export function bindDeviceConnection(
  token: string
): Promise<DeviceConnectionPreview> {
  return apiRequest<DeviceConnectionPreview>(
    "/client/connect/bind",
    {
      method: "POST",
      body: JSON.stringify({ token })
    }
  );
}
