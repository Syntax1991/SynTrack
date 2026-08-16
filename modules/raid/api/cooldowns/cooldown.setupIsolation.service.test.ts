import { describe, expect, it } from "vitest";
import {
  createIsolationTestService,
  isolationAssignmentInput,
  sameEventSetups
} from "./cooldown.setupIsolation.testSupport.js";

describe("RaidCooldownService Setup+Boss isolation (architectural acceptance test)", () => {
  it("two Setups for the same RaidEvent/Boss never leak plan members or assignments into each other", async () => {
    const service = createIsolationTestService(
      sameEventSetups
    );

    await service.addPlanMember(
      "setup-a",
      "boss-1",
      "member-a"
    );

    await service.createAssignment(
      "setup-a",
      "boss-1",
      isolationAssignmentInput(
        "member-a",
        "Rallying Cry"
      )
    );

    await service.addPlanMember(
      "setup-b",
      "boss-1",
      "member-b"
    );

    await service.createAssignment(
      "setup-b",
      "boss-1",
      isolationAssignmentInput(
        "member-b",
        "Divine Hymn"
      )
    );

    const planMembersA =
      await service.listPlanMembers(
        "setup-a",
        "boss-1"
      );

    const planMembersB =
      await service.listPlanMembers(
        "setup-b",
        "boss-1"
      );

    expect(
      planMembersA.map(
        (m) => m.memberId
      )
    ).toEqual(["member-a"]);

    expect(
      planMembersB.map(
        (m) => m.memberId
      )
    ).toEqual(["member-b"]);

    const assignmentsA =
      await service.listForSetup(
        "setup-a"
      );

    const assignmentsB =
      await service.listForSetup(
        "setup-b"
      );

    expect(assignmentsA).toHaveLength(
      1
    );

    expect(
      assignmentsA[0]?.abilityName
    ).toBe("Rallying Cry");

    expect(assignmentsB).toHaveLength(
      1
    );

    expect(
      assignmentsB[0]?.abilityName
    ).toBe("Divine Hymn");
  });

  it("the same member may independently participate in both Setups' plans for the same Boss", async () => {
    const service = createIsolationTestService(
      sameEventSetups
    );

    await service.addPlanMember(
      "setup-a",
      "boss-1",
      "member-shared"
    );

    await service.addPlanMember(
      "setup-b",
      "boss-1",
      "member-shared"
    );

    const planMembersA =
      await service.listPlanMembers(
        "setup-a",
        "boss-1"
      );

    const planMembersB =
      await service.listPlanMembers(
        "setup-b",
        "boss-1"
      );

    expect(
      planMembersA.map(
        (m) => m.memberId
      )
    ).toEqual(["member-shared"]);

    expect(
      planMembersB.map(
        (m) => m.memberId
      )
    ).toEqual(["member-shared"]);
  });

  it("removing a plan member from Setup A never affects Setup B's plan for the same member/boss", async () => {
    const service = createIsolationTestService(
      sameEventSetups
    );

    await service.addPlanMember(
      "setup-a",
      "boss-1",
      "member-shared"
    );

    await service.addPlanMember(
      "setup-b",
      "boss-1",
      "member-shared"
    );

    await service.removePlanMember(
      "setup-a",
      "boss-1",
      "member-shared"
    );

    const planMembersA =
      await service.listPlanMembers(
        "setup-a",
        "boss-1"
      );

    const planMembersB =
      await service.listPlanMembers(
        "setup-b",
        "boss-1"
      );

    expect(planMembersA).toHaveLength(
      0
    );

    expect(
      planMembersB.map(
        (m) => m.memberId
      )
    ).toEqual(["member-shared"]);
  });

  it("assignment counts used for the remove-plan-member safety check never cross Setups", async () => {
    const service = createIsolationTestService(
      sameEventSetups
    );

    await service.addPlanMember(
      "setup-a",
      "boss-1",
      "member-shared"
    );

    await service.addPlanMember(
      "setup-b",
      "boss-1",
      "member-shared"
    );

    // Only Setup B has a real assignment for this member.
    await service.createAssignment(
      "setup-b",
      "boss-1",
      isolationAssignmentInput(
        "member-shared",
        "Guardian Spirit"
      )
    );

    // Setup A has zero assignments for this member — removal succeeds.
    await expect(
      service.removePlanMember(
        "setup-a",
        "boss-1",
        "member-shared"
      )
    ).resolves.toBeUndefined();

    // Setup B has a real assignment — removal is blocked.
    await expect(
      service.removePlanMember(
        "setup-b",
        "boss-1",
        "member-shared"
      )
    ).rejects.toMatchObject({
      statusCode: 409
    });
  });
});
