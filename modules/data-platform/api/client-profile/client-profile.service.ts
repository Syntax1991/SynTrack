import type { DeviceCredentialRow } from "../device-auth/device-link-repository.types.js";
import type { ClientProfileResult } from "./client-profile.types.js";

/*
 * The device credential is the only authenticator. A credential issued
 * before DeviceCredential.raiderAccountId existed is valid for transport
 * auth but must NOT be treated as a healthy connected identity - the
 * client surfaces legacy_reconnect_required instead of fabricating an
 * owner.
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
      return {
        identityStatus:
          "legacy_reconnect_required",
        battleTag: null
      };
    }

    const battleTag =
      await this.findBattleTagByAccountId(
        credential.raiderAccountId
      );

    return {
      identityStatus: "connected",
      battleTag
    };
  }
}
