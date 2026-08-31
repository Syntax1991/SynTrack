import type {
  RequestHandler
} from "express";
import { env } from "../../../../apps/api/src/config/env.js";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { resolvePendingDeviceConnection } from "../device-auth/device-connection-bridge.js";
import { isSafeInternalPath } from "./internal-path.js";
import { RaiderAuthService } from "./raider-auth.service.js";
import type { RaiderAuthIntent } from "./raider-auth.types.js";

function getQueryValue(
  value: unknown
): string {
  return typeof value === "string"
    ? value
    : "";
}

function getIntentQueryValue(
  value: unknown
): RaiderAuthIntent {
  return getQueryValue(value) ===
    "register"
    ? "register"
    : "login";
}

export class RaiderAuthController {
  constructor(
    private readonly service:
      RaiderAuthService
  ) {}

  connect: RequestHandler = async (
    request,
    response
  ) => {
    const intent =
      getIntentQueryValue(
        request.query.intent
      );

    const rawReturnTo =
      getQueryValue(
        request.query.returnTo
      );

    const returnTo =
      isSafeInternalPath(rawReturnTo)
        ? rawReturnTo
        : null;

    const rawDeviceConnectionToken =
      getQueryValue(
        request.query
          .deviceConnectionToken
      );

    let deviceLinkRequestId:
      | string
      | null = null;

    if (rawDeviceConnectionToken) {
      const pending =
        await resolvePendingDeviceConnection(
          rawDeviceConnectionToken
        );

      if (!pending) {
        // Fail fast rather than wasting a Battle.net round trip on a
        // dead/invalid connection token - send the browser straight back
        // to the connect page, which will independently re-fetch the
        // token's status and render EXPIRED/INVALID itself.
        response.redirect(
          this.deviceConnectRedirect(
            rawDeviceConnectionToken
          )
        );

        return;
      }

      deviceLinkRequestId = pending.id;
    }

    const authorizationUrl =
      await this.service
        .createAuthorizationUrl(
          intent,
          returnTo,
          deviceLinkRequestId
        );

    response.redirect(
      authorizationUrl
    );
  };

  callback: RequestHandler = async (
    request,
    response
  ) => {
    try {
      const providerError =
        getQueryValue(
          request.query.error_description
        ) ||
        getQueryValue(
          request.query.error
        );

      const code =
        getQueryValue(
          request.query.code
        );

      const state =
        getQueryValue(
          request.query.state
        );

      if (providerError) {
        response.redirect(
          this.errorRedirect(
            "login"
          )
        );

        return;
      }

      const result =
        await this.service.handleCallback(
          code,
          state
        );

      response.redirect(
        this.redirectForOutcome(
          result
        )
      );
    }
    catch {
      response.redirect(
        this.errorRedirect("login")
      );
    }
  };

  getRegistrationPending: RequestHandler =
    async (request, response) => {
      const pendingToken =
        requireBearerToken(request);

      response.json(
        await this.service.peekPendingRegistration(
          pendingToken
        )
      );
    };

  confirmRegistration: RequestHandler =
    async (request, response) => {
      const pendingToken =
        requireBearerToken(request);

      response.json(
        await this.service.confirmRegistration(
          pendingToken
        )
      );
    };

  getSession: RequestHandler = async (
    request,
    response
  ) => {
    const token =
      requireBearerToken(request);

    response.json(
      await this.service.getSessionStatus(
        token
      )
    );
  };

  logout: RequestHandler = async (
    request,
    response
  ) => {
    const token =
      requireBearerToken(request);

    await this.service.logout(token);

    response.status(204).send();
  };

  private redirectForOutcome(
    outcome: Awaited<
      ReturnType<
        RaiderAuthService["handleCallback"]
      >
    >
  ): string {
    switch (outcome.outcome) {
      case "login-success": {
        const target = new URL(
          "/raider-login",
          env.FRONTEND_ORIGIN
        );

        target.hash = `token=${outcome.token}`;

        if (outcome.returnTo) {
          target.searchParams.set(
            "returnTo",
            outcome.returnTo
          );
        }

        return target.toString();
      }

      case "login-unknown-account": {
        const target = new URL(
          "/login",
          env.FRONTEND_ORIGIN
        );

        target.searchParams.set(
          "outcome",
          "unknown-account"
        );

        return target.toString();
      }

      case "register-existing-account": {
        const target = new URL(
          "/register/confirm",
          env.FRONTEND_ORIGIN
        );

        target.searchParams.set(
          "outcome",
          "existing"
        );

        if (outcome.returnTo) {
          target.searchParams.set(
            "returnTo",
            outcome.returnTo
          );
        }

        target.hash = `token=${outcome.token}`;

        return target.toString();
      }

      case "register-pending": {
        const target = new URL(
          "/register/confirm",
          env.FRONTEND_ORIGIN
        );

        target.hash = `pendingToken=${outcome.pendingToken}`;

        return target.toString();
      }

      case "error":
      default: {
        return this.errorRedirect(
          outcome.outcome === "error"
            ? outcome.intent
            : "login",
          outcome.outcome === "error"
            ? outcome.reason
            : undefined
        );
      }
    }
  }

  /*
   * `error` carries a short stable code, not a sentence - the frontend
   * (LoginPage/RegisterPage) owns the actual copy per code, so this is
   * free to gain more distinct reasons later without the URL shape
   * changing. "state_expired" specifically covers the "OAuth state was
   * missing/expired when the callback arrived" case (see
   * raider-auth-callback.service.ts / BattleNetRepository.consumeOAuthState)
   * so a user who waited too long, double-submitted, or reused an old
   * callback link gets an accurate message instead of a generic one -
   * every code still resolves to a fresh /login or /register page, so
   * "Try again" always starts a brand-new OAuth attempt rather than
   * retrying the dead state.
   */
  private deviceConnectRedirect(
    rawDeviceConnectionToken: string
  ): string {
    const target = new URL(
      "/client/connect",
      env.FRONTEND_ORIGIN
    );

    target.searchParams.set(
      "token",
      rawDeviceConnectionToken
    );

    return target.toString();
  }

  private errorRedirect(
    intent: RaiderAuthIntent,
    reason?: "state_expired"
  ): string {
    const target = new URL(
      intent === "register"
        ? "/register"
        : "/login",
      env.FRONTEND_ORIGIN
    );

    target.searchParams.set(
      "error",
      reason ?? "failed"
    );

    return target.toString();
  }
}
