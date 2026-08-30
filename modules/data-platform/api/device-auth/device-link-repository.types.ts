import type { DeviceLinkStatus } from "./device-auth.types.js";

export type DeviceLinkRequestRow = {
  id: string;
  userCode: string;
  deviceCodeHash: string;
  status: DeviceLinkStatus;
  clientName: string | null;
  raiderAccountId: string | null;
  expiresAt: Date;
  approvedAt: Date | null;
  consumedAt: Date | null;
  createdAt: Date;
};

export type DeviceCredentialRow = {
  id: string;
  name: string;
  tokenHash: string;
  linkRequestId: string | null;
  raiderAccountId: string | null;
  createdAt: Date;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
};

export interface DeviceLinkRepositoryContract {
  create(input: {
    userCode: string;
    deviceCodeHash: string;
    clientName: string | null;
    expiresAt: Date;
  }): Promise<DeviceLinkRequestRow>;

  findByUserCode(
    userCode: string
  ): Promise<DeviceLinkRequestRow | null>;

  findByDeviceCodeHash(
    deviceCodeHash: string
  ): Promise<DeviceLinkRequestRow | null>;

  markApproved(
    id: string,
    raiderAccountId: string | null
  ): Promise<DeviceLinkRequestRow>;

  markExpired(
    id: string
  ): Promise<DeviceLinkRequestRow>;

  /*
   * The one transactional step that both consumes the link request and
   * creates the credential - the two must never happen independently,
   * or a race could issue two credentials for one approved link.
   */
  consumeAndIssueCredential(
    linkRequestId: string,
    credential: {
      name: string;
      tokenHash: string;
      raiderAccountId: string | null;
    }
  ): Promise<DeviceCredentialRow>;
}

export interface DeviceCredentialRepositoryContract {
  findByTokenHash(
    tokenHash: string
  ): Promise<DeviceCredentialRow | null>;

  touchLastSeen(
    id: string
  ): Promise<void>;

  findAll(): Promise<
    DeviceCredentialRow[]
  >;

  revoke(
    id: string
  ): Promise<DeviceCredentialRow>;
}
