import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import type { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import { RaiderAuthCallbackService } from "./raider-auth-callback.service.js";
import { RaiderAuthRepository } from "./raider-auth.repository.js";
import type {
  RaiderAuthCallbackOutcome,
  RaiderAuthIntent,
  RaiderPendingRegistrationInfo,
  RaiderSessionResult,
  RaiderSessionStatus
} from "./raider-auth.types.js";

const tokenExpiryBufferMilliseconds =
  30 * 1000;

/*
 * Public entry point the rest of the app depends on (controller, plus
 * device-auth/guild routes that only ever call requireSession /
 * requireUsableAccessToken). OAuth-round-trip orchestration is delegated
 * to RaiderAuthCallbackService - see that file for why - everything here
 * is either a thin forward or operates on an already-established
 * RaiderSession.
 */
export class RaiderAuthService {
  private readonly callbackService:
    RaiderAuthCallbackService;

  constructor(
    private readonly repository:
      RaiderAuthRepository,

    battleNetRepository:
      BattleNetRepository,

    battleNetClient: BattleNetClient
  ) {
    this.callbackService =
      new RaiderAuthCallbackService(
        repository,
        battleNetRepository,
        battleNetClient
      );
  }

  createAuthorizationUrl(
    intent: RaiderAuthIntent,
    returnTo: string | null
  ): Promise<string> {
    return this.callbackService.createAuthorizationUrl(
      intent,
      returnTo
    );
  }

  handleCallback(
    code: string,
    state: string
  ): Promise<RaiderAuthCallbackOutcome> {
    return this.callbackService.handleCallback(
      code,
      state
    );
  }

  peekPendingRegistration(
    pendingToken: string
  ): Promise<RaiderPendingRegistrationInfo> {
    return this.callbackService.peekPendingRegistration(
      pendingToken
    );
  }

  confirmRegistration(
    pendingToken: string
  ): Promise<RaiderSessionResult> {
    return this.callbackService.confirmRegistration(
      pendingToken
    );
  }

  async requireSession(
    token: string
  ): Promise<RaiderSessionResult> {
    const session =
      await this.repository.findValidSession(
        token
      );

    if (!session) {
      throw new AppError(
        401,
        "Der Raider-Login ist ungültig oder abgelaufen. Bitte erneut mit Battle.net anmelden."
      );
    }

    return {
      token,
      raiderAccountId:
        session.raiderAccountId,
      characters: JSON.parse(
        session.charactersJson
      )
    };
  }

  async requireUsableAccessToken(
    token: string
  ): Promise<{
    accessToken: string;
  }> {
    const session =
      await this.repository.findValidSession(
        token
      );

    if (!session) {
      throw new AppError(
        401,
        "Der Raider-Login ist ungültig oder abgelaufen. Bitte erneut mit Battle.net anmelden."
      );
    }

    const account = session.account;

    const tokenIsUsable = Boolean(
      account.accessToken &&
        account.tokenExpiresAt &&
        account.tokenExpiresAt.getTime() -
            tokenExpiryBufferMilliseconds >
          Date.now()
    );

    if (
      !tokenIsUsable ||
      !account.accessToken
    ) {
      throw new AppError(
        401,
        "Die Battle.net-Verbindung ist abgelaufen. Bitte erneut mit Battle.net anmelden."
      );
    }

    return {
      accessToken:
        account.accessToken
    };
  }

  async getSessionStatus(
    token: string
  ): Promise<RaiderSessionStatus> {
    const session =
      await this.repository.findValidSession(
        token
      );

    if (!session) {
      throw new AppError(
        401,
        "Der Raider-Login ist ungültig oder abgelaufen. Bitte erneut mit Battle.net anmelden."
      );
    }

    return {
      battleTag:
        session.account.battleTag,
      expiresAt:
        session.expiresAt.toISOString()
    };
  }

  async logout(
    token: string
  ): Promise<void> {
    await this.repository.deleteSession(
      token
    );
  }
}
