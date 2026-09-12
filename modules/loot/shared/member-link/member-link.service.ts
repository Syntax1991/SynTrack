import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";
import { LootMemberLinkRepository } from "./member-link.repository.js";

/*
 * Phase G4B corrective: replaces GuildRaiderLinkService for Loot's
 * purposes. Loot's Wishlist and Droptimizer never needed guild-roster
 * semantics (rank, verification, teams) - only "which stable member id
 * is this signed-in raider account linked to" - so this only exposes
 * that one read. The self-service resolve/claim linking workflow that
 * used to live on GuildRaiderLinkService had zero live callers even
 * before this pass (its route was already unmounted and its frontend
 * panel already orphaned in Phase G4B) and was not carried over here;
 * re-adding self-service (re)linking is a deliberate future feature
 * decision, not something this corrective pass regressed.
 */
export class LootMemberLinkService {
  constructor(
    private readonly repository:
      LootMemberLinkRepository,

    private readonly raiderAuth:
      RaiderSessionGuard
  ) {}

  async getLinkedMember(
    token: string
  ) {
    const session =
      await this.raiderAuth.requireSession(
        token
      );

    return this.repository.findMemberByLinkedAccount(
      session.raiderAccountId
    );
  }
}
