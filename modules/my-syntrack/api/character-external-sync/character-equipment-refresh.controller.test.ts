import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { CharacterEquipmentRefreshController } from "./character-equipment-refresh.controller.js";
import type { CharacterEquipmentRefreshService } from "./character-equipment-refresh.service.js";
import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";

function fakeRequest(authorization: string | undefined, characterId = "char-1") {
  return {
    headers: { authorization },
    params: { characterId }
  } as unknown as Parameters<CharacterEquipmentRefreshController["refreshOne"]>[0];
}

function fakeResponse() {
  const json = vi.fn();
  return {
    response: { json } as unknown as Parameters<
      CharacterEquipmentRefreshController["refreshOne"]
    >[1],
    json
  };
}

const validSession = {
  token: "raider-token",
  raiderAccountId: "account-a",
  characters: [],
  returnTo: null
};

describe("CharacterEquipmentRefreshController auth boundary", () => {
  it("rejects refreshOne with no Authorization header before ever calling the service", async () => {
    const refreshCharacter = vi.fn();
    const requireSession = vi.fn();

    const controller = new CharacterEquipmentRefreshController(
      { refreshCharacter } as unknown as CharacterEquipmentRefreshService,
      { requireSession } as RaiderSessionGuard
    );

    const { response } = fakeResponse();

    await expect(
      controller.refreshOne(fakeRequest(undefined), response, vi.fn())
    ).rejects.toBeInstanceOf(AppError);

    expect(requireSession).not.toHaveBeenCalled();
    expect(refreshCharacter).not.toHaveBeenCalled();
  });

  it("rejects refreshOne with an invalid/expired session before ever calling the service", async () => {
    const refreshCharacter = vi.fn();
    const requireSession = vi.fn().mockRejectedValue(new AppError(401, "invalid"));

    const controller = new CharacterEquipmentRefreshController(
      { refreshCharacter } as unknown as CharacterEquipmentRefreshService,
      { requireSession } as RaiderSessionGuard
    );

    const { response } = fakeResponse();

    await expect(
      controller.refreshOne(fakeRequest("Bearer bad-token"), response, vi.fn())
    ).rejects.toBeInstanceOf(AppError);

    expect(refreshCharacter).not.toHaveBeenCalled();
  });

  it("proceeds to the service once a valid session is presented", async () => {
    const refreshCharacter = vi
      .fn()
      .mockResolvedValue({ status: "SUCCESS", characterId: "char-1" });
    const requireSession = vi.fn().mockResolvedValue(validSession);

    const controller = new CharacterEquipmentRefreshController(
      { refreshCharacter } as unknown as CharacterEquipmentRefreshService,
      { requireSession } as RaiderSessionGuard
    );

    const { response, json } = fakeResponse();

    await controller.refreshOne(fakeRequest("Bearer good-token"), response, vi.fn());

    expect(requireSession).toHaveBeenCalledWith("good-token");
    expect(refreshCharacter).toHaveBeenCalledWith("char-1");
    expect(json).toHaveBeenCalledWith({ status: "SUCCESS", characterId: "char-1" });
  });

  it("rejects refreshAll (bulk) with no Authorization header before ever calling the service", async () => {
    const refreshAllEligible = vi.fn();
    const requireSession = vi.fn();

    const controller = new CharacterEquipmentRefreshController(
      { refreshAllEligible } as unknown as CharacterEquipmentRefreshService,
      { requireSession } as RaiderSessionGuard
    );

    const { response } = fakeResponse();

    await expect(
      controller.refreshAll(fakeRequest(undefined), response, vi.fn())
    ).rejects.toBeInstanceOf(AppError);

    expect(refreshAllEligible).not.toHaveBeenCalled();
  });
});
