import { describe, expect, it, vi } from "vitest";
import { LootDroptimizerService } from "./droptimizer.service.js";

/*
 * Phase G4B corrective: proves Droptimizer ownership still resolves
 * correctly through the relocated LootMemberLinkService interface
 * (RaiderLinkGuard) - same regression proof as wishlist.service.test.ts.
 */

vi.mock("../../shared/catalog/lootCatalog.js", () => ({
  lootCatalog: [
    {
      items: [
        {
          itemId: 268205,
          name: "Test Weapon",
          slot: "MAIN_HAND",
          bossName: "Test Boss"
        }
      ]
    }
  ]
}));

function fakeRepository() {
  return {
    findByMember: vi.fn().mockResolvedValue(null),
    upsertReport: vi.fn().mockImplementation(
      async (memberId: string, data: Record<string, unknown>) => ({
        id: "report-1",
        memberId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      })
    ),
    deleteByMember: vi.fn().mockResolvedValue({ count: 1 })
  };
}

function fakeRaidbots() {
  return {
    extractReportId: vi.fn().mockReturnValue("report-id"),
    fetchReport: vi.fn().mockResolvedValue({
      simbot: {
        simType: "droptimizer",
        publicTitle: "Test Sim",
        charClass: "Warrior",
        spec: "Arms"
      },
      sim: {
        players: [{ collected_data: { dps: { mean: 50000 } } }],
        profilesets: {
          results: [
            { name: "0/0/0/268205/311", mean: 60000 }
          ]
        }
      }
    })
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

describe("LootDroptimizerService", () => {
  it("scopes getMyReport to the linked member's id", async () => {
    const repository = fakeRepository();
    const service = new LootDroptimizerService(
      repository as never,
      fakeRaidbots() as never,
      linkedGuard("member-55")
    );

    await service.getMyReport("tok");

    expect(repository.findByMember).toHaveBeenCalledWith("member-55");
  });

  it("rejects with 403 when the caller has no linked member", async () => {
    const repository = fakeRepository();
    const service = new LootDroptimizerService(
      repository as never,
      fakeRaidbots() as never,
      unlinkedGuard()
    );

    await expect(
      service.getMyReport("tok")
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(repository.findByMember).not.toHaveBeenCalled();
  });

  it("stores a new report under the linked member's id with computed upgrades", async () => {
    const repository = fakeRepository();
    const service = new LootDroptimizerService(
      repository as never,
      fakeRaidbots() as never,
      linkedGuard("member-9")
    );

    const result = await service.setMyReport(
      "tok",
      "https://www.raidbots.com/simbot/report/report-id"
    );

    expect(repository.upsertReport).toHaveBeenCalledWith(
      "member-9",
      expect.objectContaining({ reportId: "report-id" })
    );
    expect(result.memberId).toBe("member-9");
    expect(result.upgrades[0]).toMatchObject({
      itemId: 268205,
      dps: 60000,
      dpsGain: 10000
    });
  });

  it("clears a report under the linked member's id", async () => {
    const repository = fakeRepository();
    const service = new LootDroptimizerService(
      repository as never,
      fakeRaidbots() as never,
      linkedGuard("member-3")
    );

    await service.clearMyReport("tok");

    expect(repository.deleteByMember).toHaveBeenCalledWith("member-3");
  });
});
