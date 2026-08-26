import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProfessionCharacterCoverage } from "../types/professionDetail.types";
import { ProfessionFindCraftBrowseCandidateRow } from "./ProfessionFindCraftBrowseCandidateRow";
import {
  createCrafter,
  mailWristRecipe
} from "./professionFindCraftBrowse.fixtures";

function createCoverage(
  slotSpecializationNodes: ProfessionCharacterCoverage["slotSpecializationNodes"]
): ProfessionCharacterCoverage {
  return {
    characterProfessionId:
      "assignment-1",

    character: {
      id: "character-1",
      name: "Synjudge",
      realm: "Antonidas",
      className: "Paladin",
      level: 80
    },

    skill: 100,
    knowledgePoints: 20,
    dataStatus: "TRACKED",
    craftableEquipment: [],
    specializationEquipment: [],
    generalSpecialization: [],
    explicitSlotNodeRanks: [],
    slotSpecializationNodes,
    recipes: [],
    capabilities: []
  };
}

function createSlotNode(
  overrides: Partial<
    ProfessionCharacterCoverage["slotSpecializationNodes"][number]
  >
): ProfessionCharacterCoverage["slotSpecializationNodes"][number] {
  const familyName =
    overrides.familyName ?? "Mail";
  const slotKey =
    overrides.slotKey ?? "WRIST";

  return {
    capabilityKey: `${familyName}:${slotKey}`,
    presentationGroup: familyName,
    familyName,
    slotKey,
    slotName: "Wrist",
    nodeKey: "addon:107988",
    nodeName: "Balanced Bracers",
    nodeIconUrl: null,
    rank: 0,
    maxRank: 20,
    ...overrides
  };
}

function createCandidate() {
  const crafter = createCrafter({
    characterId: "character-1",
    name: "Synjudge"
  });

  return {
    characterId: "character-1",
    characterName: "Synjudge",
    knownRecipeCount: 1,
    representativeRecipe:
      mailWristRecipe(
        "Scout's Scaled Bracers",
        [crafter]
      ),
    representativeCrafter: crafter
  };
}

describe("ProfessionFindCraftBrowseCandidateRow", () => {
  it("Mail + Wrist + Synfel acceptance case: renders the concrete node name with its rank, never a naked rank", () => {
    const coverage = createCoverage([
      createSlotNode({
        nodeName: "Balanced Bracers",
        rank: 15,
        maxRank: 20
      })
    ]);

    render(
      <ProfessionFindCraftBrowseCandidateRow
        candidate={createCandidate()}
        coverage={coverage}
        slotContext={{
          familyName: "Mail",
          slotKey: "WRIST"
        }}
        specializationEquipment={[]}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText(
        "Balanced Bracers 15/20"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText("15/20")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /not specialized/i
      )
    ).not.toBeInTheDocument();
  });

  it("shows a zero-rank node's concrete name alongside 0/max, never a naked 0/max", () => {
    const coverage = createCoverage([
      createSlotNode({
        slotKey: "HANDS",
        slotName: "Hands",
        nodeName: "Cutting Claws",
        rank: 0,
        maxRank: 20
      })
    ]);

    render(
      <ProfessionFindCraftBrowseCandidateRow
        candidate={createCandidate()}
        coverage={coverage}
        slotContext={{
          familyName: "Mail",
          slotKey: "HANDS"
        }}
        specializationEquipment={[]}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText(
        "Cutting Claws 0/20"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText("0/20")
    ).not.toBeInTheDocument();
  });

  it("Mail + Hands + Synjudge acceptance case: shows every relevant node with its own name and rank, never collapsed", () => {
    const coverage = createCoverage([
      createSlotNode({
        nodeKey: "addon:107987",
        nodeName: "Advanced Armor",
        slotKey: "HANDS",
        slotName: "Hands",
        rank: 30,
        maxRank: 30
      }),
      createSlotNode({
        nodeKey: "addon:107985",
        nodeName: "Cutting Claws",
        slotKey: "HANDS",
        slotName: "Hands",
        rank: 0,
        maxRank: 20
      })
    ]);

    render(
      <ProfessionFindCraftBrowseCandidateRow
        candidate={createCandidate()}
        coverage={coverage}
        slotContext={{
          familyName: "Mail",
          slotKey: "HANDS"
        }}
        specializationEquipment={[]}
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText(
        "Advanced Armor 30/30"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Cutting Claws 0/20"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "30/30 · 0/20"
      )
    ).not.toBeInTheDocument();
  });

  it("falls back to the alignment label when there is no slot context (e.g. a non-armor category)", () => {
    const coverage = createCoverage(
      []
    );

    render(
      <ProfessionFindCraftBrowseCandidateRow
        candidate={createCandidate()}
        coverage={coverage}
        slotContext={null}
        specializationEquipment={[]}
        specializationMappingAvailable
      />
    );

    expect(
      screen.queryByText(
        /^\d+\/\d+$/
      )
    ).not.toBeInTheDocument();
  });
});
