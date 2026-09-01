import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import {
  getRaiderLoginUrl,
  raiderLogout
} from "../../raider-auth/api/raiderAuthApi";
import { clearRaiderSessionToken } from "../../../../../apps/web/src/shared/api/raiderSession";
import { useSettingsTrust } from "../hooks/useSettingsTrust";
import {
  SettingsTrustDetailList,
  SettingsTrustDetailRow
} from "./SettingsTrustDetailList";

export function AccountSettingsPanel() {
  const trust = useSettingsTrust();

  const handleSignOut = async () => {
    try {
      await raiderLogout();
    }
    catch {
      // Session may already be expired server-side.
    }

    clearRaiderSessionToken();
    window.location.href = "/";
  };

  if (trust.isLoading) {
    return <LoadingPanel />;
  }

  if (trust.error || !trust.snapshot) {
    return (
      <StatusMessage type="error">
        {trust.error ??
          "Account settings could not be loaded."}
      </StatusMessage>
    );
  }

  const { account } = trust.snapshot;

  return (
    <section className="panel integration-panel settings-trust-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            SYNTRACK ACCOUNT
          </p>

          <h2>
            {account.battleTag ??
              "Signed in"}
          </h2>
        </div>

        <span className="integration-badge configured">
          Active
        </span>
      </div>

      <p className="muted-text settings-trust-lead">
        Your authenticated SynTrack identity.
        Battle.net connection is managed separately
        on the Battle.net tab.
      </p>

      <SettingsTrustDetailList>
        <SettingsTrustDetailRow
          label="BattleTag"
          value={
            account.battleTag ??
            "Unknown"
          }
        />

        <SettingsTrustDetailRow
          label="Account status"
          value="Signed in"
        />

        <SettingsTrustDetailRow
          label="SynTrack roster"
          value={account.synTrackRosterCount}
        />
      </SettingsTrustDetailList>

      <div className="integration-actions">
        <button
          className="button button-secondary"
          onClick={() => {
            void handleSignOut();
          }}
          type="button"
        >
          Sign out
        </button>

        <a
          className="button button-secondary"
          href={getRaiderLoginUrl()}
        >
          Refresh sign-in
        </a>
      </div>
    </section>
  );
}
