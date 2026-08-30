import {
  apiRequest,
  getApiUrl
} from "../../../../../apps/web/src/shared/api/httpClient";
import { isSafeInternalPath } from "../utils/internalPath";
import type {
  RaiderAuthIntent,
  RaiderPendingRegistrationInfo,
  RaiderSessionResult,
  RaiderSessionStatus
} from "../types/raiderAuth.types";

type RaiderLoginUrlOptions = {
  intent?: RaiderAuthIntent;
  returnTo?: string | null;
};

export function getRaiderLoginUrl(
  options?: RaiderLoginUrlOptions
): string {
  const url = new URL(
    getApiUrl(
      "/auth/raider/connect"
    )
  );

  if (options?.intent === "register") {
    url.searchParams.set(
      "intent",
      "register"
    );
  }

  if (
    isSafeInternalPath(
      options?.returnTo
    )
  ) {
    url.searchParams.set(
      "returnTo",
      options.returnTo
    );
  }

  return url.toString();
}

export function getRaiderSessionStatus():
  Promise<RaiderSessionStatus> {
  return apiRequest<RaiderSessionStatus>(
    "/auth/raider/session"
  );
}

export function raiderLogout():
  Promise<void> {
  return apiRequest<void>(
    "/auth/raider/logout",
    {
      method: "POST"
    }
  );
}

export function getPendingRegistration(
  pendingToken: string
): Promise<RaiderPendingRegistrationInfo> {
  return apiRequest<RaiderPendingRegistrationInfo>(
    "/auth/raider/register/pending",
    {
      headers: {
        Authorization: `Bearer ${pendingToken}`
      }
    }
  );
}

export function confirmRegistration(
  pendingToken: string
): Promise<RaiderSessionResult> {
  return apiRequest<RaiderSessionResult>(
    "/auth/raider/register/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pendingToken}`
      }
    }
  );
}
