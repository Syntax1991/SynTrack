import { describe, expect, it } from "vitest";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import {
  createAssignment,
  createProgress
} from "./profession-specialization-equipment.mapper.fixtures.js";

describe("mapProfessionSpecializationEquipment", () => {
  it("credits Wonderful Wristguards investment as Leather Wrist specialization", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 16,
          knowledgeRank: 15,

          node: {
            key: "addon:107884",
            name: "Wonderful Wristguards",
            maxRank: 21,
            knowledgeMaxRank: 20
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        familyName: "Leather",
        slotKey: "WRIST",
        rank: 15,
        maxRank: 20,
        nodeName: "Wonderful Wristguards"
      })
    ]);
  });

  it("carries the node's resolved iconUrl through to the equipment claim untouched", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 16,
          knowledgeRank: 15,

          node: {
            key: "addon:107884",
            name: "Wonderful Wristguards",
            iconUrl:
              "https://render.worldofwarcraft.com/icons/56/inv_wonderful_wristguards.jpg"
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        nodeName: "Wonderful Wristguards",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_wonderful_wristguards.jpg"
      })
    ]);
  });

  it("does not credit Mail Wrist specialization from a Leather Wrist investment", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 16,
          knowledgeRank: 15,

          node: {
            key: "addon:107884",
            name: "Wonderful Wristguards"
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    expect(
      claims.some(
        (claim) =>
          claim.familyName === "Mail" &&
          claim.slotKey === "WRIST"
      )
    ).toBe(false);
  });

  it("does not credit specialization for a node with zero investment", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 1,
          knowledgeRank: 0,

          node: {
            key: "addon:107885",
            name: "Mighty Mantles"
          }
        })
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      )
    ).toEqual([]);
  });

  it("does not credit the wrong slot for a correctly-invested family", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 21,
          knowledgeRank: 20,

          node: {
            key: "addon:107887",
            name: "Terrific Tunics"
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        familyName: "Leather",
        slotKey: "CHEST"
      })
    ]);

    expect(
      claims.some(
        (claim) => claim.slotKey === "WRIST"
      )
    ).toBe(false);
  });

  it("does not credit the wrong family for a correctly-invested slot", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 8,
          knowledgeRank: 7,

          node: {
            key: "addon:107988",
            name: "Balanced Bracers"
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        familyName: "Mail",
        slotKey: "WRIST"
      })
    ]);

    expect(
      claims.some(
        (claim) => claim.familyName === "Leather"
      )
    ).toBe(false);
  });

  it("produces no claim for an uncurated node key, never guessing from its name", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 21,
          knowledgeRank: 20,

          node: {
            key: "addon:999999",
            name: "Wonderful Wristguards"
          }
        })
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      )
    ).toEqual([]);
  });

  it("does not establish a family/slot claim from a generic node name alone", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 21,
          knowledgeRank: 20,

          node: {
            key: "addon:555",
            name: "Bracers"
          }
        })
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      )
    ).toEqual([]);
  });
});
