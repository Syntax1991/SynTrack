import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getRaiderLoginUrl } from "../api/raiderAuthApi";
import { useRaiderSessionStatus } from "../hooks/useRaiderSessionStatus";
import { getAuthErrorCopy } from "../utils/authErrorCopy";
import { isSafeInternalPath } from "../utils/internalPath";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";

export function RegisterPage() {
  const status = useRaiderSessionStatus();
  const [searchParams] = useSearchParams();

  const rawReturnTo =
    searchParams.get("returnTo");

  const returnTo = isSafeInternalPath(
    rawReturnTo
  )
    ? rawReturnTo
    : null;

  const deviceConnectionToken =
    searchParams.get(
      "deviceConnectionToken"
    );

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
            intent: "register",
            returnTo,
            deviceConnectionToken
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
