import { describe, expect, it } from "vitest";
import { createSharedFakeEnvironment } from "./setup.multiSetupIsolation.testSupport.js";

describe("Two real Setups — Cooldown Plan member and assignment isolation", () => {
  it("Setup A's Cooldown Plan members are independent of Setup B's", async () => {
    const {
      setupService,
      cooldownService,
      planMembers,
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

    await cooldownService.addPlanMember(
      "token",
      setupA.id,
      "boss-1",
      "member-1"
    );

    expect(
      planMembers.has(
        entryKey("boss-1", setupA.id, "member-1")
      )
    ).toBe(true);

    expect(
      planMembers.has(
        entryKey("boss-1", setupB.id, "member-1")
      )
    ).toBe(false);

    const membersA =
      await cooldownService.listPlanMembers(
        setupA.id,
        "boss-1"
      );

    const membersB =
      await cooldownService.listPlanMembers(
        setupB.id,
        "boss-1"
      );

    expect(membersA).toHaveLength(1);
    expect(membersB).toHaveLength(0);
  });

  it("an assignment created under Setup A never appears when listing Setup B", async () => {
    const { setupService, cooldownService } =
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

    await cooldownService.createAssignment(
      "token",
      setupA.id,
      "boss-1",
      {
        memberId: "member-1",
        abilityName: "Aura Mastery",
        spellId: 31821,
        abilityIcon: null,
        phaseLabel: null,
        timestampSeconds: 90,
        sortOrder: 0
      }
    );

    const assignmentsA =
      await cooldownService.listForSetup(
        setupA.id
      );

    const assignmentsB =
      await cooldownService.listForSetup(
        setupB.id
      );

    expect(assignmentsA).toHaveLength(1);
    expect(assignmentsA[0]?.abilityName).toBe(
      "Aura Mastery"
    );

    expect(assignmentsB).toHaveLength(0);
  });

  it("removing a plan member from Setup A never affects Setup B's plan member for the same boss/member", async () => {
    const {
      setupService,
      cooldownService,
      planMembers,
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

    await cooldownService.addPlanMember(
      "token",
      setupA.id,
      "boss-1",
      "member-1"
    );

    await cooldownService.addPlanMember(
      "token",
      setupB.id,
      "boss-1",
      "member-1"
    );

    await cooldownService.removePlanMember(
      "token",
      setupA.id,
      "boss-1",
      "member-1"
    );

    expect(
      planMembers.has(
        entryKey("boss-1", setupA.id, "member-1")
      )
    ).toBe(false);

    expect(
      planMembers.has(
        entryKey("boss-1", setupB.id, "member-1")
      )
    ).toBe(true);

    const membersB =
      await cooldownService.listPlanMembers(
        setupB.id,
        "boss-1"
      );

    expect(membersB).toHaveLength(1);
  });
});
