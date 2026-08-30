import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";

type PrismaLike = typeof prisma;

/*
 * The one-time migration bridge for RaiderAccount rows created before
 * battleNetAccountId existed (pre add_raider_canonical_identity). This
 * is deliberately NOT a batch backfill and never runs a "match
 * everything with this battleTag" sweep - it only ever fires inline,
 * once, from inside a real OAuth callback, correlated against the
 * BattleTag that callback just independently fetched from Blizzard's
 * userinfo for the account that just authenticated (never a
 * client-supplied value - see raider-auth-callback.resolver.ts). That is
 * trustworthy evidence a batch guess would not be: Blizzard itself,
 * moments ago, confirmed this exact person currently owns this exact
 * BattleTag.
 *
 * `battleNetAccountId: null` in the WHERE scopes this to rows that have
 * never been bound - once a row has a canonical id, this function is
 * never even called for it again (RaiderAuthCallbackService's
 * resolveRaiderAuthCallback only falls back to battleTag lookup when
 * findAccountByCanonicalId already missed), so two already-bound
 * accounts can never be merged just because a BattleTag was reused after
 * a rename.
 *
 * The bind itself is a compare-and-set (updateMany with
 * battleNetAccountId: null still in the WHERE), not a blind update: two
 * concurrent callbacks for the same not-yet-bound legacy identity can
 * both reach this function, but only one UPDATE can match (the row no
 * longer satisfies battleNetAccountId: null after the first commits).
 * The loser observes count 0 and re-reads by the canonical id it was
 * trying to bind - the winner's row - rather than either retrying the
 * write or reporting failure. No duplicate row is ever created here
 * (this function only ever UPDATEs an existing row); the DB-level UNIQUE
 * constraint on battleNetAccountId is the backstop that makes the race
 * safe even if this compare-and-set were ever bypassed.
 *
 * After a row is bound once, all future logins/registrations for that
 * person resolve through battleNetAccountId only. BattleTag reverts to
 * being pure display data - renaming it never creates a new account,
 * never loses characters/settings, and never changes ownership.
 */
export async function findAndBackfillLegacyAccountByBattleTag(
  db: PrismaLike,
  battleTag: string,
  battleNetAccountId: string
) {
  const legacyAccount =
    await db.raiderAccount.findFirst({
      where: {
        battleTag,
        battleNetAccountId: null
      }
    });

  if (!legacyAccount) {
    return null;
  }

  const bound =
    await db.raiderAccount.updateMany({
      where: {
        id: legacyAccount.id,
        battleNetAccountId: null
      },
      data: {
        battleNetAccountId
      }
    });

  if (bound.count === 1) {
    return db.raiderAccount.findUnique({
      where: {
        id: legacyAccount.id
      }
    });
  }

  // Lost the race: someone else bound this row (almost certainly a
  // concurrent callback for this same identity, binding the same
  // battleNetAccountId) between our read and our write. Re-read by the
  // canonical id we were trying to bind - the authoritative source -
  // rather than trusting our stale local read.
  return db.raiderAccount.findUnique({
    where: {
      battleNetAccountId
    }
  });
}
