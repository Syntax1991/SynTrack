import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProfessionCharacterCoverage } from "../types/professionDetail.types";
import { ProfessionSpecializationCharacter } from "./ProfessionSpecializationCharacter";

function createCoverage(
  explicitSlotNodeRanks: ProfessionCharacterCoverage["explicitSlotNodeRanks"]
): ProfessionCharacterCoverage {
  return {
    characterProfessionId:
      "assignment-1",

    character: {
      id: "character-1",
      name: "Synblast",
      realm: "Antonidas",
      className: "Shaman",
      level: 80
    },

    skill: 100,
    knowledgePoints: 20,
    dataStatus: "TRACKED",
    craftableEquipment: [],
    specializationEquipment: [],
    generalSpecialization: [],
    explicitSlotNodeRanks,
    slotSpecializationNodes: [],
    recipes: [],
    capabilities: []
  };
}

function createSlotRank(
  overrides: Partial<
    ProfessionCharacterCoverage["explicitSlotNodeRanks"][number]
  >
): ProfessionCharacterCoverage["explicitSlotNodeRanks"][number] {
  const familyName =
    overrides.familyName ?? "Leather";
  const slotKey =
    overrides.slotKey ?? "WRIST";

  return {
    capabilityKey: `${familyName}:${slotKey}`,
    presentationGroup: familyName,
    familyName,
    slotKey,
    slotName: "Wrist",
    nodeKey: "addon:107884",
    nodeName: "Wonderful Wristguards",
    nodeIconUrl: null,
    rank: 0,
    maxRank: 20,
    hasProvenInvestment:
      (overrides.rank ?? 0) > 0,
    ...overrides
  };
}

/*
 * Each rank is rendered both in the visible row and inside its
 * (CSS-hidden but DOM-present) tooltip content, so more than one match
 * for the same rank text is expected - assert presence, not uniqueness.
 */
function expectRankVisible(
  text: string
) {
  expect(
    screen.getAllByText(text).length
  ).toBeGreaterThan(0);
}

describe("ProfessionSpecializationCharacter", () => {
  it("shows 0/20 explicitly for an uninvested slot, never silently omitting it", () => {
    const coverage = createCoverage([
      createSlotRank({
        slotKey: "HEAD",
        slotName: "Head",
        nodeName: "Capable Caps",
        rank: 0,
        maxRank: 20
      })
    ]);

    render(
      <ProfessionSpecializationCharacter
        coverage={coverage}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText("Head")
    ).toBeInTheDocument();

    expectRankVisible("0/20");
  });

  it("shows both invested and uninvested slots side by side, grouped under their armor family", () => {
    const coverage = createCoverage([
      createSlotRank({
        slotKey: "CHEST",
        slotName: "Chest",
        nodeName: "Terrific Tunics",
        rank: 30,
        maxRank: 30
      }),
      createSlotRank({
        slotKey: "FEET",
        slotName: "Feet",
        nodeName: "Tasteful Treads",
        rank: 0,
        maxRank: 20
      })
    ]);

    render(
      <ProfessionSpecializationCharacter
        coverage={coverage}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText("Leather")
    ).toBeInTheDocument();

    expectRankVisible("30/30");
    expectRankVisible("0/20");
  });

  it("groups slots under both Leather and Mail family headings when both are covered", () => {
    const coverage = createCoverage([
      createSlotRank({
        familyName: "Leather",
        slotKey: "WRIST",
        slotName: "Wrist",
        rank: 20,
        maxRank: 20
      }),
      createSlotRank({
        familyName: "Mail",
        slotKey: "WRIST",
        slotName: "Wrist",
        nodeName: "Balanced Bracers",
        rank: 6,
        maxRank: 20
      })
    ]);

    render(
      <ProfessionSpecializationCharacter
        coverage={coverage}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText("Leather")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Mail")
    ).toBeInTheDocument();

    expectRankVisible("20/20");
    expectRankVisible("6/20");
  });

  it("Blacksmithing acceptance case: Plate and Shield claims render under one shared 'Armor' heading via presentationGroup, never two separate headings", () => {
    const coverage = createCoverage([
      createSlotRank({
        presentationGroup: "Armor",
        familyName: "Plate",
        slotKey: "CHEST",
        slotName: "Chest",
        nodeName: "Chestplates",
        rank: 20,
        maxRank: 25
      }),
      createSlotRank({
        presentationGroup: "Armor",
        familyName: "Shield",
        slotKey: "OFF_HAND",
        slotName: "Shield",
        nodeName: "Shields",
        rank: 16,
        maxRank: 25
      })
    ]);

    render(
      <ProfessionSpecializationCharacter
        coverage={coverage}
        specializationMappingAvailable
      />
    );

    const headings =
      document.querySelectorAll(
        ".profession-specialization-family-name"
      );

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(
      "Armor"
    );

    expect(
      screen.getByText("Chest")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Shield")
    ).toBeInTheDocument();

    expectRankVisible("20/25");
    expectRankVisible("16/25");

    expect(
      coverage.explicitSlotNodeRanks.map(
        (entry) => entry.familyName
      )
    ).toEqual(["Plate", "Shield"]);
  });

  it("Jewelcrafting acceptance case: renders a family-less accessory shape (Neck/Ring, no armor family) with the same generic grouping, no profession-specific code", () => {
    const coverage = createCoverage([
      createSlotRank({
        familyName: "Jewelry",
        slotKey: "NECK",
        slotName: "Neck",
        nodeKey: "addon:107057",
        nodeName: "Luxurious Lockets",
        rank: 18,
        maxRank: 40
      }),
      createSlotRank({
        familyName: "Jewelry",
        slotKey: "FINGER",
        slotName: "Ring",
        nodeKey: "addon:107058",
        nodeName: "Regal Rings",
        rank: 0,
        maxRank: 40
      })
    ]);

    render(
      <ProfessionSpecializationCharacter
        coverage={coverage}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText("Jewelry")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Neck")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Ring")
    ).toBeInTheDocument();

    expectRankVisible("18/40");
    expectRankVisible("0/40");
  });

  it("shows the unavailable-mapping message when specialization mapping is not available for this profession", () => {
    const coverage = createCoverage(
      []
    );

    render(
      <ProfessionSpecializationCharacter
        coverage={coverage}
        specializationMappingAvailable={
          false
        }
      />
    );

    expect(
      screen.getByText(
        /does not yet have/i
      )
    ).toBeInTheDocument();
  });
});
