import { describe, expect, it } from "vitest";
import {
  cooldownDisplayCategories,
  groupAssignmentsByCategory,
  resolveAssignmentCategory
} from "./cooldownCategories.js";

describe("resolveAssignmentCategory", () => {
  it("resolves a catalogued spellId to its real category", () => {
    expect(
      resolveAssignmentCategory({
        spellId: 97462
      })
    ).toBe("Raid DR");
  });

  it("resolves a free-text assignment (no spellId) to Other", () => {
    expect(
      resolveAssignmentCategory({
        spellId: null
      })
    ).toBe("Other");
  });

  it("resolves an uncatalogued spellId to Other rather than guessing", () => {
    expect(
      resolveAssignmentCategory({
        spellId: 999999999
      })
    ).toBe("Other");
  });
});

describe("groupAssignmentsByCategory", () => {
  it("returns all six categories, most empty, when there are no assignments", () => {
    const groups = groupAssignmentsByCategory(
      []
    );

    expect(
      groups.map((group) => group.category)
    ).toEqual(cooldownDisplayCategories);

    expect(
      groups.every(
        (group) =>
          group.memberGroups.length === 0
      )
    ).toBe(true);
  });

  it("only produces a member group for a member who holds a real assignment in that category", () => {
    const groups = groupAssignmentsByCategory(
      [
        {
          memberId: "member-1",
          spellId: 97462
        } // Rallying Cry -> Raid DR
      ]
    );

    const raidDr = groups.find(
      (group) => group.category === "Raid DR"
    );

    const healCd = groups.find(
      (group) => group.category === "Heal CD"
    );

    expect(
      raidDr?.memberGroups
    ).toEqual([
      {
        memberId: "member-1",
        assignments: [
          {
            memberId: "member-1",
            spellId: 97462
          }
        ]
      }
    ]);

    expect(healCd?.memberGroups).toEqual(
      []
    );
  });

  it("gives one member two independent rows when they hold assignments in two different categories", () => {
    const groups = groupAssignmentsByCategory(
      [
        {
          memberId: "member-1",
          spellId: 97462
        }, // Raid DR
        {
          memberId: "member-1",
          spellId: 33206
        } // Pain Suppression -> External
      ]
    );

    const raidDr = groups.find(
      (group) => group.category === "Raid DR"
    );

    const external = groups.find(
      (group) => group.category === "External"
    );

    expect(
      raidDr?.memberGroups.map(
        (memberGroup) => memberGroup.memberId
      )
    ).toEqual(["member-1"]);

    expect(
      external?.memberGroups.map(
        (memberGroup) => memberGroup.memberId
      )
    ).toEqual(["member-1"]);

    expect(
      raidDr?.memberGroups[0]?.assignments
    ).toHaveLength(1);

    expect(
      external?.memberGroups[0]?.assignments
    ).toHaveLength(1);
  });

  it("groups repeated same-category assignments for one member into that member's single row", () => {
    const groups = groupAssignmentsByCategory(
      [
        {
          memberId: "member-1",
          spellId: 97462
        },
        {
          memberId: "member-1",
          spellId: 97462
        }
      ]
    );

    const raidDr = groups.find(
      (group) => group.category === "Raid DR"
    );

    expect(
      raidDr?.memberGroups
    ).toHaveLength(1);

    expect(
      raidDr?.memberGroups[0]?.assignments
    ).toHaveLength(2);
  });

  it("buckets a free-text assignment under Other", () => {
    const groups = groupAssignmentsByCategory(
      [
        {
          memberId: "member-1",
          spellId: null
        }
      ]
    );

    const other = groups.find(
      (group) => group.category === "Other"
    );

    expect(
      other?.memberGroups
    ).toHaveLength(1);
  });
});
