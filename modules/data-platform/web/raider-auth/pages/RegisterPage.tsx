import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getRaiderLoginUrl } from "../api/raiderAuthApi";
import { useRaiderSessionStatus } from "../hooks/useRaiderSessionStatus";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";

export function RegisterPage() {
  const status = useRaiderSessionStatus();
  const [searchParams] = useSearchParams();

  const hasError =
    Boolean(searchParams.get("error"));

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

  if (hasError) {
    return (
      <div className="raider-session-gate">
        <div className="raider-session-gate-card">
          <span className="brand-mark">
            ST
          </span>

          <h1>Sign-in failed</h1>

          <p>
            Could not sign in with Battle.net.
          </p>

          <Link
            className="button button-primary"
            to="/register"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="raider-session-gate">
      <div className="raider-session-gate-card">
        <span className="brand-mark">
          ST
        </span>

        <h1>
          Create your SynTrack account
        </h1>

        <p>
          Track your characters, weekly progression and professions with
          your Battle.net account.
        </p>

        <a
          className="button button-primary"
          href={getRaiderLoginUrl({
            intent: "register"
          })}
        >
          Register with Battle.net
        </a>

        <p className="raider-auth-secondary">
          Already have an account?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
