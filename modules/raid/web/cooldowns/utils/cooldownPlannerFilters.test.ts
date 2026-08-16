import { describe, expect, it } from "vitest";
import {
  buildPlayerPlanLanes,
  isLaneVisible,
  isPlayerVisible
} from "./cooldownPlannerFilters.js";

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
    spellId: 104773,
    abilityName: "Unending Resolve",
    abilityIcon: "icon.jpg",
    ...overrides
  };
}

describe("buildPlayerPlanLanes", () => {
  it("every real class spell becomes a lane even with zero assignments", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Warlock",
      null,
      []
    );

    expect(
      lanes.map((lane) => lane.abilityName)
    ).toEqual([
      "Unending Resolve",
      "Dark Pact",
      "Demonic Gateway"
    ]);

    expect(
      lanes.every(
        (lane) =>
          lane.assignments.length === 0
      )
    ).toBe(true);
  });

  it("a real assignment for a catalogued spell attaches to that lane instead of duplicating it", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Warlock",
      null,
      [
        assignment({}),
        assignment({})
      ]
    );

    const resolveLane =
      lanes.find(
        (lane) =>
          lane.spellId === 104773
      );

    expect(
      resolveLane?.assignments
    ).toHaveLength(2);

    expect(lanes).toHaveLength(3);
  });

  it("an uncatalogued spellId gets its own orphan lane, not merged into the catalog", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Warlock",
      null,
      [
        assignment({
          spellId: 999999,
          abilityName: "Mystery Spell"
        })
      ]
    );

    expect(lanes).toHaveLength(4);

    const orphan = lanes.find(
      (lane) => lane.spellId === 999999
    );

    expect(
      orphan?.abilityName
    ).toBe("Mystery Spell");
  });

  it("a free-text assignment (no spellId) gets its own orphan lane keyed by exact name", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Warlock",
      null,
      [
        assignment({
          spellId: null,
          abilityName: "Custom Cooldown"
        }),
        assignment({
          spellId: null,
          abilityName: "Custom Cooldown"
        })
      ]
    );

    const orphan = lanes.find(
      (lane) => lane.spellId === null
    );

    expect(
      orphan?.assignments
    ).toHaveLength(2);
  });

  it("never fabricates a spell — an unknown class yields only orphan lanes, no catalog lanes", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Not A Real Class",
      null,
      []
    );

    expect(lanes).toEqual([]);
  });
});

const baseLaneOptions = {
  activeCategory: "all" as const,
  hiddenSpellIds: new Set<number>(),
  alwaysShowAssigned: false
};

function lane(
  overrides: Partial<{
    category:
      | "Heal CD"
      | "Raid DR"
      | "External"
      | "Defensive"
      | "Utility"
      | "Other";
    spellId: number | null;
    assignments: unknown[];
  }>
) {
  return {
    category: "Defensive" as const,
    spellId: 104773,
    assignments: [],
    ...overrides
  };
}

describe("isLaneVisible", () => {
  it("all categories: a lane with zero assignments is visible", () => {
    expect(
      isLaneVisible(lane({}), baseLaneOptions)
    ).toBe(true);
  });

  it("category mismatch, no assignment: hidden even with Always Show Assigned", () => {
    expect(
      isLaneVisible(lane({}), {
        ...baseLaneOptions,
        activeCategory: "Heal CD",
        alwaysShowAssigned: true
      })
    ).toBe(false);
  });

  it("category mismatch WITH a real assignment + Always Show Assigned: visible (safety override)", () => {
    expect(
      isLaneVisible(
        lane({ assignments: [{}] }),
        {
          ...baseLaneOptions,
          activeCategory: "Heal CD",
          alwaysShowAssigned: true
        }
      )
    ).toBe(true);
  });

  it("category mismatch WITH a real assignment but Always Show Assigned OFF: hidden", () => {
    expect(
      isLaneVisible(
        lane({ assignments: [{}] }),
        {
          ...baseLaneOptions,
          activeCategory: "Heal CD",
          alwaysShowAssigned: false
        }
      )
    ).toBe(false);
  });

  it("hidden spell with no assignment: hidden", () => {
    expect(
      isLaneVisible(lane({}), {
        ...baseLaneOptions,
        hiddenSpellIds: new Set([104773])
      })
    ).toBe(false);
  });

  it("hidden spell WITH a real assignment + Always Show Assigned: visible", () => {
    expect(
      isLaneVisible(
        lane({ assignments: [{}] }),
        {
          ...baseLaneOptions,
          hiddenSpellIds: new Set([104773]),
          alwaysShowAssigned: true
        }
      )
    ).toBe(true);
  });

  it("hidden spell WITH a real assignment but Always Show Assigned OFF: hidden", () => {
    expect(
      isLaneVisible(
        lane({ assignments: [{}] }),
        {
          ...baseLaneOptions,
          hiddenSpellIds: new Set([104773])
        }
      )
    ).toBe(false);
  });
});

describe("isPlayerVisible", () => {
  const baseState = {
    selectedMemberId: null as
      | string
      | null,
    hiddenMemberIds: new Set<string>(),
    alwaysShowAssigned: false
  };

  it("no selection, not hidden: visible", () => {
    expect(
      isPlayerVisible(
        "grimmshade",
        false,
        baseState
      )
    ).toBe(true);
  });

  it("a different player is selected: hidden", () => {
    expect(
      isPlayerVisible("grimmshade", false, {
        ...baseState,
        selectedMemberId: "thornclad"
      })
    ).toBe(false);
  });

  it("hidden with zero assignments + Always Show Assigned: still hidden — nothing to protect", () => {
    expect(
      isPlayerVisible("grimmshade", false, {
        ...baseState,
        hiddenMemberIds: new Set([
          "grimmshade"
        ]),
        alwaysShowAssigned: true
      })
    ).toBe(false);
  });

  it("hidden WITH real assignments + Always Show Assigned: visible", () => {
    expect(
      isPlayerVisible("grimmshade", true, {
        ...baseState,
        hiddenMemberIds: new Set([
          "grimmshade"
        ]),
        alwaysShowAssigned: true
      })
    ).toBe(true);
  });

  it("hidden WITH real assignments but Always Show Assigned OFF: hidden", () => {
    expect(
      isPlayerVisible("grimmshade", true, {
        ...baseState,
        hiddenMemberIds: new Set([
          "grimmshade"
        ])
      })
    ).toBe(false);
  });
});
