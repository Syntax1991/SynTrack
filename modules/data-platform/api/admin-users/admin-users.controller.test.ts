import { describe, expect, it, vi } from "vitest";
import { AdminUsersController } from "./admin-users.controller.js";
import type { AdminUsersService } from "./admin-users.service.js";
import type { RaiderSessionGuard } from "../raider-auth/raider-auth.types.js";
import type { RaiderAuthRepository } from "../raider-auth/raider-auth.repository.js";

vi.mock("../../../../apps/api/src/config/env.js", () => ({
  env: {
    SYNTRACK_ADMIN_BATTLE_NET_ACCOUNT_IDS: "admin-blizz",
    SYNTRACK_ADMIN_BATTLE_TAGS: "Admin#1"
  }
}));

function fakeRequest(authorization: string | undefined) {
  return {
    headers: { authorization }
  } as Parameters<AdminUsersController["list"]>[0];
}

function fakeResponse() {
  const json = vi.fn();

  return {
    response: { json } as unknown as Parameters<
      AdminUsersController["list"]
    >[1],
    json
  };
}

describe("AdminUsersController", () => {
  it("returns 403 before listing when the session is not allowlisted", async () => {
    const list = vi.fn();
    const controller = new AdminUsersController(
      { list } as unknown as AdminUsersService,
      {
        requireSession: async () => ({
          token: "tok",
          raiderAccountId: "user-1",
          characters: [],
          returnTo: null
        })
      } as RaiderSessionGuard,
      {
        findAccountById: async () => ({
          id: "user-1",
          battleNetAccountId: "not-admin",
          battleTag: "Guildie#2",
          status: "ACTIVE"
        })
      } as unknown as RaiderAuthRepository
    );

    const { response, json } = fakeResponse();

    await expect(
      controller.list(fakeRequest("Bearer tok"), response, vi.fn())
    ).rejects.toMatchObject({
      name: "AppError",
      statusCode: 403
    });

    expect(list).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });
});
