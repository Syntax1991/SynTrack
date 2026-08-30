import { randomBytes } from "node:crypto";
import { vi } from "vitest";
import type { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import type { RaiderAuthRepository } from "./raider-auth.repository.js";
import { RaiderAuthService } from "./raider-auth.service.js";

export type FakeAccount = {
  id: string;
  battleNetAccountId: string | null;
  battleTag: string | null;
  accessToken: string | null;
  tokenType: string | null;
  scope: string | null;
  tokenExpiresAt: Date | null;
};

type FakePending = {
  id: string;
  battleNetAccountId: string;
  battleTag: string | null;
  accessToken: string;
  tokenType: string;
  scope: string | null;
  tokenExpiresAt: Date;
  charactersJson: string;
  expiresAt: Date;
};

type FakeSession = {
  id: string;
  raiderAccountId: string;
  charactersJson: string;
  expiresAt: Date;
};

/**
 * A real filtering fake keyed the same way the Prisma queries are
 * (canonical-id lookup, battleTag backfill) rather than a canned mock -
 * a bug where handleCallback created a second account for an
 * already-known identity would be caught here, not just asserted away.
 * Real DB-level uniqueness/concurrency behavior is covered separately in
 * raider-auth.repository.test.ts against a real SQLite database.
 */
export function createFakeRepository() {
  const accounts = new Map<string, FakeAccount>();
  const pending = new Map<string, FakePending>();
  const sessions = new Map<string, FakeSession>();

  let nextAccountId = 1;

  const repository = {
    findAccountByCanonicalId: vi.fn(
      async (battleNetAccountId: string) =>
        Array.from(accounts.values()).find(
          (account) =>
            account.battleNetAccountId ===
            battleNetAccountId
        ) ?? null
    ),
    findAndBackfillLegacyAccountByBattleTag:
      vi.fn(
        async (
          battleTag: string,
          battleNetAccountId: string
        ) => {
          const legacy = Array.from(
            accounts.values()
          ).find(
            (account) =>
              account.battleTag ===
                battleTag &&
              account.battleNetAccountId ===
                null
          );

          if (!legacy) {
            return null;
          }

          legacy.battleNetAccountId =
            battleNetAccountId;

          return legacy;
        }
      ),
    createAccount: vi.fn(
      async (input: {
        battleNetAccountId: string;
        battleTag: string | null;
      }) => {
        const account: FakeAccount = {
          id: `account-${nextAccountId++}`,
          battleNetAccountId:
            input.battleNetAccountId,
          battleTag: input.battleTag,
          accessToken: null,
          tokenType: null,
          scope: null,
          tokenExpiresAt: null
        };

        accounts.set(
          account.id,
          account
        );

        return account;
      }
    ),
    updateAccountToken: vi.fn(
      async (
        accountId: string,
        input: {
          battleTag: string | null;
          accessToken: string;
          tokenType: string;
          scope: string | null;
          tokenExpiresAt: Date;
        }
      ) => {
        const account =
          accounts.get(accountId);

        if (!account) {
          throw new Error(
            "Unknown account in fake repository."
          );
        }

        Object.assign(account, input);

        return account;
      }
    ),
    createPendingRegistration: vi.fn(
      async (
        input: Omit<FakePending, "id"> & {
          token: string;
        }
      ) => {
        const row: FakePending = {
          id: input.token,
          battleNetAccountId:
            input.battleNetAccountId,
          battleTag: input.battleTag,
          accessToken:
            input.accessToken,
          tokenType: input.tokenType,
          scope: input.scope,
          tokenExpiresAt:
            input.tokenExpiresAt,
          charactersJson:
            input.charactersJson,
          expiresAt: input.expiresAt
        };

        pending.set(row.id, row);

        return row;
      }
    ),
    peekPendingRegistration: vi.fn(
      async (token: string) => {
        const row = pending.get(token);

        if (
          !row ||
          row.expiresAt.getTime() <=
            Date.now()
        ) {
          return null;
        }

        return row;
      }
    ),
    consumePendingRegistration: vi.fn(
      async (token: string) => {
        const row = pending.get(token);

        if (
          !row ||
          row.expiresAt.getTime() <=
            Date.now()
        ) {
          return null;
        }

        pending.delete(token);

        return row;
      }
    ),
    createSession: vi.fn(
      async (input: {
        token: string;
        raiderAccountId: string;
        charactersJson: string;
        expiresAt: Date;
      }) => {
        const session: FakeSession = {
          id: input.token,
          raiderAccountId:
            input.raiderAccountId,
          charactersJson:
            input.charactersJson,
          expiresAt: input.expiresAt
        };

        sessions.set(
          session.id,
          session
        );

        return session;
      }
    ),
    findValidSession: vi.fn(
      async (token: string) => {
        const session =
          sessions.get(token);

        if (
          !session ||
          session.expiresAt.getTime() <=
            Date.now()
        ) {
          return null;
        }

        return {
          ...session,
          account: accounts.get(
            session.raiderAccountId
          )
        };
      }
    ),
    deleteSession: vi.fn(
      async (token: string) => {
        sessions.delete(token);
      }
    )
  } as unknown as RaiderAuthRepository;

  return { repository, accounts, pending, sessions };
}

export function createService(
  userInfo: {
    id?: number;
    sub?: string;
    battletag?: string;
  } = {
    id: 4200001,
    battletag: "Demo#1234"
  }
) {
  const { repository, accounts, pending, sessions } =
    createFakeRepository();

  let capturedIntent:
    | "login"
    | "register"
    | null = null;

  let capturedReturnTo:
    | string
    | null = null;

  const battleNetRepository = {
    createOAuthState: vi.fn(
      async (
        _state: string,
        _expiresAt: Date,
        intent: "login" | "register",
        returnTo: string | null
      ) => {
        capturedIntent = intent;
        capturedReturnTo = returnTo;
      }
    ),
    consumeOAuthState: vi.fn(
      async () => ({
        intent: capturedIntent ?? "login",
        returnTo: capturedReturnTo
      })
    )
  } as unknown as BattleNetRepository;

  const battleNetClient = {
    createAuthorizationUrl: vi.fn(
      () => "https://oauth.battle.net/authorize"
    ),
    exchangeAuthorizationCode: vi.fn(
      async () => ({
        access_token: `fresh-token-${randomBytes(4).toString("hex")}`,
        token_type: "bearer",
        scope: "openid wow.profile",
        expires_in: 86400
      })
    ),
    getUserInfo: vi.fn(
      async () => userInfo
    ),
    getAccountProfile: vi.fn(
      async () => ({
        wow_accounts: []
      })
    )
  } as unknown as BattleNetClient;

  const service = new RaiderAuthService(
    repository,
    battleNetRepository,
    battleNetClient
  );

  return {
    service,
    repository,
    battleNetRepository,
    battleNetClient,
    accounts,
    pending,
    sessions
  };
}

export async function connectAndCallback(
  service: RaiderAuthService,
  intent: "login" | "register",
  returnTo: string | null = null
) {
  await service.createAuthorizationUrl(
    intent,
    returnTo
  );

  return service.handleCallback(
    "auth-code",
    "state-value"
  );
}
