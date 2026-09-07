import { describe, expect, it, vi } from "vitest";
import { LootMemberLinkService } from "./member-link.service.js";

/*
 * Phase G4B corrective: proves the relocated member-link resolution
 * (token -> raider session -> linked member) still works exactly as
 * GuildRaiderLinkService.getLinkedMember() did, now living entirely
 * under Loot instead of the removed Guild module.
 */
describe("LootMemberLinkService", () => {
  it("resolves the linked member for a valid raider session", async () => {
    const repository = {
      findMemberByLinkedAccount: vi.fn().mockResolvedValue({
        id: "member-1",
        name: "Synbeast"
      })
    };
    const raiderAuth = {
      requireSession: vi.fn().mockResolvedValue({
        token: "tok",
        raiderAccountId: "raider-1",
        characters: []
      })
    };

    const service = new LootMemberLinkService(
      repository as never,
      raiderAuth as never
    );

    const member = await service.getLinkedMember("tok");

    expect(raiderAuth.requireSession).toHaveBeenCalledWith("tok");
    expect(
      repository.findMemberByLinkedAccount
    ).toHaveBeenCalledWith("raider-1");
    expect(member).toEqual({ id: "member-1", name: "Synbeast" });
  });

  it("returns null when the raider session has no linked member", async () => {
    const repository = {
      findMemberByLinkedAccount: vi.fn().mockResolvedValue(null)
    };
    const raiderAuth = {
      requireSession: vi.fn().mockResolvedValue({
        token: "tok",
        raiderAccountId: "raider-2",
        characters: []
      })
    };

    const service = new LootMemberLinkService(
      repository as never,
      raiderAuth as never
    );

    await expect(
      service.getLinkedMember("tok")
    ).resolves.toBeNull();
  });

  it("propagates a session error without calling the repository", async () => {
    const repository = {
      findMemberByLinkedAccount: vi.fn()
    };
    const raiderAuth = {
      requireSession: vi.fn().mockRejectedValue(
        new Error("invalid token")
      )
    };

    const service = new LootMemberLinkService(
      repository as never,
      raiderAuth as never
    );

    await expect(
      service.getLinkedMember("bad-token")
    ).rejects.toThrow("invalid token");

    expect(
      repository.findMemberByLinkedAccount
    ).not.toHaveBeenCalled();
  });
});
