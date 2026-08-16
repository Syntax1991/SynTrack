import { describe, expect, it } from "vitest";
import { buildPlayerPlanLanes } from "./cooldownPlannerFilters.js";

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
    spellId: 31821,
    abilityName: "Aura Mastery",
    abilityIcon: "icon.jpg",
    ...overrides
  };
}

describe("buildPlayerPlanLanes — spec eligibility", () => {
  it("the two-Paladin case: Holy and Retribution get different eligible lanes but share class-wide ones", () => {
    const holyLanes = buildPlayerPlanLanes(
      "member-holy",
      "Paladin",
      65,
      []
    );

    const retLanes = buildPlayerPlanLanes(
      "member-ret",
      "Paladin",
      70,
      []
    );

    expect(
      holyLanes.some(
        (lane) =>
          lane.abilityName === "Aura Mastery"
      )
    ).toBe(true);

    expect(
      retLanes.some(
        (lane) =>
          lane.abilityName === "Aura Mastery"
      )
    ).toBe(false);

    expect(
      holyLanes.some(
        (lane) =>
          lane.abilityName ===
          "Blessing of Protection"
      )
    ).toBe(true);

    expect(
      retLanes.some(
        (lane) =>
          lane.abilityName ===
          "Blessing of Protection"
      )
    ).toBe(true);
  });

  it("a spec change makes a previously-eligible spell's lane incompatible but keeps the assignment visible", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Paladin",
      70,
      [assignment({})]
    );

    const auraMasteryLane = lanes.find(
      (lane) => lane.spellId === 31821
    );

    expect(
      auraMasteryLane?.assignments
    ).toHaveLength(1);

    expect(
      auraMasteryLane?.isIncompatibleWithSpec
    ).toBe(true);
  });

  it("switching the spec back restores compatibility without recreating the assignment", () => {
    const assignments = [assignment({})];

    const asRetribution =
      buildPlayerPlanLanes(
        "member-1",
        "Paladin",
        70,
        assignments
      );

    const asHoly = buildPlayerPlanLanes(
      "member-1",
      "Paladin",
      65,
      assignments
    );

    expect(
      asRetribution.find(
        (lane) => lane.spellId === 31821
      )?.isIncompatibleWithSpec
    ).toBe(true);

    expect(
      asHoly.find(
        (lane) => lane.spellId === 31821
      )?.isIncompatibleWithSpec
    ).toBe(false);

    expect(
      asHoly.find(
        (lane) => lane.spellId === 31821
      )?.assignments
    ).toHaveLength(1);
  });

  it("a genuinely uncatalogued spell is never marked incompatible — it's simply not in the catalog", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Paladin",
      65,
      [
        assignment({
          spellId: 999999,
          abilityName: "Mystery Spell"
        })
      ]
    );

    const orphan = lanes.find(
      (lane) => lane.spellId === 999999
    );

    expect(
      orphan?.isIncompatibleWithSpec
    ).toBe(false);
  });

  it("UNKNOWN spec (null) still gets class-wide lanes, never zero, never a guess", () => {
    const lanes = buildPlayerPlanLanes(
      "member-1",
      "Paladin",
      null,
      []
    );

    expect(
      lanes.some(
        (lane) =>
          lane.abilityName ===
          "Blessing of Protection"
      )
    ).toBe(true);

    expect(
      lanes.some(
        (lane) =>
          lane.abilityName === "Aura Mastery"
      )
    ).toBe(false);
  });
});
