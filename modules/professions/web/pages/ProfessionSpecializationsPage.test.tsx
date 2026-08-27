import {
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type {
  ProfessionCharacterCoverage,
  ProfessionDetail,
  ProfessionOverviewItem
} from "../details/types/professionDetail.types";

const mocks = vi.hoisted(() => ({
  useProfessionDetail: vi.fn()
}));

const overviewItems: ProfessionOverviewItem[] = [
  {
    id: "profession-alchemy",
    key: "alchemy",
    name: "Alchemy",
    category: "CRAFTING",
    characterCount: 1,
    trackedCharacterCount: 1,
    activeNodeCount: 1,
    catalogRecipeCount: 1,
    capabilityCount: 1,
    captureStatus: "CAPTURED",
    lastCapturedAt: null
  },
  {
    id: "profession-blacksmithing",
    key: "blacksmithing",
    name: "Blacksmithing",
    category: "CRAFTING",
    characterCount: 2,
    trackedCharacterCount: 2,
    activeNodeCount: 2,
    catalogRecipeCount: 2,
    capabilityCount: 2,
    captureStatus: "CAPTURED",
    lastCapturedAt: null
  }
];

vi.mock(
  "../details/hooks/useProfessionOverview",
  () => ({
    useProfessionOverview: () => ({
      items: overviewItems,
      isLoading: false,
      error: null
    })
  })
);

vi.mock(
  "../details/hooks/useProfessionDetail",
  () => ({
    useProfessionDetail:
      mocks.useProfessionDetail
  })
);

const { ProfessionSpecializationsPage } =
  await import(
    "./ProfessionSpecializationsPage"
  );

function coverage(
  id: string,
  name: string,
  rank: number
): ProfessionCharacterCoverage {
  return {
    characterProfessionId:
      `assignment-${id}`,
    character: {
      id,
      name,
      realm: "Antonidas",
      className:
        id === "char-2"
          ? "Paladin"
          : "Warrior",
      level: 80
    },
    skill: 100,
    knowledgePoints: rank,
    dataStatus: "TRACKED",
    craftableEquipment: [],
    specializationEquipment: [],
    generalSpecialization: [],
    explicitSlotNodeRanks: [
      {
        capabilityKey:
          "Plate:CHEST",
        presentationGroup:
          "Armor",
        familyName: "Plate",
        slotKey: "CHEST",
        slotName: "Chest",
        nodeKey: "node-chest",
        nodeName: "Chestplates",
        nodeIconUrl: null,
        rank,
        maxRank: 25,
        hasProvenInvestment:
          rank > 0
      }
    ],
    slotSpecializationNodes: [],
    recipes: [],
    capabilities: []
  };
}

function detail(): ProfessionDetail {
  return {
    profession: {
      id:
        "profession-blacksmithing",
      key: "blacksmithing",
      name: "Blacksmithing",
      category: "CRAFTING"
    },
    specializationMappingAvailable:
      true,
    summary: {
      characterCount: 2,
      trackedCharacterCount: 2,
      missingCharacterCount: 0,
      craftableEquipmentCount: 0,
      catalogRecipeCount: 2,
      learnedRecipeCount: 0,
      catalogCapabilityCount: 2,
      coveredCapabilityCount: 0
    },
    characters: [
      coverage(
        "char-1",
        "Synblast",
        20
      ),
      coverage(
        "char-2",
        "Synjudge",
        0
      )
    ]
  };
}

describe("ProfessionSpecializationsPage", () => {
  it("honors profession and character deep links while keeping a zero-rank specific node visible", () => {
    mocks.useProfessionDetail
      .mockReturnValue({
        detail: detail(),
        isLoading: false,
        error: null
      });

    render(
      <MemoryRouter
        initialEntries={[
          "/professions/specializations?profession=profession-blacksmithing&character=char-2"
        ]}
      >
        <ProfessionSpecializationsPage />
      </MemoryRouter>
    );

    expect(
      mocks.useProfessionDetail
    ).toHaveBeenCalledWith(
      "profession-blacksmithing"
    );

    expect(
      screen.getByRole("link", {
        name: "Synjudge"
      })
    ).toHaveAttribute(
      "href",
      "/characters/char-2"
    );

    expect(
      screen.getByText("Chestplates")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("0/25")
        .length
    ).toBeGreaterThan(0);
  });
});
