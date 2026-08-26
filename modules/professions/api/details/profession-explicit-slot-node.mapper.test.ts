import { describe, expect, it } from "vitest";
import { mapProfessionExplicitSlotNodeRanks } from "./profession-explicit-slot-node.mapper.js";
import {
  catalog,
  createAssignment
} from "./profession-explicit-slot-node.mapper.fixtures.js";

describe("mapProfessionExplicitSlotNodeRanks", () => {
  it("shows 0/max for a curated slot with no investment at all, never omitting it", () => {
    const assignment =
      createAssignment([]);

    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        assignment,
        catalog,
        "leatherworking"
      );

    const wrist =
      ranks.find(
        (entry) =>
          entry.familyName ===
            "Leather" &&
          entry.slotKey === "WRIST"
      );

    expect(wrist).toEqual(
      expect.objectContaining({
        rank: 0,
        maxRank: 20
      })
    );
  });

  it("shows the specific node's real rank when the character invested there directly", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107884",
          rank: 15
        }
      ]);

    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        assignment,
        catalog,
        "leatherworking"
      );

    const wrist =
      ranks.find(
        (entry) =>
          entry.slotKey === "WRIST"
      );

    expect(wrist).toEqual(
      expect.objectContaining({
        nodeName:
          "Wonderful Wristguards",
        rank: 15,
        maxRank: 20
      })
    );
  });

  it("credits a bundle-only investment to every slot it covers, rather than showing a false 0/max", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107888",
          rank: 30
        }
      ]);

    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        assignment,
        catalog,
        "leatherworking"
      );

    const wrist =
      ranks.find(
        (entry) =>
          entry.slotKey === "WRIST"
      );

    const head =
      ranks.find(
        (entry) =>
          entry.slotKey === "HEAD"
      );

    expect(wrist).toEqual(
      expect.objectContaining({
        nodeName: "Securely Shaped",
        rank: 30,
        maxRank: 30
      })
    );

    expect(head).toEqual(
      expect.objectContaining({
        nodeName: "Securely Shaped",
        rank: 30,
        maxRank: 30
      })
    );
  });

  it("prefers the specific node over the bundle node when both are invested", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107884",
          rank: 15
        },
        {
          key: "addon:107888",
          rank: 30
        }
      ]);

    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        assignment,
        catalog,
        "leatherworking"
      );

    const wrist =
      ranks.find(
        (entry) =>
          entry.slotKey === "WRIST"
      );

    expect(wrist).toEqual(
      expect.objectContaining({
        nodeName:
          "Wonderful Wristguards",
        rank: 15,
        maxRank: 20
      })
    );
  });

  it("produces one entry per curated (family, slot) pair, covering both Leather and Mail", () => {
    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        createAssignment([]),
        catalog,
        "leatherworking"
      );

    const families = new Set(
      ranks.map(
        (entry) => entry.familyName
      )
    );

    expect(families).toEqual(
      new Set(["Leather", "Mail"])
    );

    expect(
      ranks.length
    ).toBeGreaterThanOrEqual(16);
  });
});
