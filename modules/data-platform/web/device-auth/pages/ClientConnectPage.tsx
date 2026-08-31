import { useSearchParams } from "react-router-dom";
import { getRaiderLoginUrl } from "../../raider-auth/api/raiderAuthApi";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { useClientConnect } from "../hooks/useClientConnect";

/*
 * The whole codeless desktop-connection journey lands here: the desktop
 * client opens this exact URL (?token=<high-entropy browser capability>)
 * in the system browser. No device code is ever shown or typed - opening
 * this URL plus authenticating (or already being signed in) is the
 * entire authorization. Deliberately a top-level route outside
 * AppLayout/RequireRaiderSession (see apps/web/src/app/AppRouter.tsx) so
 * it renders correctly while the browser is completely signed out.
 */
export function ClientConnectPage() {
  const { view } = useClientConnect();
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") ?? "";

  const returnTo = token
    ? `/client/connect?token=${encodeURIComponent(token)}`
    : null;

  return (
    <div className="raider-session-gate">
      <div className="raider-session-gate-card">
        <span className="brand-mark">
          ST
        </span>

        {view.kind === "loading" && (
          <LoadingPanel label="Checking this connection request…" />
        )}

        {view.kind ===
          "connecting" && (
          <LoadingPanel label="Connecting your SynTrack Client…" />
        )}

        {view.kind === "pending" && (
          <>
            <h1>
              Connect SynTrack
              Client
            </h1>

            <p>
              {view.deviceName ??
                "A SynTrack desktop client"}{" "}
              wants to connect to your
              SynTrack account.
            </p>

            <a
              className="button button-primary"
              href={getRaiderLoginUrl(
                {
                  intent: "register",
                  returnTo,
                  deviceConnectionToken:
                    token
                }
              )}
            >
              Continue with
              Battle.net
            </a>
          </>
        )}

        {view.kind ===
          "connected" && (
          <>
            <h1>
              SynTrack Client
              connected
            </h1>

            <p className="raider-auth-identity-label">
              {view.deviceName ??
                "SynTrack Client"}
            </p>

            {view.connectedBattleTag && (
              <p className="raider-auth-identity-value">
                Connected to{" "}
                {
                  view.connectedBattleTag
                }
              </p>
            )}

            <p>
              You can return to the
              SynTrack desktop app.
            </p>
          </>
        )}

        {view.kind === "expired" && (
          <>
            <h1>
              Connection request
              expired
            </h1>

            <p>
              This connection request
              has expired. Return to
              the SynTrack desktop app
              and try again.
            </p>
          </>
        )}

        {view.kind === "invalid" && (
          <>
            <h1>
              Connection request not
              found
            </h1>

            <p>
              This connection request
              is no longer valid.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
