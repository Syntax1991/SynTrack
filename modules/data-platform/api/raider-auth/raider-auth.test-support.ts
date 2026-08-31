import { randomBytes } from "node:crypto";
import { vi } from "vitest";
import type { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import { createFakeRepository } from "./raider-auth.fake-repository.js";
import { RaiderAuthService } from "./raider-auth.service.js";

export { createFakeRepository } from "./raider-auth.fake-repository.js";
export type { FakeAccount } from "./raider-auth.fake-repository.js";

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
    | "register" = "login";

  let capturedReturnTo:
    | string
    | null = null;

  let capturedDeviceLinkRequestId:
    | string
    | null = null;

  const battleNetRepository = {
    createOAuthState: vi.fn(
      async (
        _state: string,
        _expiresAt: Date,
        intent: "login" | "register",
        returnTo: string | null,
        deviceLinkRequestId:
          | string
          | null = null
      ) => {
        capturedIntent = intent;
        capturedReturnTo = returnTo;
        capturedDeviceLinkRequestId =
          deviceLinkRequestId;
      }
    ),
    consumeOAuthState: vi.fn(
      async () => ({
        intent: capturedIntent,
        returnTo: capturedReturnTo,
        deviceLinkRequestId:
          capturedDeviceLinkRequestId
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
  returnTo: string | null = null,
  deviceLinkRequestId: string | null = null
) {
  await service.createAuthorizationUrl(
    intent,
    returnTo,
    deviceLinkRequestId
  );

  return service.handleCallback(
    "auth-code",
    "state-value"
  );
}
