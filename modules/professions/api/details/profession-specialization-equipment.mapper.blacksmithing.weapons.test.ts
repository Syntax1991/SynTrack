import { describe, expect, it } from "vitest";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import type { DetailAssignment } from "./profession-specialization-node-catalog.helpers.js";

type Assignment = DetailAssignment;

function createAssignment(
  nodeProgress: {
    key: string;
    rank: number;
    name?: string;
  }[]
): Assignment {
  return {
    nodeProgress: nodeProgress.map(
      (entry) => ({
        rank: entry.rank,
        knowledgeRank: entry.rank,

        node: {
          key: entry.key,
          name: entry.name ?? "Unnamed Node",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

describe("Blacksmithing weapon-type specialization mapping", () => {
  it("credits Axes and Polearms investment as both an Axe and a Polearm claim (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104627",
          rank: 20,
          name: "Axes and Polearms"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(
      claims.map((claim) => claim.slotKey).sort()
    ).toEqual(["AXE", "POLEARM"]);

    expect(claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capabilityKey: "blacksmithing.weapon.axe",
          kind: "WEAPON_TYPE",
          rank: 20
        }),
        expect.objectContaining({
          capabilityKey: "blacksmithing.weapon.polearm",
          kind: "WEAPON_TYPE",
          rank: 20
        })
      ])
    );
  });

  it("credits Maces investment independently of Axes and Polearms", () => {
    const assignment =
      createAssignment([
        { key: "addon:104628", rank: 25, name: "Maces" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        capabilityKey: "blacksmithing.weapon.mace",
        slotKey: "MACE",
        rank: 25
      })
    ]);
  });

  it("prefers the specific Axes and Polearms node over the Hafted Weapons bundle for Axe and Polearm", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104627",
          rank: 7,
          name: "Axes and Polearms"
        },
        {
          key: "addon:104629",
          rank: 25,
          name: "Hafted Weapons"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    const axeClaim = claims.find(
      (claim) => claim.slotKey === "AXE"
    );
    const maceClaim = claims.find(
      (claim) => claim.slotKey === "MACE"
    );

    expect(axeClaim).toEqual(
      expect.objectContaining({
        nodeName: "Axes and Polearms",
        rank: 7
      })
    );

    expect(maceClaim).toEqual(
      expect.objectContaining({
        nodeName: "Hafted Weapons",
        rank: 25
      })
    );
  });

  it("credits a Hafted Weapons-only investment to Axe, Mace, and Polearm alike", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104629",
          rank: 25,
          name: "Hafted Weapons"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(
      claims.map((claim) => claim.slotKey).sort()
    ).toEqual(["AXE", "MACE", "POLEARM"]);
  });
});

describe("Blacksmithing verified-category (unmapped weapon subclass) mapping", () => {
  it("Synspin acceptance case: Long Blades and Short Blades both appear as CRAFT_CATEGORY claims sourced from real imported ranks, with Blades correctly suppressed", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104630",
          rank: 7,
          name: "Long Blades"
        },
        {
          key: "addon:104631",
          rank: 25,
          name: "Short Blades"
        },
        {
          key: "addon:104632",
          rank: 25,
          name: "Blades"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        kind: "CRAFT_CATEGORY",
        capabilityKey:
          "blacksmithing.weapon.long_blades",
        slotName: "Long Blades",
        nodeName: "Long Blades",
        rank: 7
      }),
      expect.objectContaining({
        kind: "CRAFT_CATEGORY",
        capabilityKey:
          "blacksmithing.weapon.short_blades",
        slotName: "Short Blades",
        nodeName: "Short Blades",
        rank: 25
      })
    ]);

    expect(
      claims.some(
        (claim) => claim.nodeName === "Blades"
      )
    ).toBe(false);
  });

  it("does not invent a weapon-type label - the CRAFT_CATEGORY slotName is the node's own real name, not a guessed subclass like Sword or Dagger", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104630",
          rank: 20,
          name: "Long Blades"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        slotName: "Long Blades"
      })
    ]);

    expect(
      claims.some((claim) =>
        ["Sword", "Dagger", "Axe", "Mace", "Polearm"].includes(
          claim.slotName
        )
      )
    ).toBe(false);
  });

  it("credits a Blades-only investment to both Long Blades and Short Blades", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104632",
          rank: 25,
          name: "Blades"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(
      claims.map((claim) => claim.slotName).sort()
    ).toEqual(["Long Blades", "Short Blades"]);
  });
});

describe("Blacksmithing profession-gear specialization mapping", () => {
  it("credits Trade Accessories investment as a Profession Accessory claim (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104256",
          rank: 25,
          name: "Trade Accessories"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        slotKey: "PROFESSION_ACCESSORY",
        presentationGroup: "Profession Gear",
        rank: 25
      })
    ]);
  });

  it("credits Trade Tools investment as a Profession Tool claim independently of Trade Accessories", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104257",
          rank: 25,
          name: "Trade Tools"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        slotKey: "PROFESSION_TOOL",
        presentationGroup: "Profession Gear",
        rank: 25
      })
    ]);
  });

  it("does not credit Tool Stones, a consumable buff rather than equipment", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104255",
          rank: 25,
          name: "Tool Stones"
        }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      )
    ).toEqual([]);
  });
});
