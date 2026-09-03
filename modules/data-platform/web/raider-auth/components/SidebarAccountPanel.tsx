import { useCallback, useEffect, useState } from "react";
import { getRaiderSessionStatus, raiderLogout } from "../api/raiderAuthApi";
import {
  clearRaiderSessionToken,
  getRaiderSessionToken
} from "../../../../../apps/web/src/shared/api/raiderSession";
import type { RaiderSessionStatus } from "../types/raiderAuth.types";

/** No canonical avatar exists anywhere in SynTrack/Battle.net session data
 * (RaiderSessionStatus carries only battleTag + expiresAt) — this is a
 * deterministic initials fallback, not a fabricated profile image. */
function avatarInitial(battleTag: string | null): string {
  const trimmed = battleTag?.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/*
 * Account identity + logout, anchored at the bottom of the sidebar via
 * margin-top: auto on the parent flex column. Reuses the same session
 * API as RaiderAuthTopAction (still used by the mobile topbar) — this is
 * a different presentation of the same real data, not a new source.
 */
export function SidebarAccountPanel() {
  const [status, setStatus] = useState<RaiderSessionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!getRaiderSessionToken()) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      setStatus(await getRaiderSessionStatus());
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await raiderLogout();
    } catch {
      // Session may already be expired server-side; still clear it locally.
    }

    clearRaiderSessionToken();
    window.location.href = "/";
  };

  if (isLoading || !status) {
    return null;
  }

  return (
    <div className="sidebar-account">
      <div className="sidebar-account-identity">
        <span aria-hidden="true" className="sidebar-avatar">
          {avatarInitial(status.battleTag)}
        </span>

        <span className="sidebar-account-battletag">
          {status.battleTag ?? "Account"}
        </span>

        <span
          aria-label="Platform online"
          className="online-dot"
          title="Platform online"
        />
      </div>

      <button
        className="sidebar-logout-button"
        disabled={isLoggingOut}
        onClick={() => {
          void handleLogout();
        }}
        type="button"
      >
        {isLoggingOut ? "Signing out…" : "Logout"}
      </button>
    </div>
  );
}
