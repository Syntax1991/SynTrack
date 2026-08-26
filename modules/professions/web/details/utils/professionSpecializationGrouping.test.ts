import { describe, expect, it } from "vitest";
import type {
  ProfessionCharacterCoverage,
  ProfessionSpecializationEquipmentClaim
} from "../types/professionDetail.types";
import {
  getUnspecializedCharacterNames,
  groupSpecializationClaimsByNode
} from "./professionSpecializationGrouping";

function createClaim(
  overrides: Partial<ProfessionSpecializationEquipmentClaim> &
    Pick<
      ProfessionSpecializationEquipmentClaim,
      "familyName" | "slotKey" | "slotName"
    >
): ProfessionSpecializationEquipmentClaim {
  return {
    id: `${overrides.familyName}:${overrides.slotKey}`,
    provenance: "CURATED_VERIFIED",
    kind: "EQUIPMENT_SLOT",
    capabilityKey: `${overrides.familyName}:${overrides.slotKey}`,
    presentationGroup: overrides.familyName,
    rank: 20,
    maxRank: 20,
    nodeName: "Securely Shaped",
    nodeKey: "addon:107888",
    nodeIconUrl: null,
    ...overrides
  };
}

describe("groupSpecializationClaimsByNode", () => {
  it("preserves the node's iconUrl on the group untouched", () => {
    const claims = [
      createClaim({
        familyName: "Leather",
        slotKey: "CHEST",
        slotName: "Chest",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
      })
    ];

    const groups =
      groupSpecializationClaimsByNode(
        claims
      );

    expect(groups).toEqual([
      expect.objectContaining({
        nodeKey: "addon:107888",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
      })
    ]);
  });

  it("keeps a single node's iconUrl identity when multiple claims for that node (a multi-slot bundle) are grouped together", () => {
    const claims = [
      createClaim({
        familyName: "Leather",
        slotKey: "CHEST",
        slotName: "Chest",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
      }),
      createClaim({
        familyName: "Leather",
        slotKey: "HEAD",
        slotName: "Head",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
      }),
      createClaim({
        familyName: "Leather",
        slotKey: "SHOULDER",
        slotName: "Shoulder",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
      })
    ];

    const groups =
      groupSpecializationClaimsByNode(
        claims
      );

    expect(groups).toHaveLength(1);

    expect(groups[0]).toEqual(
      expect.objectContaining({
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg",
        slotNames: [
          "Chest",
          "Head",
          "Shoulder"
        ]
      })
    );
  });

  it("has no iconUrl for a node SynTrack has not resolved one for yet", () => {
    const claims = [
      createClaim({
        familyName: "Mail",
        slotKey: "WRIST",
        slotName: "Wrist",
        nodeName: "Balanced Bracers",
        nodeKey: "addon:107988",
        nodeIconUrl: null
      })
    ];

    const groups =
      groupSpecializationClaimsByNode(
        claims
      );

    expect(groups[0].nodeIconUrl).toBeNull();
  });
});

describe("getUnspecializedCharacterNames", () => {
  function createCoverage(
    specializationEquipment: ProfessionSpecializationEquipmentClaim[]
  ): ProfessionCharacterCoverage {
    return {
      characterProfessionId: "assignment-1",
      character: {
        id: "character-1",
        name: "Synspin",
        realm: "Antonidas",
        className: "Monk",
        level: 80
      },
      skill: 100,
      knowledgePoints: 20,
      dataStatus: "TRACKED",
      craftableEquipment: [],
      specializationEquipment,
      generalSpecialization: [],
      explicitSlotNodeRanks: [],
      slotSpecializationNodes: [],
      recipes: [],
      capabilities: []
    };
  }

  it("Synspin acceptance case: a character with only a verified CRAFT_CATEGORY weapon claim (unmapped exact weapon subclass) is NOT reported as unspecialized", () => {
    const synspin = createCoverage([
      createClaim({
        kind: "CRAFT_CATEGORY",
        familyName: "Weapon",
        slotKey: "LONG_BLADES",
        slotName: "Long Blades",
        nodeName: "Long Blades",
        nodeKey: "addon:104630",
        rank: 7,
        maxRank: 25
      })
    ]);

    expect(
      getUnspecializedCharacterNames([synspin])
    ).toEqual([]);
  });

  it("still reports a character with zero claims as unspecialized", () => {
    const unspecializedCharacter =
      createCoverage([]);

    expect(
      getUnspecializedCharacterNames([
        unspecializedCharacter
      ])
    ).toEqual(["Synspin"]);
  });
});
