import { describe, expect, it, vi } from "vitest";
import {
  connectAndCallback,
  createService
} from "./raider-auth.test-support.js";

/**
 * assertConfigured() legitimately requires real Battle.net credentials
 * to be present — this stubs that unrelated config leaf (not the
 * registration logic under test) so handleCallback can run in an
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

describe("RaiderAuthService — explicit registration", () => {
  it("does NOT create an account as a side effect of OAuth success alone - it returns a pending outcome instead", async () => {
    const { service, repository, accounts } =
      createService();

    const result = await connectAndCallback(
      service,
      "register"
    );

    expect(result.outcome).toBe(
      "register-pending"
    );

    expect(accounts.size).toBe(0);

    expect(
      repository.createAccount
    ).not.toHaveBeenCalled();
  });

  it("only creates the RaiderAccount once confirmRegistration is explicitly called", async () => {
    const { service, accounts } =
      createService();

    const result = await connectAndCallback(
      service,
      "register"
    );

    expect(result.outcome).toBe(
      "register-pending"
    );

    if (
      result.outcome !==
      "register-pending"
    ) {
      throw new Error("unreachable");
    }

    expect(accounts.size).toBe(0);

    const confirmed =
      await service.confirmRegistration(
        result.pendingToken
      );

    expect(accounts.size).toBe(1);

    expect(
      confirmed.raiderAccountId
    ).toBe(
      Array.from(accounts.keys())[0]
    );
  });

  it("an already-consumed pendingToken cannot be replayed to create a second account", async () => {
    const { service, accounts } =
      createService();

    const result = await connectAndCallback(
      service,
      "register"
    );

    if (
      result.outcome !==
      "register-pending"
    ) {
      throw new Error("unreachable");
    }

    await service.confirmRegistration(
      result.pendingToken
    );

    await expect(
      service.confirmRegistration(
        result.pendingToken
      )
    ).rejects.toThrow();

    expect(accounts.size).toBe(1);
  });

  it("rejects confirmRegistration for a pendingToken that was never issued (no forging a registration out of thin air)", async () => {
    const { service, accounts } =
      createService();

    await expect(
      service.confirmRegistration(
        "never-issued-token"
      )
    ).rejects.toThrow();

    expect(accounts.size).toBe(0);
  });

  it("an existing identity hitting the register flow does not create a duplicate - it is logged in directly", async () => {
    const { service, repository, accounts } =
      createService();

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234"
    });

    // The only createAccount call so far is the seed above - handling
    // the register-intent callback for this already-existing identity
    // must not add a second one.
    expect(
      repository.createAccount
    ).toHaveBeenCalledTimes(1);

    const result = await connectAndCallback(
      service,
      "register"
    );

    expect(result.outcome).toBe(
      "register-existing-account"
    );

    expect(accounts.size).toBe(1);

    expect(
      repository.createAccount
    ).toHaveBeenCalledTimes(1);
  });

  it("a legacy account (no battleNetAccountId yet) that hits the register flow gets bound and logged in, not duplicated", async () => {
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

    const result = await connectAndCallback(
      service,
      "register"
    );

    expect(result.outcome).toBe(
      "register-existing-account"
    );

    expect(accounts.size).toBe(1);

    expect(
      accounts.get(legacy.id)!
        .battleNetAccountId
    ).toBe("4200001");

    // The only createAccount call is the seed above (simulating the
    // pre-migration row) - binding + logging in an existing legacy
    // account must never call createAccount again.
    expect(
      repository.createAccount
    ).toHaveBeenCalledTimes(1);
  });

  it("issues a usable session for the register-existing-account outcome", async () => {
    const { service, repository } =
      createService();

    await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234"
    });

    const result = await connectAndCallback(
      service,
      "register"
    );

    if (
      result.outcome !==
      "register-existing-account"
    ) {
      throw new Error("unreachable");
    }

    await expect(
      service.requireSession(result.token)
    ).resolves.toBeDefined();
  });
});
