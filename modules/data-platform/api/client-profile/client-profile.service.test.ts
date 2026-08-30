import { describe, expect, it, vi } from "vitest";
import { ClientProfileService } from "./client-profile.service.js";
import type { DeviceCredentialRow } from "../device-auth/device-link-repository.types.js";

function credentialRow(
  overrides: Partial<DeviceCredentialRow> = {}
): DeviceCredentialRow {
  return {
    id: "cred-1",
    name: "Test Client",
    tokenHash: "hash",
    linkRequestId: "link-1",
    raiderAccountId: null,
    createdAt: new Date(),
    lastSeenAt: null,
    revokedAt: null,
    ...overrides
  };
}

describe("ClientProfileService", () => {
  it("returns the battleTag for a credential linked to a RaiderAccount", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(
        credentialRow({
          raiderAccountId: "raider-1"
        })
      );

    const findBattleTagByAccountId = vi
      .fn()
      .mockResolvedValue(
        "Syntax#21715"
      );

    const service = new ClientProfileService(
      requireValidCredential,
      findBattleTagByAccountId
    );

    const result =
      await service.getProfileForDeviceToken(
        "dvc_raw-token"
      );

    expect(result).toEqual({
      battleTag: "Syntax#21715"
    });

    expect(
      requireValidCredential
    ).toHaveBeenCalledWith(
      "dvc_raw-token"
    );

    expect(
      findBattleTagByAccountId
    ).toHaveBeenCalledWith("raider-1");
  });

  it("returns a null battleTag, not an error, for a credential that predates raiderAccountId", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(
        credentialRow({
          raiderAccountId: null
        })
      );

    const findBattleTagByAccountId = vi
      .fn();

    const service = new ClientProfileService(
      requireValidCredential,
      findBattleTagByAccountId
    );

    const result =
      await service.getProfileForDeviceToken(
        "dvc_raw-token"
      );

    expect(result).toEqual({
      battleTag: null
    });

    expect(
      findBattleTagByAccountId
    ).not.toHaveBeenCalled();
  });

  it("returns a null battleTag when the RaiderAccount has none on file", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(
        credentialRow({
          raiderAccountId: "raider-2"
        })
      );

    const findBattleTagByAccountId = vi
      .fn()
      .mockResolvedValue(null);

    const service = new ClientProfileService(
      requireValidCredential,
      findBattleTagByAccountId
    );

    const result =
      await service.getProfileForDeviceToken(
        "dvc_raw-token"
      );

    expect(result).toEqual({
      battleTag: null
    });
  });

  it("propagates an invalid/revoked credential rejection instead of swallowing it", async () => {
    const requireValidCredential = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "Invalid device credential."
        )
      );

    const service = new ClientProfileService(
      requireValidCredential,
      vi.fn()
    );

    await expect(
      service.getProfileForDeviceToken(
        "dvc_bad-token"
      )
    ).rejects.toThrow(
      "Invalid device credential."
    );
  });
});
