import type { RaiderSessionGuard } from "../raider-auth/raider-auth.types.js";
import { buildSettingsTrustSnapshot } from "./settings-trust.mapper.js";
import type { SettingsTrustRepository } from "./settings-trust.repository.js";
import type { SettingsTrustSnapshot } from "./settings-trust.types.js";

export class SettingsTrustService {
  constructor(
    private readonly repository: SettingsTrustRepository,
    private readonly raiderAuth: RaiderSessionGuard
  ) {}

  async getSnapshot(
    sessionToken: string
  ): Promise<SettingsTrustSnapshot> {
    const session =
      await this.raiderAuth.requireSession(
        sessionToken
      );

    const account =
      await this.repository.findAccount(
        session.raiderAccountId
      );

    if (!account) {
      throw new Error(
        "SynTrack account not found."
      );
    }

    const [
      synTrackRosterCount,
      desktopSync,
      coreDataReceived,
      professionDataReceived
    ] = await Promise.all([
      this.repository.countSynTrackRoster(
        session.raiderAccountId
      ),
      this.repository.findDesktopSyncEvidence(
        session.raiderAccountId
      ),
      this.repository.hasCoreAddonData(
        session.raiderAccountId
      ),
      this.repository.hasProfessionAddonData(
        session.raiderAccountId
      )
    ]);

    return buildSettingsTrustSnapshot({
      account,
      synTrackRosterCount,
      desktopSync,
      coreDataReceived,
      professionDataReceived,
      discoveredCharacterCount:
        session.characters.length
    });
  }
}
