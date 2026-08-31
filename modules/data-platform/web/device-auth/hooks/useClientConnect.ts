import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRaiderSessionStatus } from "../../raider-auth/hooks/useRaiderSessionStatus";
import {
  bindDeviceConnection,
  previewDeviceConnection
} from "../api/deviceConnectApi";
import type { DeviceConnectionPreview } from "../types/device-auth.types";

export type ClientConnectViewState =
  | { kind: "loading" }
  | {
      kind: "pending";
      deviceName: string | null;
    }
  | { kind: "connecting" }
  | {
      kind: "connected";
      deviceName: string | null;
      connectedBattleTag: string | null;
    }
  | { kind: "expired" }
  | { kind: "invalid" };

function toView(
  token: string | null,
  preview: DeviceConnectionPreview | null,
  isBinding: boolean,
  hasError: boolean
): ClientConnectViewState {
  if (!token || hasError) {
    return { kind: "invalid" };
  }

  if (!preview) {
    return { kind: "loading" };
  }

  if (preview.status === "EXPIRED") {
    return { kind: "expired" };
  }

  if (preview.status === "INVALID") {
    return { kind: "invalid" };
  }

  if (preview.status === "CONNECTED") {
    return {
      kind: "connected",
      deviceName: preview.deviceName,
      connectedBattleTag:
        preview.connectedBattleTag
    };
  }

  if (isBinding) {
    return { kind: "connecting" };
  }

  return {
    kind: "pending",
    deviceName: preview.deviceName
  };
}

/*
 * Drives the whole codeless "browser lands here from the desktop client"
 * page. Two independent effects: one always previews the token (public,
 * unauthenticated), the other auto-binds the moment the browser already
 * has a valid SynTrack session AND the preview is still PENDING - the
 * "already signed in" fast path from the product spec (section 12), no
 * separate click required.
 */
export function useClientConnect(): {
  view: ClientConnectViewState;
} {
  const [searchParams] =
    useSearchParams();

  const token = searchParams.get(
    "token"
  );

  const sessionStatus =
    useRaiderSessionStatus();

  const [preview, setPreview] =
    useState<DeviceConnectionPreview | null>(
      null
    );

  const [isBinding, setIsBinding] =
    useState(false);

  const [hasError, setHasError] =
    useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    previewDeviceConnection(token)
      .then((result) => {
        if (!cancelled) {
          setPreview(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (
      !token ||
      sessionStatus !==
        "authenticated" ||
      !preview ||
      preview.status !== "PENDING"
    ) {
      return;
    }

    let cancelled = false;

    setIsBinding(true);

    bindDeviceConnection(token)
      .then((result) => {
        if (!cancelled) {
          setPreview(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBinding(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, sessionStatus, preview]);

  return {
    view: toView(
      token,
      preview,
      isBinding,
      hasError
    )
  };
}
