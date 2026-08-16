import { describe, expect, it } from "vitest";
import {
  cooldownDisplayCategories,
  groupAssignmentsByCategory,
  resolveAssignmentCategory
} from "./cooldownCategories.js";

function assignment(
  overrides: Partial<{
    memberId: string;
    spellId: number | null;
    abilityName: string;
    abilityIcon: string | null;
  }>
) {
  return {
    memberId: "member-1",
    spellId: 97462,
    abilityName: "Rallying Cry",
    abilityIcon: "icon.jpg",
    ...overrides
  };
}

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
  it("returns all six categories, all empty, when there are no assignments", () => {
    const groups = groupAssignmentsByCategory(
      []
    );

    expect(
      groups.map((group) => group.category)
    ).toEqual(cooldownDisplayCategories);

    expect(
      groups.every(
        (group) =>
          group.spellRows.length === 0
      )
    ).toBe(true);
  });

  it("groups repeated same-spell assignments for one member into one row with multiple markers", () => {
    const groups = groupAssignmentsByCategory(
      [
        assignment({}),
        assignment({})
      ]
    );

    const raidDr = groups.find(
      (group) => group.category === "Raid DR"
    );

    expect(raidDr?.spellRows).toHaveLength(
      1
    );

    expect(
      raidDr?.spellRows[0]?.assignments
    ).toHaveLength(2);
  });

  it("gives one member two separate rows for two different spells in the same category", () => {
    const groups = groupAssignmentsByCategory(
      [
        assignment({
          spellId: 1022,
          abilityName:
            "Blessing of Protection"
        }),
        assignment({
          spellId: 6940,
          abilityName:
            "Blessing of Sacrifice"
        })
      ]
    );

    const externals = groups.find(
      (group) => group.category === "External"
    );

    expect(
      externals?.spellRows
    ).toHaveLength(2);

    expect(
      externals?.spellRows.map(
        (row) => row.abilityName
      )
    ).toEqual([
      "Blessing of Protection",
      "Blessing of Sacrifice"
    ]);
  });

  it("gives the same spell used by two different members two separate rows", () => {
    const groups = groupAssignmentsByCategory(
      [
        assignment({ memberId: "member-1" }),
        assignment({ memberId: "member-2" })
      ]
    );

    const raidDr = groups.find(
      (group) => group.category === "Raid DR"
    );

    expect(raidDr?.spellRows).toHaveLength(
      2
    );

    expect(
      raidDr?.spellRows.every(
        (row) => row.assignments.length === 1
      )
    ).toBe(true);
  });

  it("buckets a free-text assignment under Other, grouping conservatively by exact name", () => {
    const groups = groupAssignmentsByCategory(
      [
        assignment({
          spellId: null,
          abilityName: "Custom Cooldown"
        }),
        assignment({
          spellId: null,
          abilityName: "Custom Cooldown"
        }),
        assignment({
          spellId: null,
          abilityName: "Different Name"
        })
      ]
    );

    const other = groups.find(
      (group) => group.category === "Other"
    );

    expect(other?.spellRows).toHaveLength(
      2
    );

    expect(
      other?.spellRows.find(
        (row) =>
          row.abilityName ===
          "Custom Cooldown"
      )?.assignments
    ).toHaveLength(2);
  });
});
