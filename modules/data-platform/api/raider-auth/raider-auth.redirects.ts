import { env } from "../../../../apps/api/src/config/env.js";
import type {
  RaiderAuthCallbackOutcome,
  RaiderAuthIntent
} from "./raider-auth.types.js";

function errorRedirect(
  intent: RaiderAuthIntent,
  reason?: "state_expired"
): string {
  const target = new URL(
    intent === "register" ? "/register" : "/login",
    env.FRONTEND_ORIGIN
  );

  target.searchParams.set("error", reason ?? "failed");

  return target.toString();
}

export function deviceConnectRedirect(
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

export function redirectForOutcome(
  outcome: RaiderAuthCallbackOutcome
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

    case "login-unknown-account":
      return loginOutcome("unknown-account");

    case "login-awaiting-approval":
      return loginOutcome("awaiting-approval");

    case "login-disabled":
      return loginOutcome("disabled");

    case "register-existing-account": {
      const target = new URL(
        "/register/confirm",
        env.FRONTEND_ORIGIN
      );

      target.searchParams.set("outcome", "existing");

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
    default:
      return errorRedirect(
        outcome.outcome === "error"
          ? outcome.intent
          : "login",
        outcome.outcome === "error"
          ? outcome.reason
          : undefined
      );
  }
}

function loginOutcome(outcome: string): string {
  const target = new URL(
    "/login",
    env.FRONTEND_ORIGIN
  );

  target.searchParams.set("outcome", outcome);

  return target.toString();
}
