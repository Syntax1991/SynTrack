import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import type { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import type { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";
import type { GuildVerificationGuard } from "../verification/verification.types.js";
import { slugifyRealmName } from "./audit.realm-slug.js";
import {
  computeAuditStats,
  computeGearSlots
} from "./audit.stats.js";
import { GuildAuditRepository } from "./audit.repository.js";
import type { GuildAuditRefreshResult } from "./audit.types.js";

const refreshConcurrency = 4;

export class GuildAuditService {
  constructor(
    private readonly repository:
      GuildAuditRepository,

    private readonly battleNetClient:
      BattleNetClient,

    private readonly verification:
      GuildVerificationGuard,

    /*
     * Only authenticates the caller as a live raider session - it is
     * NOT the source of the Blizzard access token used below. Phase 0's
     * live capability test proved Character Equipment works with the
     * app's own client_credentials token, so an officer's personal
     * Battle.net OAuth token expiring must never block a guild-wide
     * audit refresh. requireSession() (unlike requireUsableAccessToken)
     * doesn't care whether the underlying Blizzard token is still
     * fresh - exactly the narrower guarantee this needs.
     */
    private readonly raiderAuth:
      RaiderSessionGuard,

    private readonly appTokenService:
      BattleNetAppTokenService
  ) {}

  async refreshAll(
    token: string
  ): Promise<GuildAuditRefreshResult> {
    await this.verification.ensureVerified();
    await this.raiderAuth.requireSession(token);

    const accessToken =
      await this.appTokenService.getAccessToken();

    const members =
      await this.repository.findAllMembers();

    const outcomes =
      await mapWithConcurrency(
        members,
        refreshConcurrency,
        async (member) => {
          try {
            const equipment =
              await this.battleNetClient.getCharacterEquipment(
                accessToken,
                slugifyRealmName(
                  member.realm
                ),
                member.name
              );

            if (!equipment) {
              return false;
            }

            await this.repository.updateAudit(
              member.id,
              computeAuditStats(
                equipment
              )
            );

            await this.repository.replaceGearSlots(
              member.id,
              computeGearSlots(
                equipment
              )
            );

            return true;
          }
          catch {
            return false;
          }
        }
      );

    const auditedMembers =
      outcomes.filter(
        (outcome) => outcome
      ).length;

    return {
      totalMembers:
        members.length,
      auditedMembers,
      skippedMembers:
        members.length -
        auditedMembers
    };
  }

  listGearSlots() {
    return this.repository.findAllGearSlots();
  }
}
