import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { hashSecret } from "./device-auth.crypto.js";
import type {
  DeviceCredentialRepositoryContract,
  DeviceCredentialRow
} from "./device-link-repository.types.js";

/*
 * Proves "this is an authorized SynTrack client" - not per-user data
 * isolation (SynTrack's personal data remains single-tenant; see the
 * pre-client foundation audit). A valid, non-revoked device credential
 * is the only thing this asserts.
 */
export class DeviceCredentialAuthService {
  constructor(
    private readonly repository: DeviceCredentialRepositoryContract
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

    await this.repository.touchLastSeen(
      credential.id
    );

    return credential;
  }
}
