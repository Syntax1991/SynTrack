import { useEffect, useState } from "react";
import {
  clearRaiderSessionToken,
  getRaiderSessionToken
} from "../../../../../apps/web/src/shared/api/raiderSession";
import { getRaiderSessionStatus } from "../api/raiderAuthApi";

export type RaiderAuthGateStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated";

/*
 * Single source of truth for "is there a valid RaiderSession right now",
 * shared by every place that needs to branch on it: the protected-route
 * gate (RequireRaiderSession), and the public-only pages (landing,
 * /login, /register) that must not show auth CTAs to an already-signed-in
 * user. Checks once on mount - a session expiring mid-visit is not
 * proactively detected, matching the existing app's behavior.
 */
export function useRaiderSessionStatus():
  RaiderAuthGateStatus {
  const [status, setStatus] =
    useState<RaiderAuthGateStatus>(
      "checking"
    );

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const token =
        getRaiderSessionToken();

      if (!token) {
        if (!cancelled) {
          setStatus(
            "unauthenticated"
          );
        }

        return;
      }

      try {
        await getRaiderSessionStatus();

        if (!cancelled) {
          setStatus(
            "authenticated"
          );
        }
      }
      catch {
        clearRaiderSessionToken();

        if (!cancelled) {
          setStatus(
            "unauthenticated"
          );
        }
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
