import { describe, expect, it, vi } from "vitest";
import { redirectForOutcome } from "./raider-auth.redirects.js";

vi.mock(
  "../../../../apps/api/src/config/env.js",
  () => ({
    env: {
      FRONTEND_ORIGIN: "http://localhost:5273"
    }
  })
);

describe("redirectForOutcome", () => {
  it("sends pending and disabled accounts to login copy, not a session hash", () => {
    expect(redirectForOutcome({ outcome: "login-awaiting-approval" })).toBe(
      "http://localhost:5273/login?outcome=awaiting-approval"
    );
    expect(redirectForOutcome({ outcome: "login-disabled" })).toBe(
      "http://localhost:5273/login?outcome=disabled"
    );
  });
});
