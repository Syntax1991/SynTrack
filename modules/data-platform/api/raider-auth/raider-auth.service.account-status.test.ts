import { describe, expect, it, vi } from "vitest";
import {
  connectAndCallback,
  createService
} from "./raider-auth.test-support.js";

vi.mock(
  "../../../../apps/api/src/config/env.js",
  () => ({
    env: {
      FRONTEND_ORIGIN: "http://localhost:5173",
      BATTLENET_CLIENT_ID: "test-client-id",
      BATTLENET_CLIENT_SECRET: "test-client-secret",
      BATTLENET_RAIDER_REDIRECT_URI:
        "http://localhost:4000/api/auth/raider/callback"
    }
  })
);

describe("RaiderAuthService — pending and disabled accounts", () => {
  it("does not issue a session for a pending account", async () => {
    const { service, repository, accounts } = createService();

    const created = await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234",
      status: "PENDING_APPROVAL"
    });

    accounts.get(created.id)!.status = "PENDING_APPROVAL";

    const result = await connectAndCallback(service, "login");

    expect(result.outcome).toBe("login-awaiting-approval");
  });

  it("does not issue a session for a disabled account", async () => {
    const { service, repository, accounts } = createService();

    const created = await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234",
      status: "DISABLED"
    });

    accounts.get(created.id)!.status = "DISABLED";

    const result = await connectAndCallback(service, "login");

    expect(result.outcome).toBe("login-disabled");
  });

  it("rejects an existing session once the account is no longer active", async () => {
    const { service, repository } = createService();

    const created = await repository.createAccount({
      battleNetAccountId: "4200001",
      battleTag: "Demo#1234",
      status: "ACTIVE"
    });

    await repository.createSession({
      token: "sess-1",
      raiderAccountId: created.id,
      charactersJson: "[]",
      expiresAt: new Date(Date.now() + 60_000)
    });

    created.status = "DISABLED";

    await expect(service.requireSession("sess-1")).rejects.toThrow(
      /deaktiviert/u
    );
  });
});
