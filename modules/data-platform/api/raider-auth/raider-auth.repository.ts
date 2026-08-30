import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { findAndBackfillLegacyAccountByBattleTag as backfillLegacyAccountByBattleTag } from "./raider-auth.legacy-backfill.js";

type PrismaLike = typeof prisma;

const uniqueConstraintErrorCode =
  "P2025";

const prismaUniqueViolationCode =
  "P2002";

function isUniqueConstraintViolation(
  error: unknown
): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string })
        .code ===
        prismaUniqueViolationCode
  );
}

function isRecordNotFound(
  error: unknown
): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string })
        .code ===
        uniqueConstraintErrorCode
  );
}

export class RaiderAuthRepository {
  /*
   * Accepts an injected Prisma client (defaulting to the app singleton)
   * so tests can point it at a real, isolated SQLite database - the
   * unique-constraint/concurrency guarantees below only mean something
   * when proven against the actual DB engine, not an in-memory fake.
   */
  constructor(
    private readonly db: PrismaLike = prisma
  ) {}

  findAccountByCanonicalId(
    battleNetAccountId: string
  ) {
    return this.db.raiderAccount.findUnique({
      where: {
        battleNetAccountId
      }
    });
  }

  /*
   * See raider-auth.legacy-backfill.ts for the full rationale (why this
   * is safe, why it never merges two already-bound accounts, and why the
   * concurrent-callback race can't create a duplicate).
   */
  findAndBackfillLegacyAccountByBattleTag(
    battleTag: string,
    battleNetAccountId: string
  ) {
    return backfillLegacyAccountByBattleTag(
      this.db,
      battleTag,
      battleNetAccountId
    );
  }

  /*
   * Concurrency-safe by construction: relies on the DB-level UNIQUE
   * constraint on battleNetAccountId (see the add_raider_canonical_identity
   * migration) rather than an existence check racing a later insert. If
   * two callers race to create the same canonical identity, exactly one
   * INSERT wins and the other observes a unique-constraint violation and
   * re-reads the winner's row instead of erroring or duplicating.
   */
  async createAccount(input: {
    battleNetAccountId: string;
    battleTag: string | null;
  }) {
    try {
      return await this.db.raiderAccount.create({
        data: input
      });
    }
    catch (error) {
      if (
        isUniqueConstraintViolation(
          error
        )
      ) {
        const existing =
          await this.findAccountByCanonicalId(
            input.battleNetAccountId
          );

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  updateAccountToken(
    accountId: string,
    input: {
      battleTag: string | null;
      accessToken: string;
      tokenType: string;
      scope: string | null;
      tokenExpiresAt: Date;
    }
  ) {
    return this.db.raiderAccount.update({
      where: {
        id: accountId
      },
      data: {
        battleTag:
          input.battleTag,
        accessToken:
          input.accessToken,
        tokenType:
          input.tokenType,
        scope: input.scope,
        tokenExpiresAt:
          input.tokenExpiresAt
      }
    });
  }

  async createPendingRegistration(input: {
    token: string;
    battleNetAccountId: string;
    battleTag: string | null;
    accessToken: string;
    tokenType: string;
    scope: string | null;
    tokenExpiresAt: Date;
    charactersJson: string;
    expiresAt: Date;
  }) {
    await this.db.raiderPendingRegistration.deleteMany(
      {
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      }
    );

    return this.db.raiderPendingRegistration.create(
      {
        data: {
          id: input.token,
          battleNetAccountId:
            input.battleNetAccountId,
          battleTag:
            input.battleTag,
          accessToken:
            input.accessToken,
          tokenType:
            input.tokenType,
          scope: input.scope,
          tokenExpiresAt:
            input.tokenExpiresAt,
          charactersJson:
            input.charactersJson,
          expiresAt:
            input.expiresAt
        }
      }
    );
  }

  /*
   * Read-only peek used by GET /register/pending so the confirmation
   * page can show the authenticated BattleTag before the user commits -
   * this never deletes the row, only consumePendingRegistration does.
   */
  async peekPendingRegistration(
    token: string
  ) {
    const pending =
      await this.db.raiderPendingRegistration.findUnique(
        {
          where: {
            id: token
          }
        }
      );

    if (
      !pending ||
      pending.expiresAt.getTime() <=
        Date.now()
    ) {
      return null;
    }

    return pending;
  }

  /*
   * Single-use: deletes the row as part of consuming it, so a second
   * confirm attempt with the same pendingToken (double-click, replay)
   * always observes "not found" rather than creating a second account.
   */
  async consumePendingRegistration(
    token: string
  ) {
    const pending =
      await this.peekPendingRegistration(
        token
      );

    if (!pending) {
      return null;
    }

    try {
      await this.db.raiderPendingRegistration.delete(
        {
          where: {
            id: token
          }
        }
      );
    }
    catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }

      throw error;
    }

    return pending;
  }

  createSession(input: {
    token: string;
    raiderAccountId: string;
    charactersJson: string;
    expiresAt: Date;
  }) {
    return this.db.raiderSession.create({
      data: {
        id: input.token,
        raiderAccountId:
          input.raiderAccountId,
        charactersJson:
          input.charactersJson,
        expiresAt: input.expiresAt
      }
    });
  }

  findValidSession(
    token: string
  ) {
    return this.db.raiderSession.findFirst({
      where: {
        id: token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        account: true
      }
    });
  }

  deleteSession(
    token: string
  ) {
    return this.db.raiderSession.deleteMany({
      where: {
        id: token
      }
    });
  }
}
