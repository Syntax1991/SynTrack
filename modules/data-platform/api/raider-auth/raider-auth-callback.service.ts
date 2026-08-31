import { randomBytes } from "node:crypto";
import { env } from "../../../../apps/api/src/config/env.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { bindDeviceConnection } from "../device-auth/device-connection-bridge.js";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import type { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import { isSafeInternalPath } from "./internal-path.js";
import { resolveRaiderAuthCallback } from "./raider-auth-callback.resolver.js";
import type { RaiderAuthRepository } from "./raider-auth.repository.js";
import { issueRaiderSession } from "./raider-auth.session.js";
import type {
  RaiderAuthCallbackOutcome,
  RaiderAuthIntent,
  RaiderPendingRegistrationInfo,
  RaiderSessionResult
} from "./raider-auth.types.js";

const oauthStateLifetimeMilliseconds =
  10 * 60 * 1000;

/*
 * Everything OAuth-round-trip-shaped: building the /authorize URL,
 * consuming the callback (delegated to raider-auth-callback.resolver.ts
 * once intent/returnTo are known), and the register-intent pending-
 * confirmation bridge. Split out of RaiderAuthService (which keeps the
 * already-authenticated session operations) purely to stay under the
 * repo's 350-line-per-file cap - RaiderAuthService composes and
 * delegates to this class, so callers outside raider-auth/ never see the
 * split.
 */
export class RaiderAuthCallbackService {
  constructor(
    private readonly repository:
      RaiderAuthRepository,

    private readonly battleNetRepository:
      BattleNetRepository,

    private readonly battleNetClient:
      BattleNetClient
  ) {}

  async createAuthorizationUrl(
    intent: RaiderAuthIntent,
    returnTo: string | null,
    deviceLinkRequestId: string | null = null
  ): Promise<string> {
    this.assertConfigured();

    const state =
      randomBytes(32).toString("hex");

    const safeReturnTo =
      isSafeInternalPath(returnTo)
        ? returnTo
        : null;

    await this.battleNetRepository.createOAuthState(
      state,
      new Date(
        Date.now() +
          oauthStateLifetimeMilliseconds
      ),
      intent,
      safeReturnTo,
      deviceLinkRequestId
    );

    return this.battleNetClient.createAuthorizationUrl(
      state,
      env.BATTLENET_RAIDER_REDIRECT_URI
    );
  }

  /*
   * Never throws for expected/user-facing failure modes - every branch,
   * including OAuth/state errors, resolves to a RaiderAuthCallbackOutcome
   * so the controller can redirect to the right page with a safe,
   * translated message instead of leaking a raw exception. Only truly
   * unexpected errors (a bug, not a user- or Blizzard-caused condition)
   * propagate past this method.
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<RaiderAuthCallbackOutcome> {
    this.assertConfigured();

    if (!code || !state) {
      return {
        outcome: "error",
        intent: "login",
        message:
          "Battle.net hat keinen vollständigen OAuth-Callback geliefert."
      };
    }

    const consumedState =
      await this.battleNetRepository.consumeOAuthState(
        state
      );

    if (!consumedState) {
      return {
        outcome: "error",
        intent: "login",
        message:
          "Der Battle.net-Anmeldevorgang ist ungültig oder abgelaufen.",
        reason: "state_expired"
      };
    }

    const {
      intent,
      returnTo,
      deviceLinkRequestId
    } = consumedState;

    try {
      return await resolveRaiderAuthCallback(
        this.repository,
        this.battleNetClient,
        code,
        intent,
        returnTo,
        deviceLinkRequestId
      );
    }
    catch (error) {
      if (error instanceof AppError) {
        return {
          outcome: "error",
          intent,
          message: error.message
        };
      }

      return {
        outcome: "error",
        intent,
        message:
          "Battle.net-Login fehlgeschlagen. Bitte erneut versuchen."
      };
    }
  }

  async peekPendingRegistration(
    pendingToken: string
  ): Promise<RaiderPendingRegistrationInfo> {
    const pending =
      await this.repository.peekPendingRegistration(
        pendingToken
      );

    if (!pending) {
      throw new AppError(
        400,
        "Diese Registrierung ist ungültig oder abgelaufen. Bitte erneut mit Battle.net registrieren."
      );
    }

    return {
      battleTag: pending.battleTag
    };
  }

  /*
   * The one and only place a RaiderAccount is created - always an
   * explicit call, never a side effect of OAuth succeeding. Concurrency
   * safety comes from RaiderAuthRepository.createAccount's unique-
   * constraint handling, not from this method checking-then-creating.
   */
  async confirmRegistration(
    pendingToken: string
  ): Promise<RaiderSessionResult> {
    if (!pendingToken) {
      throw new AppError(
        400,
        "Es liegt keine ausstehende Registrierung vor."
      );
    }

    const pending =
      await this.repository.consumePendingRegistration(
        pendingToken
      );

    if (!pending) {
      throw new AppError(
        400,
        "Diese Registrierung ist ungültig oder abgelaufen. Bitte erneut mit Battle.net registrieren."
      );
    }

    const account =
      await this.repository.createAccount(
        {
          battleNetAccountId:
            pending.battleNetAccountId,
          battleTag: pending.battleTag
        }
      );

    await this.repository.updateAccountToken(
      account.id,
      {
        battleTag: pending.battleTag,
        accessToken:
          pending.accessToken,
        tokenType: pending.tokenType,
        scope: pending.scope,
        tokenExpiresAt:
          pending.tokenExpiresAt
      }
    );

    // The account has only just been created, at this exact call - safe
    // to bind a pending codeless device connection now (unlike the
    // existing-account paths in raider-auth-callback.resolver.ts, which
    // can bind immediately because the account was already known).
    // bindDeviceConnection is a no-op when deviceLinkRequestId is null.
    if (pending.deviceLinkRequestId) {
      await bindDeviceConnection(
        pending.deviceLinkRequestId,
        account.id
      );
    }

    const characters = JSON.parse(
      pending.charactersJson
    );

    const sessionToken =
      await issueRaiderSession(
        this.repository,
        account.id,
        characters
      );

    return {
      token: sessionToken,
      raiderAccountId: account.id,
      characters,
      returnTo: pending.returnTo ?? null
    };
  }

  private assertConfigured(): void {
    if (
      !env.BATTLENET_CLIENT_ID ||
      !env.BATTLENET_CLIENT_SECRET
    ) {
      throw new AppError(
        503,
        "Battle.net Client-ID oder Client-Secret fehlt in apps/api/.env."
      );
    }
  }
}
