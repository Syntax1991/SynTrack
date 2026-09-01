import {
  useCallback,
  useEffect,
  useState
} from "react";
import { NavLink } from "react-router-dom";
import {
  getRaiderLoginUrl,
  getRaiderSessionStatus,
  raiderLogout
} from "../api/raiderAuthApi";
import {
  clearRaiderSessionToken,
  getRaiderSessionToken
} from "../../../../../apps/web/src/shared/api/raiderSession";
import type { RaiderSessionStatus } from "../types/raiderAuth.types";

export function RaiderAuthTopAction() {
  const [status, setStatus] =
    useState<RaiderSessionStatus | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const loadStatus = useCallback(
    async () => {
      if (!getRaiderSessionToken()) {
        setStatus(null);
        setIsLoading(false);
        return;
      }

      try {
        setStatus(
          await getRaiderSessionStatus()
        );
      }
      catch {
        setStatus(null);
      }
      finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await raiderLogout();
    }
    catch {
      // Session may already be expired server-side; still clear it locally.
    }

    clearRaiderSessionToken();

    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="raider-auth-top-action" />
    );
  }

  if (!status) {
    return (
      <div className="raider-auth-top-action">
        <a
          className="raider-auth-top-signin"
          href={getRaiderLoginUrl()}
        >
          Sign in with Battle.net
        </a>
      </div>
    );
  }

  return (
    <div className="raider-auth-top-action raider-auth-top-account">
      <NavLink
        className="raider-auth-top-battletag"
        to="/settings"
      >
        {status.battleTag ??
          "Account"}
      </NavLink>

      <button
        className="text-button"
        disabled={isLoggingOut}
        onClick={() => {
          void handleLogout();
        }}
        type="button"
      >
        {isLoggingOut
          ? "Signing out…"
          : "Sign out"}
      </button>
    </div>
  );
}
