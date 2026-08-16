import { describe, expect, it } from "vitest";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { getSpellsForCharacter } from "../../shared/catalog/raidCooldownSpellCatalog.js";
import { resolveEffectiveRole } from "../../shared/catalog/raidSpecializationCatalog.js";
import type { RaidSetupRepository } from "../setups/setup.repository.js";
import type { RaidBossRosterRepository } from "./boss-roster.repository.js";
import { RaidBossRosterService } from "./boss-roster.service.js";
import type { RaiderLinkGuard } from "./boss-roster.types.js";

type FakeEntry = {
  bossId: string;
  setupId: string;
  memberId: string;
  status: string;
  specId: number | null;
};

/**
 * A real filtering fake, not a canned mock — it actually keys rows by
 * (bossId, setupId, memberId) so a bug that ignored setupId would be
 * caught, exactly the same rigor as
 * cooldown.setupIsolation.testSupport.ts's fake for the Setup+Boss
 * cooldown-planning slice. Two Setups here share the SAME
 * raidEventId AND the SAME bossId — the literal architectural case
 * this test exists to prove: setupId alone is what keeps them apart.
 */
function createIsolationService() {
  const key = (
    bossId: string,
    setupId: string,
    memberId: string
  ) => `${bossId}:${setupId}:${memberId}`;

  const store = new Map<string, FakeEntry>();

  store.set(
    key("boss-1", "setup-A", "member-1"),
    {
      bossId: "boss-1",
      setupId: "setup-A",
      memberId: "member-1",
      status: "CONFIRMED",
      specId: null
    }
  );

  store.set(
    key("boss-1", "setup-B", "member-1"),
    {
      bossId: "boss-1",
      setupId: "setup-B",
      memberId: "member-1",
      status: "CONFIRMED",
      specId: null
    }
  );

  const repository = {
    findBossById: async (bossId: string) => ({
      id: bossId,
      raidEventId: "event-1"
    }),
    findMemberById: async (
      memberId: string
    ) => ({
      id: memberId,
      className: "Paladin"
    }),
    findEntry: async (
      bossId: string,
      setupId: string,
      memberId: string
    ) =>
      store.get(
        key(bossId, setupId, memberId)
      ) ?? null,
    updateSpec: async (
      bossId: string,
      setupId: string,
      memberId: string,
      specId: number | null
    ) => {
      const entry = store.get(
        key(bossId, setupId, memberId)
      );

      if (entry) {
        entry.specId = specId;
      }
    },
    findBossWithSetupEntries: async (
      bossId: string,
      setupId: string
    ) => ({
      id: bossId,
      raidEventId: "event-1",
      rosterEntries: Array.from(
        store.values()
      ).filter(
        (entry) =>
          entry.bossId === bossId &&
          entry.setupId === setupId
      )
    })
  } as unknown as RaidBossRosterRepository;

  const rosterRepository = {
    findAll: async () => [
      {
        id: "member-1",
        className: "Paladin",
        name: "TestPaladin"
      }
    ]
  };

  const setupRepository = {
    findSetupById: async (
      setupId: string
    ) => ({
      id: setupId,
      raidEventId: "event-1"
    })
  } as unknown as RaidSetupRepository;

  const verification: GuildVerificationGuard = {
    ensureVerified: async () => {},
    requireCurrentOfficer: async () => ({
      id: "officer-1"
    })
  };

  const raiderLink: RaiderLinkGuard = {
    getLinkedMember: async () => ({
      id: "officer-1"
    })
  };

  const service = new RaidBossRosterService(
    repository,
    rosterRepository as never,
    setupRepository,
    verification,
    raiderLink
  );

  return { service, store, key };
}

describe("RaidBossRosterService — same RaidEvent, same RaidBoss, two Setups", () => {
  it("Setup A and Setup B resolve independently with zero spec leakage", async () => {
    const { service, store, key } =
      createIsolationService();

    await service.setSpec(
      "token",
      "boss-1",
      "setup-A",
      "member-1",
      65
    );

    await service.setSpec(
      "token",
      "boss-1",
      "setup-B",
      "member-1",
      70
    );

    const entryA = store.get(
      key("boss-1", "setup-A", "member-1")
    );

    const entryB = store.get(
      key("boss-1", "setup-B", "member-1")
    );

    expect(entryA?.specId).toBe(65);
    expect(entryB?.specId).toBe(70);

    expect(
      resolveEffectiveRole(entryA?.specId ?? null)
    ).toBe("HEALER");

    expect(
      resolveEffectiveRole(entryB?.specId ?? null)
    ).toBe("DPS");

    const spellsForA = getSpellsForCharacter({
      className: "Paladin",
      specId: entryA?.specId ?? null
    });

    const spellsForB = getSpellsForCharacter({
      className: "Paladin",
      specId: entryB?.specId ?? null
    });

    expect(
      spellsForA.some(
        (spell) => spell.name === "Aura Mastery"
      )
    ).toBe(true);

    expect(
      spellsForB.some(
        (spell) => spell.name === "Aura Mastery"
      )
    ).toBe(false);
  });

  it("changing Setup A after Setup B is already set does not modify Setup B", async () => {
    const { service, store, key } =
      createIsolationService();

    await service.setSpec(
      "token",
      "boss-1",
      "setup-B",
      "member-1",
      70
    );

    await service.setSpec(
      "token",
      "boss-1",
      "setup-A",
      "member-1",
      65
    );

    await service.setSpec(
      "token",
      "boss-1",
      "setup-A",
      "member-1",
      66
    );

    const entryB = store.get(
      key("boss-1", "setup-B", "member-1")
    );

    expect(entryB?.specId).toBe(70);
  });

  it("the enriched Setup+Boss response for A never includes B's row, and vice versa", async () => {
    const { service } =
      createIsolationService();

    await service.setSpec(
      "token",
      "boss-1",
      "setup-A",
      "member-1",
      65
    );

    await service.setSpec(
      "token",
      "boss-1",
      "setup-B",
      "member-1",
      70
    );

    const resultA = await service.setSpec(
      "token",
      "boss-1",
      "setup-A",
      "member-1",
      65
    );

    const resultB = await service.setSpec(
      "token",
      "boss-1",
      "setup-B",
      "member-1",
      70
    );

    expect(
      resultA?.rosterEntries
    ).toHaveLength(1);

    expect(
      resultA?.rosterEntries[0]?.specId
    ).toBe(65);

    expect(
      resultB?.rosterEntries
    ).toHaveLength(1);

    expect(
      resultB?.rosterEntries[0]?.specId
    ).toBe(70);
  });
});
