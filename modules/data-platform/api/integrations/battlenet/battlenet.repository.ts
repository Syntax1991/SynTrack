import { prisma } from "../../../../../apps/api/src/infrastructure/database/prismaClient.js";

export type OAuthStateIntent = "login" | "register";

export type ConsumedOAuthState = {
  intent: OAuthStateIntent;
  returnTo: string | null;
};

function toIntent(
  value: string
): OAuthStateIntent {
  return value === "register"
    ? "register"
    : "login";
}

export class BattleNetRepository {
  async createOAuthState(
    state: string,
    expiresAt: Date,
    intent: OAuthStateIntent = "login",
    returnTo: string | null = null
  ) {
    await prisma.battleNetOAuthState.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return prisma.battleNetOAuthState.create({
      data: {
        id: state,
        intent,
        returnTo,
        expiresAt
      }
    });
  }

  /*
   * Single-use by design: the state row is looked up and immediately
   * deleted here, so a replayed/reused `state` value can never be
   * consumed twice. The intent (login vs register) and returnTo were
   * recorded server-side when /connect issued this state - the OAuth
   * callback has no other trustworthy source for either, since the
   * callback URL itself is fixed by Blizzard's registered redirect URI
   * and carries no client-controlled parameters of its own.
   */
  async consumeOAuthState(
    state: string
  ): Promise<ConsumedOAuthState | null> {
    const storedState =
      await prisma.battleNetOAuthState.findUnique({
        where: {
          id: state
        }
      });

    if (!storedState) {
      return null;
    }

    await prisma.battleNetOAuthState.deleteMany({
      where: {
        id: state
      }
    });

    if (
      storedState.expiresAt.getTime() <=
      Date.now()
    ) {
      return null;
    }

    return {
      intent: toIntent(
        storedState.intent
      ),
      returnTo:
        storedState.returnTo
    };
  }
}
