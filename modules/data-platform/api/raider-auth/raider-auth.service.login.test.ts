import { describe, expect, it, vi } from "vitest";
import {
  connectAndCallback,
  createService
} from "./raider-auth.test-support.js";

/**
 * assertConfigured() legitimately requires real Battle.net credentials
 * to be present — this stubs that unrelated config leaf (not the
 * authentication logic under test) so handleCallback can run in an
 * environment with no apps/api/.env, exactly as it does in CI.
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

describe("RaiderAuthService — login with an existing account", () => {
  it("authenticates and issues a session when the canonical Battle.net identity is already registered", async () => {
    const { service, repository, accounts } =
      createService();

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234"
    });

    expect(accounts.size).toBe(1);

    const result = await connectAndCallback(
      service,
      "login"
    );

    expect(result.outcome).toBe(
      "login-success"
    );

    expect(accounts.size).toBe(1);

    expect(
      repository.createAccount
    ).toHaveBeenCalledTimes(1);
  });

  it("issues a brand-new session token on every successful login, even for the same account", async () => {
    const { service, repository } =
      createService();

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234"
    });

    const first = await connectAndCallback(
      service,
      "login"
    );

    const second = await connectAndCallback(
      service,
      "login"
    );

    expect(first.outcome).toBe(
      "login-success"
    );

    expect(second.outcome).toBe(
      "login-success"
    );

    if (
      first.outcome ===
        "login-success" &&
      second.outcome === "login-success"
    ) {
      expect(first.token).not.toBe(
        second.token
      );
    }
  });

  it("restores the requested returnTo destination on the login-success outcome", async () => {
    const { service, repository } =
      createService();

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234"
    });

    const result = await connectAndCallback(
      service,
      "login",
      "/characters"
    );

    expect(result.outcome).toBe(
      "login-success"
    );

    if (result.outcome === "login-success") {
      expect(result.returnTo).toBe(
        "/characters"
      );
    }
  });

  it("backfills a legacy account (created before battleNetAccountId existed) by correlating the BattleTag of THIS authenticated login, not a batch guess", async () => {
    const { service, repository, accounts } =
      createService();

    // Simulate a pre-migration row: has a battleTag, no canonical id.
    const legacy =
      await repository.createAccount({
        battleNetAccountId:
          "placeholder-never-matches",
        battleTag: "Demo#1234"
      });

    // Force it back to the pre-migration shape.
    (
      accounts.get(legacy.id)!
    ).battleNetAccountId = null;

    const result = await connectAndCallback(
      service,
      "login"
    );

    expect(result.outcome).toBe(
      "login-success"
    );

    expect(accounts.size).toBe(1);

    expect(
      accounts.get(legacy.id)!
        .battleNetAccountId
    ).toBe("4200001");
  });

  it("after a legacy account is bound on its first post-migration login, a second login resolves via battleNetAccountId only - the BattleTag fallback is never consulted again", async () => {
    const { service, repository, accounts } =
      createService();

    const legacy =
      await repository.createAccount({
        battleNetAccountId:
          "placeholder-never-matches",
        battleTag: "Demo#1234"
      });

    (
      accounts.get(legacy.id)!
    ).battleNetAccountId = null;

    const first = await connectAndCallback(
      service,
      "login"
    );

    expect(first.outcome).toBe(
      "login-success"
    );

    expect(
      accounts.get(legacy.id)!
        .battleNetAccountId
    ).toBe("4200001");

    expect(
      repository.findAndBackfillLegacyAccountByBattleTag
    ).toHaveBeenCalledTimes(1);

    const second = await connectAndCallback(
      service,
      "login"
    );

    expect(second.outcome).toBe(
      "login-success"
    );

    // Still exactly one account - and the BattleTag fallback was never
    // reached a second time, because findAccountByCanonicalId alone
    // satisfied the second lookup once the row was bound.
    expect(accounts.size).toBe(1);

    expect(
      repository.findAndBackfillLegacyAccountByBattleTag
    ).toHaveBeenCalledTimes(1);
  });

  it("a BattleTag rename does not create a new account, change ownership, or lose the RaiderAccount id - only the synced display field changes", async () => {
    const userInfo = {
      id: 4200001,
      battletag: "OldTag#1111"
    };

    const { service, repository, accounts } =
      createService(userInfo);

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "OldTag#1111"
    });

    const accountId = Array.from(
      accounts.keys()
    )[0]!;

    const first = await connectAndCallback(
      service,
      "login"
    );

    expect(first.outcome).toBe(
      "login-success"
    );

    // Blizzard reports a renamed BattleTag on the next login.
    userInfo.battletag = "NewTag#2222";

    const second = await connectAndCallback(
      service,
      "login"
    );

    expect(second.outcome).toBe(
      "login-success"
    );

    // Same account id (ownership unchanged), still exactly one row (no
    // new account created), display field updated to the new tag.
    expect(accounts.size).toBe(1);

    expect(
      Array.from(accounts.keys())[0]
    ).toBe(accountId);

    expect(
      accounts.get(accountId)!.battleTag
    ).toBe("NewTag#2222");
  });
});

describe("RaiderAuthService — login with no matching account", () => {
  it("does NOT auto-register: an unknown Battle.net identity gets login-unknown-account, no RaiderAccount is created", async () => {
    const { service, repository, accounts } =
      createService();

    const result = await connectAndCallback(
      service,
      "login"
    );

    expect(result.outcome).toBe(
      "login-unknown-account"
    );

    expect(accounts.size).toBe(0);

    expect(
      repository.createAccount
    ).not.toHaveBeenCalled();
  });
});

describe("RaiderAuthService — session lifecycle", () => {
  it("logout clears the session so it can no longer be used", async () => {
    const { service, repository } =
      createService();

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234"
    });

    const result = await connectAndCallback(
      service,
      "login"
    );

    if (result.outcome !== "login-success") {
      throw new Error("unreachable");
    }

    await service.requireSession(
      result.token
    );

    await service.logout(result.token);

    await expect(
      service.requireSession(result.token)
    ).rejects.toThrow();
  });
});
