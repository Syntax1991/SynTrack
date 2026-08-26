import { describe, expect, it } from "vitest";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import {
  createAssignment,
  createProgress
} from "./profession-specialization-equipment.mapper.fixtures.js";

describe("mapProfessionSpecializationEquipment - bundle vs specific node preference", () => {
  it("prefers the specific single-slot node over the multi-slot bundle node for the same pair", () => {
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
        }),

        createProgress({
          rank: 31,
          knowledgeRank: 30,

          node: {
            key: "addon:107888",
            name: "Securely Shaped",
            maxRank: 31,
            knowledgeMaxRank: 30
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    const wristClaim =
      claims.find(
        (claim) => claim.slotKey === "WRIST"
      );

    expect(wristClaim).toEqual(
      expect.objectContaining({
        nodeName: "Wonderful Wristguards",
        rank: 15,
        maxRank: 20
      })
    );
  });

  it("falls back to the bundle node when only it was invested", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 31,
          knowledgeRank: 30,

          node: {
            key: "addon:107888",
            name: "Securely Shaped",
            maxRank: 31,
            knowledgeMaxRank: 30
          }
        })
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "leatherworking"
      );

    expect(
      claims.filter(
        (claim) => claim.nodeName === "Securely Shaped"
      )
    ).toHaveLength(4);
  });
});
