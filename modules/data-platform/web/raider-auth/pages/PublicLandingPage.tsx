import { Link, Navigate } from "react-router-dom";
import { useRaiderSessionStatus } from "../hooks/useRaiderSessionStatus";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";

/*
 * The compact, non-marketing public entry point: what a signed-out user
 * sees at "/" instead of being dumped straight into the Battle.net OAuth
 * protocol. An already-authenticated visitor is sent straight into the
 * app - Create account / Log in are never shown once signed in.
 */
export function PublicLandingPage() {
  const status = useRaiderSessionStatus();

  if (status === "checking") {
    return (
      <div className="raider-session-gate">
        <LoadingPanel label="Checking your session…" />
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="raider-session-gate">
      <div className="raider-session-gate-card raider-landing-card">
        <span className="brand-mark">
          ST
        </span>

        <h1>SynTrack</h1>

        <p className="raider-auth-tagline">
          Personal Control Center
        </p>

        <p>
          Track your World of Warcraft characters, weekly progress and
          professions in one place.
        </p>

        <div className="raider-auth-actions">
          <Link
            className="button button-primary"
            to="/register"
          >
            Create account
          </Link>

          <Link
            className="button button-secondary"
            to="/login"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
