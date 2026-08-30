import { describe, expect, it, vi } from "vitest";
import { ClientCharactersController } from "./client-characters.controller.js";
import { ClientCharactersService } from "./client-characters.service.js";

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

describe("ClientCharactersController auth boundary", () => {
  it("rejects a missing Authorization header before ever calling the service", async () => {
    const requireValidCredential = vi.fn();
    const service = new ClientCharactersService(
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    const listSpy = vi.spyOn(service, "list");

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
    const listSpy = vi.spyOn(service, "list");

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

    expect(requireValidCredential).toHaveBeenCalledWith(
      "dvc_bad-token"
    );
    expect(listSpy).not.toHaveBeenCalled();
  });

  it("returns the roster once the device credential is valid", async () => {
    const requireValidCredential = vi
      .fn()
      .mockResolvedValue(undefined);

    const listCharacters = vi.fn().mockResolvedValue([
      {
        id: "char-1",
        name: "Synblast",
        realm: "Antonidas",
        className: "Mage",
        level: 80
      }
    ]);

    const service = new ClientCharactersService(
      listCharacters,
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

    expect(requireValidCredential).toHaveBeenCalledWith(
      "dvc_good-token"
    );

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
});
