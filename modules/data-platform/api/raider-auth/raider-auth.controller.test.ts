import { describe, expect, it, vi } from "vitest";
import { RaiderAuthController } from "./raider-auth.controller.js";
import type { RaiderAuthService } from "./raider-auth.service.js";

/*
 * Covers RaiderAuthController's redirect-building - specifically that
 * the "reason" a handleCallback error outcome carries (see
 * raider-auth.types.ts / raider-auth-callback.service.ts) actually
 * reaches the frontend as the `error` query-param code, since that's the
 * only channel LoginPage/RegisterPage have to show distinct copy for an
 * expired/invalid OAuth state versus any other failure (point 9 of the
 * live-login incident: the user must be told accurately what happened,
 * and "Try again" must always point at a fresh /login or /register, never
 * back at the dead state).
 */
vi.mock(
  "../../../../apps/api/src/config/env.js",
  () => ({
    env: {
      FRONTEND_ORIGIN:
        "http://localhost:5273"
    }
  })
);

function createRequest(
  query: Record<string, string>
) {
  return { query } as never;
}

function createResponse() {
  const response = {
    redirectedTo: undefined as
      | string
      | undefined,
    redirect(
      this: {
        redirectedTo?: string;
      },
      url: string
    ) {
      this.redirectedTo = url;
    }
  };

  return response as typeof response & {
    redirect: (
      url: string
    ) => void;
  };
}

describe("RaiderAuthController.callback — redirect targets", () => {
  it("redirects to /login?error=state_expired when the OAuth state was missing or expired", async () => {
    const service = {
      handleCallback: vi.fn(
        async () => ({
          outcome: "error" as const,
          intent: "login" as const,
          message:
            "Der Battle.net-Anmeldevorgang ist ungültig oder abgelaufen.",
          reason:
            "state_expired" as const
        })
      )
    } as unknown as RaiderAuthService;

    const controller =
      new RaiderAuthController(
        service
      );

    const response = createResponse();

    await controller.callback(
      createRequest({
        code: "some-code",
        state: "some-state"
      }),
      response as never,
      undefined as never
    );

    expect(
      response.redirectedTo
    ).toBe(
      "http://localhost:5273/login?error=state_expired"
    );
  });

  it("redirects to /register?error=state_expired for a register-intent state failure", async () => {
    const service = {
      handleCallback: vi.fn(
        async () => ({
          outcome: "error" as const,
          intent: "register" as const,
          message:
            "Der Battle.net-Anmeldevorgang ist ungültig oder abgelaufen.",
          reason:
            "state_expired" as const
        })
      )
    } as unknown as RaiderAuthService;

    const controller =
      new RaiderAuthController(
        service
      );

    const response = createResponse();

    await controller.callback(
      createRequest({
        code: "some-code",
        state: "some-state"
      }),
      response as never,
      undefined as never
    );

    expect(
      response.redirectedTo
    ).toBe(
      "http://localhost:5273/register?error=state_expired"
    );
  });

  it("falls back to a generic error code (never a raw message) for a non-state failure", async () => {
    const service = {
      handleCallback: vi.fn(
        async () => ({
          outcome: "error" as const,
          intent: "login" as const,
          message:
            "Battle.net-Login fehlgeschlagen. Bitte erneut versuchen."
        })
      )
    } as unknown as RaiderAuthService;

    const controller =
      new RaiderAuthController(
        service
      );

    const response = createResponse();

    await controller.callback(
      createRequest({
        code: "some-code",
        state: "some-state"
      }),
      response as never,
      undefined as never
    );

    expect(
      response.redirectedTo
    ).toBe(
      "http://localhost:5273/login?error=failed"
    );
  });

  it("redirects unknown-account login to /login?outcome=unknown-account (unaffected by the reason change)", async () => {
    const service = {
      handleCallback: vi.fn(
        async () => ({
          outcome:
            "login-unknown-account" as const
        })
      )
    } as unknown as RaiderAuthService;

    const controller =
      new RaiderAuthController(
        service
      );

    const response = createResponse();

    await controller.callback(
      createRequest({
        code: "some-code",
        state: "some-state"
      }),
      response as never,
      undefined as never
    );

    expect(
      response.redirectedTo
    ).toBe(
      "http://localhost:5273/login?outcome=unknown-account"
    );
  });
});
