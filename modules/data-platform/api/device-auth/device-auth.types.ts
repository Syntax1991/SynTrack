export type DeviceLinkStatus =
  | "PENDING"
  | "APPROVED"
  | "CONSUMED"
  | "EXPIRED";

export type DeviceLinkCreateResult = {
  userCode: string;
  deviceCode: string;
  expiresAt: string;
};

export type DeviceLinkStatusResult =
  | { status: "PENDING" | "EXPIRED" }
  | { status: "APPROVED" }
  | {
      status: "CONSUMED";
      /*
       * Present only on the exact response that issues it - never
       * retrievable again afterward (see DeviceLinkService.pollStatus).
       */
      credential?: string;
    };

export type DeviceCredentialView = {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
};

/*
 * Desktop-facing result for the codeless flow's START call
 * (DeviceLinkService.createConnection). pollToken is the client-only
 * polling capability (deviceCode under the hood) - never placed in
 * browserUrl, and never derivable from it.
 */
export type DeviceConnectionStartResult = {
  browserUrl: string;
  pollToken: string;
  expiresAt: string;
};

/*
 * Web-facing (browser) view of a pending/completed codeless connection -
 * deliberately never includes deviceCode, pollToken or the final
 * DeviceCredential. "CANCELLED" is reserved in the contract (distinct
 * desktop-facing states per the product spec) but is not reachable in
 * this milestone - there is no user-facing cancel action yet.
 */
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
