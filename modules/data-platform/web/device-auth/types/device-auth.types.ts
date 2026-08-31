export type DeviceCredentialView = {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
};

export type DeviceConnectionPreview =
  | {
      status: "PENDING";
      deviceName: string | null;
    }
  | {
      status: "CONNECTED";
      deviceName: string | null;
      connectedBattleTag: string | null;
    }
  | { status: "EXPIRED" }
  | { status: "INVALID" };
