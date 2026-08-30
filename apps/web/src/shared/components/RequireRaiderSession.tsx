import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRaiderSessionStatus } from "../../../../../modules/data-platform/web/raider-auth/hooks/useRaiderSessionStatus";
import { PublicLandingPage } from "../../../../../modules/data-platform/web/raider-auth/pages/PublicLandingPage";
import { LoadingPanel } from "./LoadingPanel";

type RequireRaiderSessionProps = {
  children: ReactNode;
};

/*
 * Gates every route rendered through AppLayout. An unauthenticated visit
 * to "/" (the app's index route) gets the compact public landing page in
 * place, matching the "signed-out public entry" spec. An unauthenticated
 * visit to any other protected route redirects to /login, carrying the
 * current path as a safe (same-origin, "/"-prefixed) returnTo so the
 * user lands back where they were after signing in.
 */
export function RequireRaiderSession({
  children
}: RequireRaiderSessionProps) {
  const status = useRaiderSessionStatus();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div className="raider-session-gate">
        <LoadingPanel label="Checking your session…" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    if (location.pathname === "/") {
      return <PublicLandingPage />;
    }

    const returnTo = `${location.pathname}${location.search}`;

    return (
      <Navigate
        replace
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
      />
    );
  }

  return <>{children}</>;
}
