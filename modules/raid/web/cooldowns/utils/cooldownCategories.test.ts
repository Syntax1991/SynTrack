import { describe, expect, it } from "vitest";
import {
  groupAssignmentsByPlayer,
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

describe("groupAssignmentsByPlayer", () => {
  it("returns no groups for no assignments", () => {
    expect(
      groupAssignmentsByPlayer([])
    ).toEqual([]);
  });

  it("groups repeated same-spell assignments for one member into one lane with multiple markers", () => {
    const groups = groupAssignmentsByPlayer(
      [assignment({}), assignment({})]
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.spellRows).toHaveLength(1);
    expect(
      groups[0]?.spellRows[0]?.assignments
    ).toHaveLength(2);
  });

  it("gives one member two separate lanes for two different spells", () => {
    const groups = groupAssignmentsByPlayer(
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

    expect(groups).toHaveLength(1);
    expect(groups[0]?.spellRows).toHaveLength(2);
    expect(
      groups[0]?.spellRows.map(
        (row) => row.abilityName
      )
    ).toEqual([
      "Blessing of Protection",
      "Blessing of Sacrifice"
    ]);
  });

  it("gives two different members their own separate groups", () => {
    const groups = groupAssignmentsByPlayer(
      [
        assignment({ memberId: "member-1" }),
        assignment({ memberId: "member-2" })
      ]
    );

    expect(groups).toHaveLength(2);
    expect(
      groups.map((group) => group.memberId)
    ).toEqual(["member-1", "member-2"]);
  });

  it("buckets a free-text assignment conservatively by exact name", () => {
    const groups = groupAssignmentsByPlayer(
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

    expect(groups[0]?.spellRows).toHaveLength(
      2
    );
  });

  it("applies a category filter, excluding non-matching assignments and their now-empty player groups", () => {
    const groups = groupAssignmentsByPlayer(
      [
        assignment({
          memberId: "member-1",
          spellId: 97462
        }), // Raid DR
        assignment({
          memberId: "member-2",
          spellId: 33206,
          abilityName: "Pain Suppression"
        }) // External
      ],
      "Raid DR"
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.memberId).toBe(
      "member-1"
    );
  });

  it("a player group only survives the filter if at least one of their lanes matches", () => {
    const groups = groupAssignmentsByPlayer(
      [
        assignment({
          memberId: "member-1",
          spellId: 97462
        }), // Raid DR
        assignment({
          memberId: "member-1",
          spellId: 33206,
          abilityName: "Pain Suppression"
        }) // External
      ],
      "External"
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.spellRows).toHaveLength(
      1
    );
    expect(
      groups[0]?.spellRows[0]?.abilityName
    ).toBe("Pain Suppression");
  });
});
