import type {
  RequestHandler
} from "express";
import { env } from "../../../../apps/api/src/config/env.js";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { isSafeInternalPath } from "./internal-path.js";
import { RaiderAuthService } from "./raider-auth.service.js";
import type { RaiderAuthIntent } from "./raider-auth.types.js";

const genericSignInFailureMessage =
  "Could not sign in with Battle.net. Please try again.";

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

    const authorizationUrl =
      await this.service
        .createAuthorizationUrl(
          intent,
          returnTo
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
            : "login"
        );
      }
    }
  }

  private errorRedirect(
    intent: RaiderAuthIntent
  ): string {
    const target = new URL(
      intent === "register"
        ? "/register"
        : "/login",
      env.FRONTEND_ORIGIN
    );

    target.searchParams.set(
      "error",
      genericSignInFailureMessage
    );

    return target.toString();
  }
}
