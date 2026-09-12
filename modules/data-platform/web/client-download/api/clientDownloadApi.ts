import {
  apiRequest,
  getApiUrl
} from "../../../../../apps/web/src/shared/api/httpClient";
import type { ClientDownloadInfo } from "../types/clientDownload.types";

export function getClientDownloadInfo(): Promise<ClientDownloadInfo> {
  return apiRequest<ClientDownloadInfo>(
    "/client-download/info"
  );
}

/*
 * A plain URL, not a fetch() call - the browser handles the actual
 * download natively (streaming, resumable) via a normal <a href>.
 * Public endpoint, works identically signed in or signed out.
 */
export function getClientDownloadFileUrl(): string {
  return getApiUrl("/client-download/file");
}
