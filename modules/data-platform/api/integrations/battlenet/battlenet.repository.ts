import { prisma } from "../../../../../apps/api/src/infrastructure/database/prismaClient.js";

type PrismaLike = typeof prisma;

export type OAuthStateIntent = "login" | "register";

export type ConsumedOAuthState = {
  intent: OAuthStateIntent;
  returnTo: string | null;
  deviceLinkRequestId: string | null;
};

function toIntent(
  value: string
): OAuthStateIntent {
  return value === "register"
    ? "register"
    : "login";
}

/*
 * Opaque correlation label for the OAuth-state diagnostics below - never
 * the full state value (that's a bearer-style secret for the 10-minute
 * OAuth window) and never any token/credential. Just enough of a fixed
 * prefix to match a "created" log line to its later "consumed" line in
 * server output while debugging a state-lifecycle issue.
 */
function correlationLabel(
  state: string
): string {
  return state.slice(0, 8);
}

export class BattleNetRepository {
  /*
   * Accepts an injected Prisma client (defaulting to the app singleton),
   * mirroring RaiderAuthRepository - so tests can point the OAuth-state
   * lifecycle at a real, isolated SQLite database instead of the app's
   * dev.db, the same way raider-auth.repository.test.ts already does for
   * account creation. See battlenet.repository.test.ts.
   */
  constructor(
    private readonly db: PrismaLike = prisma
  ) {}

  async createOAuthState(
    state: string,
    expiresAt: Date,
    intent: OAuthStateIntent = "login",
    returnTo: string | null = null,
    deviceLinkRequestId: string | null = null
  ) {
    await this.db.battleNetOAuthState.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    const created =
      await this.db.battleNetOAuthState.create({
        data: {
          id: state,
          intent,
          returnTo,
          deviceLinkRequestId,
          expiresAt
        }
      });

    console.info(
      `[raider-auth] oauth-state created state=${correlationLabel(state)}… intent=${intent} expiresAt=${expiresAt.toISOString()}`
    );

    return created;
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
    const label =
      correlationLabel(state);

    const storedState =
      await this.db.battleNetOAuthState.findUnique({
        where: {
          id: state
        }
      });

    if (!storedState) {
      console.warn(
        `[raider-auth] oauth-state consume MISS state=${label}… (no matching row - never created here, already consumed, expired-and-swept by a later createOAuthState call, or this callback is hitting a different backend process/DB file than the one that created it)`
      );

      return null;
    }

    await this.db.battleNetOAuthState.deleteMany({
      where: {
        id: state
      }
    });

    if (
      storedState.expiresAt.getTime() <=
      Date.now()
    ) {
      console.warn(
        `[raider-auth] oauth-state consume EXPIRED state=${label}… expiresAt=${storedState.expiresAt.toISOString()} now=${new Date().toISOString()}`
      );

      return null;
    }

    console.info(
      `[raider-auth] oauth-state consume OK state=${label}… intent=${storedState.intent}`
    );

    return {
      intent: toIntent(
        storedState.intent
      ),
      returnTo:
        storedState.returnTo,
      deviceLinkRequestId:
        storedState.deviceLinkRequestId
    };
  }
}
