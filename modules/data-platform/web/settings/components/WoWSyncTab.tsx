import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useSettingsTrust } from "../hooks/useSettingsTrust";
import { formatSyncAge } from "../utils/formatSyncAge";
import {
  SettingsTrustDetailList,
  SettingsTrustDetailRow
} from "./SettingsTrustDetailList";
import { ManualSavedVariablesImportPanel } from "./ManualSavedVariablesImportPanel";

function dataReceivedLabel(
  received: boolean
): string {
  return received
    ? "Received"
    : "Not received yet";
}

export function WoWSyncTab() {
  const trust = useSettingsTrust();

  if (trust.isLoading) {
    return <LoadingPanel />;
  }

  if (trust.error || !trust.snapshot) {
    return (
      <StatusMessage type="error">
        {trust.error ??
          "WoW sync status could not be loaded."}
      </StatusMessage>
    );
  }

  const { wowSync } = trust.snapshot;
  const lastSync = formatSyncAge(
    wowSync.lastSuccessfulSyncAt
  );

  return (
    <>
      <section className="panel integration-panel settings-trust-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              AUTOMATIC WOW SYNC
            </p>

            <h2>
              WoW data synchronization
            </h2>
          </div>

          <span
            className={`integration-badge ${
              wowSync.lastSuccessfulSyncAt
                ? "configured"
                : "pending"
            }`}
          >
            {wowSync.lastSuccessfulSyncAt
              ? "Active recently"
              : "No recent sync"}
          </span>
        </div>

        <p className="muted-text settings-trust-lead">
          SynTrack Desktop watches your WoW SavedVariables
          and automatically sends updates to SynTrack.
        </p>

        <SettingsTrustDetailList>
          <SettingsTrustDetailRow
            label="Last successful sync"
            title={lastSync.title}
            value={lastSync.label}
          />

          <SettingsTrustDetailRow
            label="Source"
            value={
              wowSync.source ??
              "Not configured yet"
            }
          />

          <SettingsTrustDetailRow
            label="Characters updated"
            value={
              wowSync.synTrackRosterCount
            }
          />

          <SettingsTrustDetailRow
            label="Core"
            value={dataReceivedLabel(
              wowSync.coreDataReceived
            )}
          />

          <SettingsTrustDetailRow
            label="Professions"
            value={dataReceivedLabel(
              wowSync.professionDataReceived
            )}
          />
        </SettingsTrustDetailList>

        {!wowSync.hasRegisteredDevice && (
          <p className="muted-text settings-trust-note">
            Automatic sync requires the SynTrack Desktop client.
            Connect a device under Devices, then play WoW normally.
          </p>
        )}
      </section>

      <details className="settings-advanced-disclosure">
        <summary>
          Advanced — Manual SavedVariables import
        </summary>

        <ManualSavedVariablesImportPanel />
      </details>
    </>
  );
}
