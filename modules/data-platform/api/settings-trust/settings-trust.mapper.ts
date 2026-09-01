import { env } from "../../../../apps/api/src/config/env.js";
import type {
  BattleNetConnectionStatus,
  SettingsTrustAccountRow,
  SettingsTrustSnapshot,
  SettingsTrustSyncRow
} from "./settings-trust.types.js";

export function resolveBattleNetConnectionStatus(
  account: SettingsTrustAccountRow
): BattleNetConnectionStatus {
  if (!account.battleNetAccountId) {
    return "not_linked";
  }

  if (!account.accessToken) {
    return "reconnect_required";
  }

  if (
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() <=
      Date.now()
  ) {
    return "reconnect_required";
  }

  return "linked";
}

export function buildSettingsTrustSnapshot(input: {
  account: SettingsTrustAccountRow;
  synTrackRosterCount: number;
  desktopSync: SettingsTrustSyncRow;
  coreDataReceived: boolean;
  professionDataReceived: boolean;
  discoveredCharacterCount: number | null;
}): SettingsTrustSnapshot {
  const connectionStatus =
    resolveBattleNetConnectionStatus(
      input.account
    );

  const lastSuccessfulSyncAt =
    input.desktopSync.lastSeenAt?.toISOString() ??
    null;

  const hasRegisteredDevice =
    input.desktopSync.deviceCount > 0;

  return {
    account: {
      battleTag: input.account.battleTag,
      status: "signed_in",
      synTrackRosterCount:
        input.synTrackRosterCount
    },
    battleNet: {
      connectionStatus,
      battleTag: input.account.battleTag,
      region:
        env.BATTLENET_REGION.toUpperCase(),
      discoveredCharacterCount:
        connectionStatus === "linked"
          ? input.discoveredCharacterCount
          : null,
      synTrackRosterCount:
        input.synTrackRosterCount
    },
    wowSync: {
      lastSuccessfulSyncAt,
      source: hasRegisteredDevice
        ? "SynTrack Desktop"
        : null,
      synTrackRosterCount:
        input.synTrackRosterCount,
      hasRegisteredDevice,
      coreDataReceived:
        input.coreDataReceived,
      professionDataReceived:
        input.professionDataReceived
    }
  };
}
