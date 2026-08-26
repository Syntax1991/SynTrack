import { describe, expect, it } from "vitest";
import { normalizeCatalog } from "./addon-import.catalog.normalizer.js";

describe("normalizeCatalog", () => {
  it("carries a node's spellId through from the raw addon payload, purely by field, never derived from its name", () => {
    const catalog = normalizeCatalog(
      "1234",
      {
        skillLineId: 1234,
        displayName: "Leatherworking",
        expansionName: "Midnight",
        tabs: {
          1: {
            treeId: 1,
            name: "Lasting Leather",
            rootNodeId: 100,
            nodes: {
              1: {
                nodeId: 100,
                type: 1,
                name: "Lasting Leather",
                maxRanks: 30,
                spellId: 555111
              },
              2: {
                nodeId: 101,
                type: 1,
                name: "Wonderful Wristguards",
                maxRanks: 20,
                spellId: 555222
              }
            }
          }
        }
      }
    );

    const nodes =
      catalog?.trees[0]?.nodes ?? [];

    expect(
      nodes.find(
        (node) =>
          node.externalNodeId === 100
      )
    ).toEqual(
      expect.objectContaining({
        spellId: 555111
      })
    );

    expect(
      nodes.find(
        (node) =>
          node.externalNodeId === 101
      )
    ).toEqual(
      expect.objectContaining({
        spellId: 555222
      })
    );
  });

  it("carries a null spellId through as null when the addon captured none, never inventing one from the node name", () => {
    const catalog = normalizeCatalog(
      "1234",
      {
        skillLineId: 1234,
        displayName: "Leatherworking",
        expansionName: "Midnight",
        tabs: {
          1: {
            treeId: 1,
            name: "Lasting Leather",
            rootNodeId: 100,
            nodes: {
              1: {
                nodeId: 100,
                type: 1,
                name: "Flawless Fortes"
              }
            }
          }
        }
      }
    );

    const node =
      catalog?.trees[0]?.nodes[0];

    expect(node?.spellId).toBeNull();
  });
});
