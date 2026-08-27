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
