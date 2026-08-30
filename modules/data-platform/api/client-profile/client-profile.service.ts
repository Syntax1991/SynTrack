import type { DeviceCredentialRow } from "../device-auth/device-link-repository.types.js";
import type { ClientProfileResult } from "./client-profile.types.js";

/*
 * The device credential is the only thing that authenticates this call
 * (see DeviceCredentialAuthService.requireValidCredential, injected here
 * rather than imported directly so this stays testable with a fake). A
 * credential issued before DeviceCredential.raiderAccountId existed
 * simply has no identity to show - that is not an error, the client just
 * omits the "Connected as" line.
 */
export class ClientProfileService {
  constructor(
    private readonly requireValidCredential: (
      rawToken: string
    ) => Promise<DeviceCredentialRow>,
    private readonly findBattleTagByAccountId: (
      raiderAccountId: string
    ) => Promise<string | null>
  ) {}

  async getProfileForDeviceToken(
    rawToken: string
  ): Promise<ClientProfileResult> {
    const credential =
      await this.requireValidCredential(
        rawToken
      );

    if (!credential.raiderAccountId) {
      return { battleTag: null };
    }

    const battleTag =
      await this.findBattleTagByAccountId(
        credential.raiderAccountId
      );

    return { battleTag };
  }
}
