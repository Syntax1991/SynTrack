import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  generateDeviceCode,
  generateDeviceToken,
  generateUserCode,
  hashSecret
} from "./device-auth.crypto.js";
import type {
  DeviceCredentialRepositoryContract,
  DeviceLinkRepositoryContract,
  DeviceLinkRequestRow
} from "./device-link-repository.types.js";
import type {
  DeviceCredentialView,
  DeviceLinkCreateResult,
  DeviceLinkStatusResult
} from "./device-auth.types.js";

const linkLifetimeMilliseconds =
  10 * 60 * 1000;

function toView(row: {
  id: string;
  name: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
}): DeviceCredentialView {
  return {
    id: row.id,
    name: row.name,
    createdAt:
      row.createdAt.toISOString(),
    lastSeenAt:
      row.lastSeenAt?.toISOString() ??
      null,
    revokedAt:
      row.revokedAt?.toISOString() ??
      null
  };
}

/*
 * The desktop-client device-authorization flow. userCode (short,
 * human-facing) and deviceCode (high-entropy, client-only) are
 * deliberately separate secrets - a leaked/observed userCode alone can
 * never be used to poll status or receive a credential. The DB never
 * stores either raw deviceCode or the final device credential, only
 * their SHA-256 hashes.
 */
export class DeviceLinkService {
  constructor(
    private readonly linkRepository: DeviceLinkRepositoryContract,
    private readonly credentialRepository: DeviceCredentialRepositoryContract,
    private readonly requireRaiderSession: (
      token: string
    ) => Promise<unknown>
  ) {}

  async createLink(
    clientName: string | null
  ): Promise<DeviceLinkCreateResult> {
    const userCode = generateUserCode();
    const deviceCode =
      generateDeviceCode();

    const expiresAt = new Date(
      Date.now() +
        linkLifetimeMilliseconds
    );

    await this.linkRepository.create({
      userCode,
      deviceCodeHash: hashSecret(
        deviceCode
      ),
      clientName,
      expiresAt
    });

    return {
      userCode,
      deviceCode,
      expiresAt:
        expiresAt.toISOString()
    };
  }

  /*
   * Backend-authenticated on purpose - the web Settings UI being gated
   * by RequireRaiderSession is presentation only. This call re-verifies
   * the raider session server-side before ever touching PENDING ->
   * APPROVED, so approval cannot be forged by calling the endpoint
   * directly without a valid session.
   */
  async approve(
    userCode: string,
    raiderSessionToken: string
  ): Promise<void> {
    await this.requireRaiderSession(
      raiderSessionToken
    );

    const link =
      await this.linkRepository.findByUserCode(
        userCode
      );

    if (!link) {
      throw new AppError(
        404,
        "Device link request not found."
      );
    }

    if (this.isExpired(link)) {
      await this.expireIfNeeded(link);

      throw new AppError(
        410,
        "This device link request has expired."
      );
    }

    if (link.status !== "PENDING") {
      throw new AppError(
        409,
        "This device link request is no longer pending."
      );
    }

    await this.linkRepository.markApproved(
      link.id
    );
  }

  /*
   * Polling is keyed ONLY by the high-entropy deviceCode - the short
   * userCode is never accepted here. The final device credential is
   * generated and returned exactly once, on the first poll that
   * observes APPROVED, inside one transaction that also marks the
   * link CONSUMED - a second poll can never recover it.
   */
  async pollStatus(
    deviceCode: string
  ): Promise<DeviceLinkStatusResult> {
    const link =
      await this.linkRepository.findByDeviceCodeHash(
        hashSecret(deviceCode)
      );

    if (!link) {
      throw new AppError(
        404,
        "Device link request not found."
      );
    }

    if (
      this.isExpired(link) &&
      link.status !== "CONSUMED"
    ) {
      await this.expireIfNeeded(link);

      return { status: "EXPIRED" };
    }

    if (link.status === "PENDING") {
      return { status: "PENDING" };
    }

    if (link.status === "CONSUMED") {
      return { status: "CONSUMED" };
    }

    if (link.status === "APPROVED") {
      const rawToken =
        generateDeviceToken();

      await this.linkRepository.consumeAndIssueCredential(
        link.id,
        {
          name:
            link.clientName ??
            "SynTrack Client",
          tokenHash: hashSecret(
            rawToken
          )
        }
      );

      return {
        status: "CONSUMED",
        credential: rawToken
      };
    }

    return { status: "EXPIRED" };
  }

  async listDevices(
    raiderSessionToken: string
  ): Promise<DeviceCredentialView[]> {
    await this.requireRaiderSession(
      raiderSessionToken
    );

    const rows =
      await this.credentialRepository.findAll();

    return rows.map(toView);
  }

  async revokeDevice(
    id: string,
    raiderSessionToken: string
  ): Promise<DeviceCredentialView> {
    await this.requireRaiderSession(
      raiderSessionToken
    );

    const revoked =
      await this.credentialRepository.revoke(
        id
      );

    return toView(revoked);
  }

  private isExpired(
    link: DeviceLinkRequestRow
  ): boolean {
    return (
      link.expiresAt.getTime() <=
      Date.now()
    );
  }

  private async expireIfNeeded(
    link: DeviceLinkRequestRow
  ): Promise<void> {
    if (link.status !== "EXPIRED") {
      await this.linkRepository.markExpired(
        link.id
      );
    }
  }
}
