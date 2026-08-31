import { randomBytes } from "node:crypto";
import { env } from "../../../../apps/api/src/config/env.js";
import { bindDeviceConnection } from "../device-auth/device-connection-bridge.js";
import { normalizeBattleNetCharacters } from "../integrations/battlenet/battlenet-import.mapper.js";
import type { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import { resolveCanonicalBattleNetAccountId } from "./raider-auth.identity.js";
import type { RaiderAuthRepository } from "./raider-auth.repository.js";
import { issueRaiderSession } from "./raider-auth.session.js";
import type {
  RaiderAuthCallbackOutcome,
  RaiderAuthIntent
} from "./raider-auth.types.js";

const pendingRegistrationLifetimeMilliseconds =
  10 * 60 * 1000;

/*
 * The actual "code -> outcome" decision tree, once intent and returnTo
 * are already known (RaiderAuthCallbackService.handleCallback resolves
 * those from the consumed OAuth state before calling this). Split into
 * its own module purely to keep raider-auth-callback.service.ts under
 * the repo's per-file line cap - this function is only ever called from
 * there, wrapped in that class's try/catch.
 */
export async function resolveRaiderAuthCallback(
  repository: RaiderAuthRepository,
  battleNetClient: BattleNetClient,
  code: string,
  intent: RaiderAuthIntent,
  returnTo: string | null,
  deviceLinkRequestId: string | null = null
): Promise<RaiderAuthCallbackOutcome> {
  const token =
    await battleNetClient.exchangeAuthorizationCode(
      code,
      env.BATTLENET_RAIDER_REDIRECT_URI
    );

  const userInfo =
    await battleNetClient.getUserInfo(
      token.access_token
    );

  const battleNetAccountId =
    resolveCanonicalBattleNetAccountId(
      userInfo
    );

  if (!battleNetAccountId) {
    return {
      outcome: "error",
      intent,
      message:
        "Battle.net hat keine eindeutige Konto-ID geliefert."
    };
  }

  // Never trust a client-supplied BattleTag: this value only ever comes
  // from the userinfo response we just fetched ourselves, using the
  // access token from the code we just exchanged.
  const battleTag =
    userInfo.battletag ?? null;

  const existingAccount =
    (await repository.findAccountByCanonicalId(
      battleNetAccountId
    )) ??
    (battleTag
      ? await repository.findAndBackfillLegacyAccountByBattleTag(
          battleTag,
          battleNetAccountId
        )
      : null);

  if (intent === "login" && !existingAccount) {
    return {
      outcome: "login-unknown-account"
    };
  }

  const accountProfile =
    await battleNetClient.getAccountProfile(
      token.access_token
    );

  const characters =
    normalizeBattleNetCharacters(
      accountProfile
    );

  const tokenExpiresAt = new Date(
    Date.now() +
      (token.expires_in ?? 86400) * 1000
  );

  if (
    intent === "register" &&
    !existingAccount
  ) {
    // Battle.net succeeded, but no SynTrack account exists yet and none
    // is created here - only an explicit confirmRegistration() call
    // (POST /auth/raider/register/confirm) creates one.
    const pendingToken =
      randomBytes(32).toString("hex");

    await repository.createPendingRegistration(
      {
        token: pendingToken,
        battleNetAccountId,
        battleTag,
        accessToken:
          token.access_token,
        tokenType: token.token_type,
        scope: token.scope ?? null,
        tokenExpiresAt,
        charactersJson:
          JSON.stringify(characters),
        returnTo,
        deviceLinkRequestId,
        expiresAt: new Date(
          Date.now() +
            pendingRegistrationLifetimeMilliseconds
        )
      }
    );

    return {
      outcome: "register-pending",
      pendingToken
    };
  }

  // From here, existingAccount is guaranteed (login-matched or
  // register-matched-existing) - login never creates an account.
  const account = existingAccount!;

  await repository.updateAccountToken(
    account.id,
    {
      battleTag,
      accessToken: token.access_token,
      tokenType: token.token_type,
      scope: token.scope ?? null,
      tokenExpiresAt
    }
  );

  // The account is already concretely known at this point (unlike the
  // new-account register-pending branch above, which has to wait for the
  // explicit "Create account" confirm) - so a pending codeless device
  // connection binds immediately here, covering both the plain login path
  // and the "register intent, but the account already existed" path.
  // bindDeviceConnection is a no-op when deviceLinkRequestId is null.
  if (deviceLinkRequestId) {
    await bindDeviceConnection(
      deviceLinkRequestId,
      account.id
    );
  }

  const sessionToken =
    await issueRaiderSession(
      repository,
      account.id,
      characters
    );

  return intent === "register"
    ? {
        outcome:
          "register-existing-account",
        token: sessionToken,
        returnTo
      }
    : {
        outcome: "login-success",
        token: sessionToken,
        returnTo
      };
}
