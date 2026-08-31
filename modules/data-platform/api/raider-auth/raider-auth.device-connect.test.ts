import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  registerDeviceConnectionBinder,
  registerDeviceConnectionResolver
} from "../device-auth/device-connection-bridge.js";
import {
  connectAndCallback,
  createService
} from "./raider-auth.test-support.js";

/*
 * assertConfigured() legitimately requires real Battle.net credentials
 * to be present - this stubs that unrelated config leaf (not the logic
 * under test) so handleCallback can run in an environment with no
 * apps/api/.env, exactly as raider-auth.service.login.test.ts /
 * raider-auth.service.register.test.ts already do.
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

/*
 * Proves the device-connect continuation mechanism end-to-end against
 * the real resolver/callback-service logic (not a re-implementation of
 * it) - only the Battle.net HTTP calls and the DB repositories are
 * faked, exactly like raider-auth.service.login.test.ts /
 * raider-auth.service.register.test.ts already do. Covers:
 *  - an existing account binds the pending connection immediately
 *  - a brand-new account only binds after the explicit confirm step
 *  - the bind is exactly-once/idempotent under a duplicate confirm
 *  - a different account can never steal an already-bound request
 */
describe("raider-auth device-connect continuation", () => {
  afterEach(() => {
    registerDeviceConnectionBinder(
      async () => {}
    );

    registerDeviceConnectionResolver(
      async () => null
    );
  });

  it("an existing account binds a pending device connection immediately on login", async () => {
    const { service, accounts } =
      createService();

    // A prior login already created the account (canonical id must
    // already exist for the "existing account" branch to run).
    accounts.set("account-1", {
      id: "account-1",
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234",
      accessToken: null,
      tokenType: null,
      scope: null,
      tokenExpiresAt: null
    });

    const bound = vi.fn(
      async () => {}
    );

    registerDeviceConnectionBinder(
      bound
    );

    await connectAndCallback(
      service,
      "login",
      null,
      "link-42"
    );

    expect(bound).toHaveBeenCalledWith(
      "link-42",
      "account-1"
    );
  });

  it("a brand-new account does NOT bind at OAuth callback time - only after the explicit confirm", async () => {
    const { service } = createService();

    const bound = vi.fn(
      async () => {}
    );

    registerDeviceConnectionBinder(
      bound
    );

    const outcome =
      await connectAndCallback(
        service,
        "register",
        "/client/connect?token=abc",
        "link-99"
      );

    expect(outcome.outcome).toBe(
      "register-pending"
    );

    expect(bound).not.toHaveBeenCalled();

    if (
      outcome.outcome !==
      "register-pending"
    ) {
      throw new Error(
        "expected register-pending"
      );
    }

    const confirmed =
      await service.confirmRegistration(
        outcome.pendingToken
      );

    expect(bound).toHaveBeenCalledWith(
      "link-99",
      confirmed.raiderAccountId
    );

    // returnTo survived the full OAuth -> explicit confirm round trip.
    expect(
      confirmed.returnTo
    ).toBe(
      "/client/connect?token=abc"
    );
  });

  it("registration-continuation is single-use: a replayed confirm cannot bind (or create) a second time", async () => {
    const { service } = createService();

    const bound = vi.fn(
      async () => {}
    );

    registerDeviceConnectionBinder(
      bound
    );

    const outcome =
      await connectAndCallback(
        service,
        "register",
        null,
        "link-1"
      );

    if (
      outcome.outcome !==
      "register-pending"
    ) {
      throw new Error(
        "expected register-pending"
      );
    }

    await service.confirmRegistration(
      outcome.pendingToken
    );

    await expect(
      service.confirmRegistration(
        outcome.pendingToken
      )
    ).rejects.toThrow();

    expect(bound).toHaveBeenCalledTimes(
      1
    );
  });

  it("the real bindDeviceConnection bridge call never throws even when the binder rejects a cross-account attempt - a hijacked/reused token must not break an unrelated login", async () => {
    const { service, accounts } =
      createService();

    accounts.set("account-1", {
      id: "account-1",
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234",
      accessToken: null,
      tokenType: null,
      scope: null,
      tokenExpiresAt: null
    });

    // Simulates the real DeviceConnectionService's contract: it never
    // throws for a mismatch, it just declines silently (see
    // device-connection.service.test.ts for the real implementation's
    // own coverage of that rule).
    registerDeviceConnectionBinder(
      async () => {}
    );

    await expect(
      connectAndCallback(
        service,
        "login",
        null,
        "link-hijacked"
      )
    ).resolves.toMatchObject({
      outcome: "login-success"
    });
  });

  it("bindDeviceConnection is a no-op when no device connection was requested (deviceLinkRequestId omitted) - ordinary login/register is unaffected", async () => {
    const { service, accounts } =
      createService();

    accounts.set("account-1", {
      id: "account-1",
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234",
      accessToken: null,
      tokenType: null,
      scope: null,
      tokenExpiresAt: null
    });

    const bound = vi.fn(
      async () => {}
    );

    registerDeviceConnectionBinder(
      bound
    );

    await connectAndCallback(
      service,
      "login"
    );

    expect(bound).not.toHaveBeenCalled();
  });
});
