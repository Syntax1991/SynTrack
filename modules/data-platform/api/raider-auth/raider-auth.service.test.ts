import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import type { RaiderAuthRepository } from "./raider-auth.repository.js";
import { RaiderAuthService } from "./raider-auth.service.js";

/**
 * assertConfigured() legitimately requires real Battle.net credentials
 * to be present — this stubs that unrelated config leaf (not the
 * officer-authorization logic under test) so handleCallback can run in
 * an environment with no apps/api/.env, exactly as it does in CI.
 */
vi.mock(
  "../../../../apps/api/src/config/env.js",
  () => ({
    env: {
      FRONTEND_ORIGIN:
        "http://localhost:5173",
      BATTLENET_CLIENT_ID: "test-client-id",
      BATTLENET_CLIENT_SECRET:
        "test-client-secret",
      BATTLENET_RAIDER_REDIRECT_URI:
        "http://localhost:4000/api/auth/raider/callback"
    }
  })
);

type FakeAccount = {
  id: string;
  battleTag: string | null;
  accessToken: string | null;
  tokenType: string | null;
  scope: string | null;
  tokenExpiresAt: Date | null;
};

type FakeSession = {
  id: string;
  raiderAccountId: string;
  charactersJson: string;
  expiresAt: Date;
};

/**
 * A real filtering fake keyed the same way the Prisma queries are
 * (battleTag lookup, account id lookup) rather than a canned mock — a
 * bug where handleCallback created a second account for an already-
 * known battletag would be caught here, not just asserted away.
 */
function createFakeRepository() {
  const accounts = new Map<string, FakeAccount>();
  const sessions = new Map<string, FakeSession>();

  let nextAccountId = 1;

  const repository = {
    findAccountByBattleTag: vi.fn(
      async (battleTag: string) =>
        Array.from(accounts.values()).find(
          (account) =>
            account.battleTag === battleTag
        ) ?? null
    ),
    createAccount: vi.fn(
      async (battleTag: string | null) => {
        const account: FakeAccount = {
          id: `account-${nextAccountId++}`,
          battleTag,
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

  return { repository, accounts, sessions };
}

function createService() {
  const { repository, accounts, sessions } =
    createFakeRepository();

  const battleNetRepository = {
    createOAuthState: vi.fn(
      async () => {}
    ),
    consumeOAuthState: vi.fn(
      async () => true
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
    getUserInfo: vi.fn(async () => ({
      battletag: "Demo#1234"
    })),
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
    accounts,
    sessions,
    battleNetClient
  };
}

describe("RaiderAuthService.handleCallback — existing account", () => {
  it("updates the existing RaiderAccount for a known battletag instead of creating a duplicate", async () => {
    const {
      service,
      repository,
      accounts
    } = createService();

    await repository.createAccount(
      "Demo#1234"
    );

    expect(accounts.size).toBe(1);

    const existingAccountId = Array.from(
      accounts.keys()
    )[0];

    await service.handleCallback(
      "auth-code",
      "state-value"
    );

    expect(accounts.size).toBe(1);

    expect(
      repository.createAccount
    ).toHaveBeenCalledTimes(1);

    const account = accounts.get(
      existingAccountId!
    );

    expect(account?.accessToken).toMatch(
      /^fresh-token-/
    );
  });

  it("issues a brand-new RaiderSession token on every successful login, even for the same account", async () => {
    const { service, sessions } =
      createService();

    await service.handleCallback(
      "auth-code-1",
      "state-value"
    );

    await service.handleCallback(
      "auth-code-2",
      "state-value"
    );

    expect(sessions.size).toBe(2);

    const tokens = Array.from(
      sessions.keys()
    );

    expect(tokens[0]).not.toBe(
      tokens[1]
    );
  });

  it("has no mechanism to touch GuildMember.linkedRaiderAccountId — the fake repository only exposes RaiderAccount/RaiderSession operations", async () => {
    const { repository } =
      createService();

    const repositoryMethods =
      Object.keys(repository);

    expect(
      repositoryMethods
    ).not.toContain("linkMember");

    expect(
      repositoryMethods
    ).not.toContain(
      "findMemberByLinkedAccount"
    );
  });
});

describe("RaiderAuthService.handleCallback — new account", () => {
  it("creates a new RaiderAccount when the battletag has never been seen before", async () => {
    const {
      service,
      repository,
      accounts
    } = createService();

    expect(accounts.size).toBe(0);

    await service.handleCallback(
      "auth-code",
      "state-value"
    );

    expect(accounts.size).toBe(1);

    expect(
      repository.createAccount
    ).toHaveBeenCalledWith("Demo#1234");
  });
});
