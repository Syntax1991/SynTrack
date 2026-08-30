import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getRaiderLoginUrl } from "../api/raiderAuthApi";
import { useRaiderSessionStatus } from "../hooks/useRaiderSessionStatus";
import { getAuthErrorCopy } from "../utils/authErrorCopy";
import { isSafeInternalPath } from "../utils/internalPath";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";

export function LoginPage() {
  const status = useRaiderSessionStatus();
  const [searchParams] = useSearchParams();

  const rawReturnTo =
    searchParams.get("returnTo");

  const returnTo = isSafeInternalPath(
    rawReturnTo
  )
    ? rawReturnTo
    : null;

  const outcome =
    searchParams.get("outcome");

  const errorCopy = getAuthErrorCopy(
    searchParams.get("error")
  );

  if (status === "checking") {
    return (
      <div className="raider-session-gate">
        <LoadingPanel label="Checking your session…" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <Navigate
        replace
        to={returnTo ?? "/"}
      />
    );
  }

  if (outcome === "unknown-account") {
    return (
      <div className="raider-session-gate">
        <div className="raider-session-gate-card">
          <span className="brand-mark">
            ST
          </span>

          <h1>No account found</h1>

          <p>
            No SynTrack account exists for this Battle.net account.
          </p>

          <Link
            className="button button-primary"
            to="/register"
          >
            Create account
          </Link>

          <Link
            className="text-button"
            to="/login"
          >
            Try a different Battle.net account
          </Link>
        </div>
      </div>
    );
  }

  if (errorCopy) {
    return (
      <div className="raider-session-gate">
        <div className="raider-session-gate-card">
          <span className="brand-mark">
            ST
          </span>

          <h1>{errorCopy.title}</h1>

          <p>
            {errorCopy.description}
          </p>

          <Link
            className="button button-primary"
            to="/login"
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

        <h1>Welcome back</h1>

        <p>
          Sign in to your SynTrack account.
        </p>

        <a
          className="button button-primary"
          href={getRaiderLoginUrl({
            intent: "login",
            returnTo
          })}
        >
          Continue with Battle.net
        </a>

        <p className="raider-auth-secondary">
          New to SynTrack?{" "}
          <Link to="/register">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
