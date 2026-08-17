import { describe, expect, it } from "vitest";
import { resolveEffectiveRole } from "../../shared/catalog/raidSpecializationCatalog.js";
import { createSharedFakeEnvironment } from "./setup.multiSetupIsolation.testSupport.js";

describe("Two real Setups for the same RaidEvent/RaidBoss/member — mandatory isolation", () => {
  it("createSetup produces two genuinely distinct Setups for the same event", async () => {
    const { setupService } =
      createSharedFakeEnvironment();

    const setupA = await setupService.createSetup(
      "token",
      "event-1",
      "Thursday Mythic"
    );

    const setupB = await setupService.createSetup(
      "token",
      "event-1",
      "Sunday Mythic"
    );

    expect(setupA.id).not.toBe(setupB.id);
    expect(setupA.raidEventId).toBe("event-1");
    expect(setupB.raidEventId).toBe("event-1");
  });

  it("Setup A's roster pool is independent of Setup B's — adding to one never appears in the other", async () => {
    const { setupService, setupMembers, memberKey } =
      createSharedFakeEnvironment();

    const setupA = await setupService.createSetup(
      "token",
      "event-1",
      "Thursday Mythic"
    );

    const setupB = await setupService.createSetup(
      "token",
      "event-1",
      "Sunday Mythic"
    );

    await setupService.addMembers(
      "token",
      setupA.id,
      ["member-1"]
    );

    expect(
      setupMembers.has(
        memberKey(setupA.id, "member-1")
      )
    ).toBe(true);

    expect(
      setupMembers.has(
        memberKey(setupB.id, "member-1")
      )
    ).toBe(false);
  });

  it("Setup A and Setup B can independently confirm the same member for the same boss with different specs — zero leakage either direction", async () => {
    const {
      setupService,
      bossRosterService,
      bossRosterEntries,
      entryKey
    } = createSharedFakeEnvironment();

    const setupA = await setupService.createSetup(
      "token",
      "event-1",
      "Thursday Mythic"
    );

    const setupB = await setupService.createSetup(
      "token",
      "event-1",
      "Sunday Mythic"
    );

    await setupService.addMembers(
      "token",
      setupA.id,
      ["member-1"]
    );

    await setupService.addMembers(
      "token",
      setupB.id,
      ["member-1"]
    );

    await bossRosterService.setEntry(
      "token",
      "boss-1",
      setupA.id,
      "member-1",
      "CONFIRMED"
    );

    await bossRosterService.setEntry(
      "token",
      "boss-1",
      setupB.id,
      "member-1",
      "CONFIRMED"
    );

    await bossRosterService.setSpec(
      "token",
      "boss-1",
      setupA.id,
      "member-1",
      65
    );

    await bossRosterService.setSpec(
      "token",
      "boss-1",
      setupB.id,
      "member-1",
      70
    );

    const entryA = bossRosterEntries.get(
      entryKey("boss-1", setupA.id, "member-1")
    );

    const entryB = bossRosterEntries.get(
      entryKey("boss-1", setupB.id, "member-1")
    );

    expect(entryA?.specId).toBe(65);
    expect(entryB?.specId).toBe(70);

    expect(
      resolveEffectiveRole(
        entryA?.specId ?? null
      )
    ).toBe("HEALER");

    expect(
      resolveEffectiveRole(
        entryB?.specId ?? null
      )
    ).toBe("DPS");
  });
});
