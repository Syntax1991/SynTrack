import type { BattleNetUserInfo } from "../integrations/battlenet/battlenet.types.js";

/*
 * Blizzard's OAuth userinfo response carries a stable numeric account
 * "id" (or the OIDC "sub" claim) alongside the mutable, player-chosen
 * "battletag". That id/sub is the only safe uniqueness key for a
 * SynTrack account - a BattleTag can be renamed by its owner, so it must
 * never be used to look up or bind an account. See
 * apps/api/prisma/migrations/20260830150000_add_raider_canonical_identity.
 */
export function resolveCanonicalBattleNetAccountId(
  userInfo: BattleNetUserInfo
): string | null {
  if (
    typeof userInfo.id === "number" &&
    Number.isFinite(userInfo.id)
  ) {
    return String(userInfo.id);
  }

  if (
    typeof userInfo.sub === "string" &&
    userInfo.sub.trim().length > 0
  ) {
    return userInfo.sub.trim();
  }

  return null;
}
