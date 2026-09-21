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
        "http://localhost:4000/api/auth/raider/callback",
      SYNTRACK_ADMIN_BATTLE_NET_ACCOUNT_IDS: "4200001",
      SYNTRACK_ADMIN_BATTLE_TAGS: ""
    }
  })
);

describe("RaiderAuthService — admin auto-approve", () => {
  it("issues a session when the new identity is on the admin allowlist", async () => {
    const { service, accounts } = createService();

    const pending = await connectAndCallback(service, "register");

    if (pending.outcome !== "register-pending") {
      throw new Error("unreachable");
    }

    const confirmed = await service.confirmRegistration(
      pending.pendingToken
    );

    expect(confirmed.outcome).toBe("registered");
    expect(accounts.size).toBe(1);
    expect(Array.from(accounts.values())[0]?.status).toBe("ACTIVE");

    if (confirmed.outcome !== "registered") {
      throw new Error("unreachable");
    }

    const status = await service.getSessionStatus(confirmed.token);

    expect(status.isAdmin).toBe(true);
  });
});
