import { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { setRaiderSessionToken } from "../../../../../apps/web/src/shared/api/raiderSession";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import {
  confirmRegistration,
  getPendingRegistration
} from "../api/raiderAuthApi";
import { isSafeInternalPath } from "../utils/internalPath";

function extractHashValue(
  hash: string,
  key: string
): string | null {
  const match = new RegExp(
    `${key}=([^&]+)`,
    "u"
  ).exec(hash);

  return match
    ? decodeURIComponent(match[1])
    : null;
}

type ViewState =
  | { kind: "loading" }
  | {
      kind: "pending";
      pendingToken: string;
      battleTag: string | null;
    }
  | { kind: "creating" }
  | { kind: "existing" }
  | { kind: "error" };

/*
 * Lands here after Battle.net OAuth for a register-intent sign-in. Which
 * branch renders depends only on what the backend put in the URL hash -
 * a "token" means an account already existed and a real session was
 * already issued (spec section 13: just offer to continue); a
 * "pendingToken" means the identity is new and nothing has been created
 * yet, so this page's whole job is to get one explicit click before
 * RaiderAuthService.confirmRegistration ever runs.
 */
export function RegisterConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] =
    useSearchParams();

  const rawReturnTo =
    searchParams.get("returnTo");

  // Only meaningful for the "existing" branch (an account already
  // existed, so the outcome URL itself carries returnTo as a normal
  // query param - see raider-auth.controller.ts). The "pending" branch's
  // returnTo instead travels through RaiderPendingRegistration and comes
  // back on confirmRegistration()'s response.
  const existingAccountReturnTo =
    isSafeInternalPath(rawReturnTo)
      ? rawReturnTo
      : null;

  const [view, setView] =
    useState<ViewState>({
      kind: "loading"
    });

  const [redirectNow, setRedirectNow] =
    useState(false);

  // Captured once, during render, before anything has a chance to clear
  // it - React 18/19 StrictMode intentionally double-invokes effects (and
  // this same lazy initializer) in development, and re-reading the live
  // window.location.hash from inside the effect would see it already
  // stripped by the first invocation's replaceState, misreading a real
  // pendingToken as "missing" on the second pass.
  const [initialHash] = useState(
    () => window.location.hash
  );

  useEffect(() => {
    const hash = initialHash;

    const existingToken =
      extractHashValue(hash, "token");

    if (existingToken) {
      setRaiderSessionToken(
        existingToken
      );

      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );

      setView({ kind: "existing" });

      return;
    }

    const pendingToken =
      extractHashValue(
        hash,
        "pendingToken"
      );

    if (!pendingToken) {
      setView({ kind: "error" });

      return;
    }

    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );

    let cancelled = false;

    getPendingRegistration(
      pendingToken
    )
      .then((info) => {
        if (!cancelled) {
          setView({
            kind: "pending",
            pendingToken,
            battleTag: info.battleTag
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setView({ kind: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialHash]);

  async function handleCreateAccount(
    pendingToken: string
  ) {
    setView({ kind: "creating" });

    try {
      const result =
        await confirmRegistration(
          pendingToken
        );

      setRaiderSessionToken(
        result.token
      );

      const destination =
        isSafeInternalPath(
          result.returnTo
        )
          ? result.returnTo
          : "/";

      navigate(destination, {
        replace: true
      });
    }
    catch {
      setView({ kind: "error" });
    }
  }

  if (redirectNow) {
    return (
      <Navigate
        replace
        to={
          existingAccountReturnTo ??
          "/"
        }
      />
    );
  }

  if (
    view.kind === "loading" ||
    view.kind === "creating"
  ) {
    return (
      <div className="raider-session-gate">
        <LoadingPanel
          label={
            view.kind === "creating"
              ? "Creating your account…"
              : "Connecting your Battle.net account…"
          }
        />
      </div>
    );
  }

  if (view.kind === "error") {
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

          <a
            className="button button-primary"
            href="/register"
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  if (view.kind === "existing") {
    return (
      <div className="raider-session-gate">
        <div className="raider-session-gate-card">
          <span className="brand-mark">
            ST
          </span>

          <h1>
            You already have a SynTrack account
          </h1>

          <p>
            This Battle.net account is already linked to a SynTrack
            account.
          </p>

          <button
            className="button button-primary"
            onClick={() =>
              setRedirectNow(true)
            }
            type="button"
          >
            Continue to SynTrack
          </button>
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
          Create SynTrack account
        </h1>

        <p className="raider-auth-identity-label">
          Battle.net account
        </p>

        <p className="raider-auth-identity-value">
          {view.battleTag ??
            "Connected Battle.net account"}
        </p>

        <button
          className="button button-primary"
          onClick={() =>
            void handleCreateAccount(
              view.pendingToken
            )
          }
          type="button"
        >
          Create account
        </button>
      </div>
    </div>
  );
}
