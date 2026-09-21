import type {
  RequestHandler
} from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { resolvePendingDeviceConnection } from "../device-auth/device-connection-bridge.js";
import { isSafeInternalPath } from "./internal-path.js";
import { RaiderAuthService } from "./raider-auth.service.js";
import {
  deviceConnectRedirect,
  redirectForOutcome
} from "./raider-auth.redirects.js";
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
          deviceConnectRedirect(
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
          redirectForOutcome({
            outcome: "error",
            intent: "login",
            message: "sign-in failed"
          })
        );

        return;
      }

      const result =
        await this.service.handleCallback(
          code,
          state
        );

      response.redirect(
        redirectForOutcome(result)
      );
    }
    catch {
      response.redirect(
        redirectForOutcome({
          outcome: "error",
          intent: "login",
          message: "sign-in failed"
        })
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
}
