import {
  useCallback,
  useState
} from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { getRaiderLoginUrl } from "../../raider-auth/api/raiderAuthApi";
import {
  getBattleNetCharacters,
  importBattleNetCharacters
} from "../../integrations/api/battlenetApi";
import { BattleNetCharacterSelector } from "../../integrations/components/BattleNetCharacterSelector";
import { BattleNetImportResultCard } from "../../integrations/components/BattleNetImportResult";
import type {
  BattleNetCharacterPreviewResult,
  BattleNetImportResult
} from "../../integrations/types/battlenet.types";
import { useSettingsTrust } from "../hooks/useSettingsTrust";
import type { BattleNetConnectionStatus } from "../types/settingsTrust.types";
import {
  SettingsTrustDetailList,
  SettingsTrustDetailRow
} from "./SettingsTrustDetailList";

function connectionStatusLabel(
  status: BattleNetConnectionStatus
): string {
  switch (status) {
    case "linked":
      return "Linked";
    case "reconnect_required":
      return "Reconnect required";
    case "not_linked":
      return "Not linked";
  }
}

function connectionBadgeClass(
  status: BattleNetConnectionStatus
): string {
  switch (status) {
    case "linked":
      return "configured";
    case "reconnect_required":
      return "pending";
    case "not_linked":
      return "pending";
  }
}

export function BattleNetSettingsPanel() {
  const trust = useSettingsTrust();

  const [
    characterPreview,
    setCharacterPreview
  ] =
    useState<BattleNetCharacterPreviewResult | null>(
      null
    );

  const [importResult, setImportResult] =
    useState<BattleNetImportResult | null>(
      null
    );

  const [
    isLoadingCharacters,
    setIsLoadingCharacters
  ] = useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [refreshError, setRefreshError] =
    useState<string | null>(null);

  const loadCharacters =
    useCallback(async () => {
      setRefreshError(null);
      setIsLoadingCharacters(true);

      try {
        setCharacterPreview(
          await getBattleNetCharacters()
        );
      }
      catch (loadError) {
        setRefreshError(
          loadError instanceof Error
            ? loadError.message
            : "Battle.net characters could not be loaded."
        );
      }
      finally {
        setIsLoadingCharacters(false);
      }
    }, []);

  const handleImport = async (
    characterKeys: string[]
  ) => {
    setRefreshError(null);
    setImportResult(null);
    setIsImporting(true);

    try {
      const result =
        await importBattleNetCharacters(
          characterKeys
        );

      setImportResult(result);

      await loadCharacters();
      await trust.reload();
    }
    catch (importError) {
      setRefreshError(
        importError instanceof Error
          ? importError.message
          : "Character import failed."
      );
    }
    finally {
      setIsImporting(false);
    }
  };

  if (trust.isLoading) {
    return <LoadingPanel />;
  }

  if (trust.error || !trust.snapshot) {
    return (
      <StatusMessage type="error">
        {trust.error ??
          "Battle.net settings could not be loaded."}
      </StatusMessage>
    );
  }

  const { battleNet } = trust.snapshot;
  const needsReconnect =
    battleNet.connectionStatus ===
    "reconnect_required";

  return (
    <>
      <section className="panel integration-panel settings-trust-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              BATTLE.NET
            </p>

            <h2>
              Blizzard account connection
            </h2>
          </div>

          <span
            className={`integration-badge ${connectionBadgeClass(
              battleNet.connectionStatus
            )}`}
          >
            {connectionStatusLabel(
              battleNet.connectionStatus
            )}
          </span>
        </div>

        <p className="muted-text settings-trust-lead">
          Battle.net is used for Blizzard roster discovery and
          authorization. Your SynTrack account stays signed in even
          when Battle.net needs reconnecting.
        </p>

        <SettingsTrustDetailList>
          <SettingsTrustDetailRow
            label="Status"
            value={connectionStatusLabel(
              battleNet.connectionStatus
            )}
          />

          <SettingsTrustDetailRow
            label="BattleTag"
            value={
              battleNet.battleTag ??
              "Unknown"
            }
          />

          <SettingsTrustDetailRow
            label="Region"
            value={battleNet.region}
          />

          <SettingsTrustDetailRow
            label="Battle.net discovered"
            value={
              battleNet.discoveredCharacterCount ??
              "Refresh to load"
            }
          />

          <SettingsTrustDetailRow
            label="SynTrack roster"
            value={
              battleNet.synTrackRosterCount
            }
          />
        </SettingsTrustDetailList>

        <div className="integration-actions">
          {needsReconnect ||
          battleNet.connectionStatus ===
            "not_linked" ? (
            <a
              className="button button-primary"
              href={getRaiderLoginUrl()}
            >
              {needsReconnect
                ? "Reconnect Battle.net"
                : "Connect Battle.net"}
            </a>
          ) : (
            <button
              className="button button-secondary"
              disabled={
                isLoadingCharacters
              }
              onClick={() => {
                void loadCharacters();
              }}
              type="button"
            >
              {isLoadingCharacters
                ? "Refreshing…"
                : "Refresh Battle.net characters"}
            </button>
          )}
        </div>

        {needsReconnect && (
          <p className="muted-text settings-trust-note">
            Battle.net connection needs attention. Reconnect to
            refresh Blizzard roster discovery.
          </p>
        )}
      </section>

      {refreshError && (
        <StatusMessage type="error">
          {refreshError}
        </StatusMessage>
      )}

      {characterPreview && (
        <BattleNetCharacterSelector
          characters={
            characterPreview.items
          }
          defaultMinimumLevel={
            characterPreview
              .defaultMinimumLevel
          }
          isImporting={
            isImporting
          }
          onImport={
            handleImport
          }
        />
      )}

      {importResult && (
        <BattleNetImportResultCard
          result={importResult}
        />
      )}
    </>
  );
}
