import { describe, expect, it } from "vitest";
import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { resolveCharacterOwnerUpdate } from "./addon-import.character-ownership.js";

describe("resolveCharacterOwnerUpdate", () => {
  it("claims an unowned character when the importing credential has a proven owner", () => {
    expect(
      resolveCharacterOwnerUpdate({
        existingOwnerId: null,
        incomingOwnerId: "account-a",
        characterLabel: "Synblast-Antonidas-eu"
      })
    ).toBe("account-a");
  });

  it("leaves ownership untouched when the same proven owner re-imports", () => {
    expect(
      resolveCharacterOwnerUpdate({
        existingOwnerId: "account-a",
        incomingOwnerId: "account-a",
        characterLabel: "Synblast-Antonidas-eu"
      })
    ).toBeUndefined();
  });

  it("refuses cross-account takeover", () => {
    expect(() =>
      resolveCharacterOwnerUpdate({
        existingOwnerId: "account-a",
        incomingOwnerId: "account-b",
        characterLabel: "Synblast-Antonidas-eu"
      })
    ).toThrow(AppError);

    try {
      resolveCharacterOwnerUpdate({
        existingOwnerId: "account-a",
        incomingOwnerId: "account-b",
        characterLabel: "Synblast-Antonidas-eu"
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(409);
    }
  });

  it("does not invent ownership when the credential has no linked account", () => {
    expect(
      resolveCharacterOwnerUpdate({
        existingOwnerId: null,
        incomingOwnerId: null,
        characterLabel: "Synblast-Antonidas-eu"
      })
    ).toBeUndefined();

    expect(
      resolveCharacterOwnerUpdate({
        existingOwnerId: "account-a",
        incomingOwnerId: undefined,
        characterLabel: "Synblast-Antonidas-eu"
      })
    ).toBeUndefined();
  });
});
