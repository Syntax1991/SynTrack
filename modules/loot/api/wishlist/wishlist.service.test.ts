import { describe, expect, it, vi } from "vitest";
import { LootWishlistService } from "./wishlist.service.js";

/*
 * Phase G4B corrective: proves Wishlist ownership still resolves
 * correctly through the relocated LootMemberLinkService interface
 * (RaiderLinkGuard) rather than the removed GuildRaiderLinkService -
 * the service under test never changed, only where its dependency
 * comes from, so this is the regression proof that swap was safe.
 */

const realTrinketId = 245973;

vi.mock("../../shared/catalog/lootCatalog.js", () => ({
  lootCatalog: [
    {
      items: [
        { itemId: 245973, slot: "TRINKET" }
      ]
    }
  ]
}));

function fakeRepository() {
  return {
    findTierPreferences: vi.fn().mockResolvedValue([]),
    findTrinketChoices: vi.fn().mockResolvedValue([]),
    upsertTierPreference: vi.fn().mockResolvedValue({}),
    deleteTierPreference: vi.fn().mockResolvedValue({ count: 1 }),
    upsertTrinketChoice: vi.fn().mockResolvedValue({}),
    deleteTrinketChoice: vi.fn().mockResolvedValue({ count: 1 }),
    clearItemFromOtherRanks: vi.fn().mockResolvedValue({ count: 0 })
  };
}

function linkedGuard(memberId = "member-1") {
  return {
    getLinkedMember: vi.fn().mockResolvedValue({ id: memberId })
  };
}

function unlinkedGuard() {
  return {
    getLinkedMember: vi.fn().mockResolvedValue(null)
  };
}

describe("LootWishlistService", () => {
  it("scopes getMyWishlist to the linked member's id", async () => {
    const repository = fakeRepository();
    const service = new LootWishlistService(
      repository as never,
      linkedGuard("member-42")
    );

    const result = await service.getMyWishlist("tok");

    expect(repository.findTierPreferences).toHaveBeenCalledWith("member-42");
    expect(repository.findTrinketChoices).toHaveBeenCalledWith("member-42");
    expect(result.memberId).toBe("member-42");
  });

  it("rejects with 403 when the caller has no linked member", async () => {
    const repository = fakeRepository();
    const service = new LootWishlistService(
      repository as never,
      unlinkedGuard()
    );

    await expect(
      service.getMyWishlist("tok")
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(repository.findTierPreferences).not.toHaveBeenCalled();
  });

  it("writes a tier preference under the linked member's id", async () => {
    const repository = fakeRepository();
    const service = new LootWishlistService(
      repository as never,
      linkedGuard("member-7")
    );

    await service.setTierStatus("tok", "HEAD", "PREFERRED");

    expect(repository.upsertTierPreference).toHaveBeenCalledWith(
      "member-7",
      "HEAD",
      "PREFERRED"
    );
  });

  it("rejects an unknown trinket item id before writing anything", async () => {
    const repository = fakeRepository();
    const service = new LootWishlistService(
      repository as never,
      linkedGuard()
    );

    await expect(
      service.setTrinketChoice("tok", 1, 999999)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(repository.upsertTrinketChoice).not.toHaveBeenCalled();
  });

  it("writes a real trinket choice under the linked member's id", async () => {
    const repository = fakeRepository();
    const service = new LootWishlistService(
      repository as never,
      linkedGuard("member-9")
    );

    await service.setTrinketChoice("tok", 2, realTrinketId);

    expect(repository.clearItemFromOtherRanks).toHaveBeenCalledWith(
      "member-9",
      realTrinketId,
      2
    );
    expect(repository.upsertTrinketChoice).toHaveBeenCalledWith(
      "member-9",
      2,
      realTrinketId
    );
  });
});
