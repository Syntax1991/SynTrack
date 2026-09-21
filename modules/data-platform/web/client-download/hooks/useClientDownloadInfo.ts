import { useEffect, useState } from "react";
import { getClientDownloadInfo } from "../api/clientDownloadApi";
import type { ClientDownloadInfo } from "../types/clientDownload.types";

export type ClientDownloadInfoState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; info: ClientDownloadInfo };

/*
 * Public, no-auth-required lookup - safe to call from the signed-out
 * landing page. A fetch failure (network/server down) degrades to the
 * same "not available right now" presentation as a genuinely empty
 * download directory, rather than showing a scary error on a marketing
 * page.
 */
export function useClientDownloadInfo(): ClientDownloadInfoState {
  const [state, setState] =
    useState<ClientDownloadInfoState>({
      status: "loading"
    });

  useEffect(() => {
    let cancelled = false;

    getClientDownloadInfo()
      .then((info) => {
        if (!cancelled) {
          setState({ status: "ready", info });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
