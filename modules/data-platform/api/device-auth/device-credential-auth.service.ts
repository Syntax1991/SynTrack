import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { assertActiveRaiderAccount } from "../raider-auth/raider-auth.account-access.js";
import { hashSecret } from "./device-auth.crypto.js";
import type {
  DeviceCredentialRepositoryContract,
  DeviceCredentialRow
} from "./device-link-repository.types.js";

export type DeviceOwnerStatusLookup = (
  raiderAccountId: string
) => Promise<string | null>;

/*
 * Proves "this is an authorized SynTrack client" - not per-user data
 * isolation. A valid, non-revoked credential is required. If it is bound
 * to a RaiderAccount, that account must be ACTIVE.
 */
export class DeviceCredentialAuthService {
  constructor(
    private readonly repository: DeviceCredentialRepositoryContract,
    private readonly getOwnerStatus: DeviceOwnerStatusLookup = async () =>
      "ACTIVE"
  ) {}

  async requireValidCredential(
    rawToken: string
  ): Promise<DeviceCredentialRow> {
    const credential =
      await this.repository.findByTokenHash(
        hashSecret(rawToken)
      );

    if (!credential) {
      throw new AppError(
        401,
        "Invalid device credential."
      );
    }

    if (credential.revokedAt) {
      throw new AppError(
        401,
        "This device has been disconnected."
      );
    }

    if (credential.raiderAccountId) {
      assertActiveRaiderAccount(
        await this.getOwnerStatus(
          credential.raiderAccountId
        )
      );
    }

    await this.repository.touchLastSeen(
      credential.id
    );

    return credential;
  }
}
