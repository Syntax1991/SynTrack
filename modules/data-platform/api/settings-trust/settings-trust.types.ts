export type BattleNetConnectionStatus =
  | "linked"
  | "reconnect_required"
  | "not_linked";

export type SettingsTrustSnapshot = {
  account: {
    battleTag: string | null;
    status: "signed_in";
    synTrackRosterCount: number;
  };
  battleNet: {
    connectionStatus: BattleNetConnectionStatus;
    battleTag: string | null;
    region: string;
    discoveredCharacterCount: number | null;
    synTrackRosterCount: number;
  };
  wowSync: {
    lastSuccessfulSyncAt: string | null;
    source: "SynTrack Desktop" | null;
    synTrackRosterCount: number;
    hasRegisteredDevice: boolean;
    coreDataReceived: boolean;
    professionDataReceived: boolean;
  };
};

export type SettingsTrustAccountRow = {
  battleTag: string | null;
  battleNetAccountId: string | null;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
};

export type SettingsTrustSyncRow = {
  lastSeenAt: Date | null;
  deviceCount: number;
};
