import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { CrafterShareService } from "./crafter-share.service.js";
import type { CrafterSharePublicRecord } from "./crafter-share.types.js";

const origin = "https://syntrack.io";

function shareRow(enabled: boolean, token = "a".repeat(32)) {
  return {
    id: "share-1",
    raiderAccountId: "account-1",
    token,
    enabled,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe("CrafterShareService", () => {
  it("returns a disabled status when no share exists", async () => {
    const repository = {
      findByAccountId: vi.fn(async () => null)
    };

    const service = new CrafterShareService(
      repository as never,
      () => "b".repeat(32),
      origin
    );

    await expect(service.getStatus("account-1")).resolves.toEqual({
      enabled: false,
      publicUrl: null
    });
  });

  it("creates a stable public URL on enable and keeps it after disable/re-enable", async () => {
    let stored = null as ReturnType<typeof shareRow> | null;

    const repository = {
      findByAccountId: vi.fn(async () => stored),
      createShare: vi.fn(async (_id: string, token: string) => {
        stored = shareRow(true, token);
        return stored;
      }),
      setEnabled: vi.fn(async (_id: string, enabled: boolean) => {
        stored = shareRow(enabled, stored?.token ?? "a".repeat(32));
        return stored;
      })
    };

    const service = new CrafterShareService(
      repository as never,
      () => "c".repeat(32),
      origin
    );

    const enabled = await service.enable("account-1");

    expect(enabled).toEqual({
      enabled: true,
      publicUrl: `https://syntrack.io/c/${"c".repeat(32)}`
    });

    const disabled = await service.disable("account-1");

    expect(disabled).toEqual({
      enabled: false,
      publicUrl: null
    });

    const again = await service.enable("account-1");

    expect(again.publicUrl).toBe(enabled.publicUrl);
    expect(repository.createShare).toHaveBeenCalledTimes(1);
  });

  it("hides disabled and unknown tokens as a generic 404", async () => {
    const repository = {
      findEnabledPublicRecord: vi.fn(async () => null)
    };

    const service = new CrafterShareService(
      repository as never,
      () => "d".repeat(32),
      origin
    );

    await expect(service.getPublicCard("d".repeat(32))).rejects.toMatchObject({
      statusCode: 404
    });

    await expect(service.getPublicCard("d".repeat(32))).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("maps only the owning account's public card", async () => {
    const record: CrafterSharePublicRecord = {
      battleTag: "Syn#1234",
      characters: [
        {
          name: "Synblast",
          realm: "Antonidas",
          className: "Shaman",
          professions: [
            {
              profession: {
                name: "Jewelcrafting"
              },
              recipes: []
            }
          ]
        }
      ]
    };

    const repository = {
      findEnabledPublicRecord: vi.fn(async () => record)
    };

    const service = new CrafterShareService(
      repository as never,
      () => "e".repeat(32),
      origin
    );

    await expect(service.getPublicCard("e".repeat(32))).resolves.toEqual({
      battleTag: "Syn#1234",
      characters: []
    });
  });
});
