import { describe, expect, it, vi } from "vitest";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import type { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import { RaiderAuthService } from "./raider-auth.service.js";
import {
  connectAndCallback,
  createService
} from "./raider-auth.test-support.js";

/**
 * assertConfigured() legitimately requires real Battle.net credentials
 * to be present — this stubs that unrelated config leaf (not the
 * security properties under test) so handleCallback can run in an
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

describe("RaiderAuthService — security properties", () => {
  it("has no mechanism to touch GuildMember.linkedRaiderAccountId - the fake repository only exposes RaiderAccount/RaiderSession operations", async () => {
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

  it("the account created always uses the BattleTag independently fetched from Blizzard's userinfo response - handleCallback's signature (code, state) has no path for a client-supplied identity string", async () => {
    const { service, accounts } =
      createService({
        id: 999,
        battletag: "RealTag#1"
      });

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

    const [account] = Array.from(
      accounts.values()
    );

    expect(account?.battleTag).toBe(
      "RealTag#1"
    );
  });

  it("rejects a callback with a missing or already-consumed OAuth state instead of guessing an intent", async () => {
    const { repository, battleNetClient } =
      createService();

    const freshBattleNetRepository = {
      createOAuthState: vi.fn(
        async () => {}
      ),
      consumeOAuthState: vi.fn(
        async () => null
      )
    } as unknown as BattleNetRepository;

    const service = new RaiderAuthService(
      repository,
      freshBattleNetRepository,
      battleNetClient
    );

    const result =
      await service.handleCallback(
        "auth-code",
        "unknown-state"
      );

    expect(result.outcome).toBe("error");

    if (result.outcome === "error") {
      expect(result.intent).toBe(
        "login"
      );

      // Tagged distinctly from other failures so the frontend can show
      // "sign-in expired" instead of a generic message - see
      // raider-auth.controller.ts#errorRedirect and
      // modules/data-platform/web/raider-auth/utils/authErrorCopy.ts.
      expect(result.reason).toBe(
        "state_expired"
      );
    }
  });

  it("rejects a callback missing code or state entirely", async () => {
    const { service } = createService();

    const result =
      await service.handleCallback(
        "",
        ""
      );

    expect(result.outcome).toBe("error");
  });

  it("returns an error outcome (not a thrown exception) when Battle.net returns neither id nor sub", async () => {
    const { service } = createService({
      battletag: "NoId#1"
    });

    const result = await connectAndCallback(
      service,
      "login"
    );

    expect(result.outcome).toBe("error");
  });

  it("never leaks a raw exception message - Battle.net client failures surface as the service's own translated AppError text", async () => {
    const {
      repository,
      battleNetRepository,
      battleNetClient
    } = createService();

    const failingClient = {
      ...battleNetClient,
      exchangeAuthorizationCode: vi.fn(
        async () => {
          throw new Error(
            "ECONNRESET raw socket failure at 10.0.0.5:443"
          );
        }
      )
    } as unknown as BattleNetClient;

    const service = new RaiderAuthService(
      repository,
      battleNetRepository,
      failingClient
    );

    await service.createAuthorizationUrl(
      "login",
      null
    );

    const result =
      await service.handleCallback(
        "auth-code",
        "state-value"
      );

    expect(result.outcome).toBe("error");

    if (result.outcome === "error") {
      expect(result.message).not.toContain(
        "ECONNRESET"
      );

      expect(result.message).not.toContain(
        "10.0.0.5"
      );
    }
  });
});
