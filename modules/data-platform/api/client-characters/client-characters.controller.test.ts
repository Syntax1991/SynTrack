import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ClientCharactersController } from "./client-characters.controller.js";
import { ClientCharactersService } from "./client-characters.service.js";
import type { DeviceCredentialRow } from "../device-auth/device-link-repository.types.js";

function credentialRow(
  overrides: Partial<DeviceCredentialRow> = {}
): DeviceCredentialRow {
  return {
    id: "cred-1",
    name: "Test Client",
    tokenHash: "hash",
    linkRequestId: "link-1",
    raiderAccountId: "account-a",
    createdAt: new Date(),
    lastSeenAt: null,
    revokedAt: null,
    ...overrides
  };
}

function fakeRequest(authorization: string | undefined) {
  return {
    headers: { authorization }
  } as Parameters<
    ClientCharactersController["list"]
  >[0];
}

function fakeResponse() {
  const json = vi.fn();
  return {
    response: { json } as unknown as Parameters<
      ClientCharactersController["list"]
    >[1],
    json
  };
}

describe("ClientCharactersController auth + ownership boundary", () => {
  it("rejects a missing Authorization header before ever calling the service", async () => {
    const requireValidCredential = vi.fn();
    const service = new ClientCharactersService(
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    const listSpy = vi.spyOn(service, "listForAccount");

    const controller = new ClientCharactersController(
      requireValidCredential,
      service
    );

    const { response } = fakeResponse();

    await expect(
      controller.list(fakeRequest(undefined), response, vi.fn())
    ).rejects.toThrow(
      "A device credential is required."
    );

    expect(requireValidCredential).not.toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid/revoked device credential before ever calling the service", async () => {
    const requireValidCredential = vi
      .fn()
      .mockRejectedValue(
        new Error("Invalid device credential.")
      );

    const service = new ClientCharactersService(
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    const listSpy = vi.spyOn(service, "listForAccount");

    const controller = new ClientCharactersController(
      requireValidCredential,
      service
    );

    const { response } = fakeResponse();

    await expect(
      controller.list(
        fakeRequest("Bearer dvc_bad-token"),
        response,
        vi.fn()
      )
    ).rejects.toThrow(
      "Invalid device credential."
    );

    expect(listSpy).not.toHaveBeenCalled();
  });

  it("rejects a legacy unowned credential with reconnect required", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(
        credentialRow({ raiderAccountId: null })
      );

    const service = new ClientCharactersService(
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    const listSpy = vi.spyOn(service, "listForAccount");

    const controller = new ClientCharactersController(
      requireValidCredential,
      service
    );

    const { response } = fakeResponse();

    await expect(
      controller.list(
        fakeRequest("Bearer dvc_legacy"),
        response,
        vi.fn()
      )
    ).rejects.toBeInstanceOf(AppError);

    expect(listSpy).not.toHaveBeenCalled();
  });

  it("returns only the owning account roster once the device credential is owned", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(credentialRow());

    const listCharactersForAccount = vi.fn().mockResolvedValue([
      {
        id: "char-1",
        name: "Synblast",
        realm: "Antonidas",
        className: "Mage",
        level: 80
      }
    ]);

    const service = new ClientCharactersService(
      listCharactersForAccount,
      vi.fn().mockResolvedValue(new Map()),
      vi.fn().mockResolvedValue(new Map())
    );

    const controller = new ClientCharactersController(
      requireValidCredential,
      service
    );

    const { response, json } = fakeResponse();

    await controller.list(
      fakeRequest("Bearer dvc_good-token"),
      response,
      vi.fn()
    );

    expect(listCharactersForAccount).toHaveBeenCalledWith("account-a");

    expect(json).toHaveBeenCalledWith({
      items: [
        {
          id: "char-1",
          name: "Synblast",
          realm: "Antonidas",
          className: "Mage",
          level: 80,
          itemLevel: null,
          lastSyncedAt: null
        }
      ]
    });
  });

  it("isolates Account A from Account B characters", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(
        credentialRow({ raiderAccountId: "account-a" })
      );

    const listCharactersForAccount = vi
      .fn()
      .mockImplementation(async (accountId: string) => {
        if (accountId === "account-a") {
          return [
            {
              id: "char-a",
              name: "Alpha",
              realm: "Antonidas",
              className: "Mage",
              level: 80
            }
          ];
        }

        return [
          {
            id: "char-b",
            name: "Beta",
            realm: "Antonidas",
            className: "Warrior",
            level: 80
          }
        ];
      });

    const service = new ClientCharactersService(
      listCharactersForAccount,
      vi.fn().mockResolvedValue(new Map()),
      vi.fn().mockResolvedValue(new Map())
    );

    const controller = new ClientCharactersController(
      requireValidCredential,
      service
    );

    const { response, json } = fakeResponse();

    await controller.list(
      fakeRequest("Bearer dvc_a"),
      response,
      vi.fn()
    );

    expect(listCharactersForAccount).toHaveBeenCalledWith("account-a");
    expect(json.mock.calls[0]![0].items).toEqual([
      expect.objectContaining({ id: "char-a", name: "Alpha" })
    ]);
    expect(json.mock.calls[0]![0].items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "char-b" })
      ])
    );
  });
});
