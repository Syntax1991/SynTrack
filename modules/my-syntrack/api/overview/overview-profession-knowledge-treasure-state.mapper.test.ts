import { describe, expect, it } from "vitest";
import { resolveProfessionKnowledgeTreasureOverviewState } from "./overview-profession-knowledge-treasure-state.mapper.js";
import type { CharacterProfessionKnowledgeTreasureStatus } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

function character(
  overrides: Partial<CharacterProfessionKnowledgeTreasureStatus> = {}
): CharacterProfessionKnowledgeTreasureStatus {
  return {
    id: "char-1",
    name: "Synlight",
    treasures: zeroAggregate,
    professions: [],
    ...overrides
  };
}

describe("resolveProfessionKnowledgeTreasureOverviewState", () => {
  it("is NOT_TRACKED when no applicable treasures exist", () => {
    const { professionKnowledgeTreasures, attentionItem } =
      resolveProfessionKnowledgeTreasureOverviewState(
        character()
      );

    expect(professionKnowledgeTreasures.state).toBe(
      "NOT_TRACKED"
    );
    expect(attentionItem).toBeNull();
  });

  it("is READY when all 8/8 treasures are complete", () => {
    const { professionKnowledgeTreasures, attentionItem } =
      resolveProfessionKnowledgeTreasureOverviewState(
        character({
          treasures: {
            completeCount: 8,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 8
          }
        })
      );

    expect(professionKnowledgeTreasures.state).toBe("READY");
    expect(attentionItem).toBeNull();
  });

  it("is ATTENTION with a named-profession label when one treasure is proven missing", () => {
    const { professionKnowledgeTreasures, attentionItem } =
      resolveProfessionKnowledgeTreasureOverviewState(
        character({
          treasures: {
            completeCount: 7,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 8
          },
          professions: [
            {
              professionKey: "alchemy",
              name: "Alchemy",
              treasures: {
                completeCount: 7,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 8
              },
              sources: [
                {
                  sourceKey: "treasure-8",
                  name: "Treasure 8",
                  state: "INCOMPLETE",
                  capturedAt: null
                }
              ]
            }
          ]
        })
      );

    expect(professionKnowledgeTreasures.state).toBe(
      "ATTENTION"
    );
    expect(attentionItem?.domain).toBe(
      "profession-knowledge-treasure"
    );
    expect(attentionItem?.label).toBe(
      "Alchemy knowledge treasure missing"
    );
  });

  it("does NOT surface attention for an unresolved (UNKNOWN) treasure - only a proven-missing one counts", () => {
    const { professionKnowledgeTreasures, attentionItem } =
      resolveProfessionKnowledgeTreasureOverviewState(
        character({
          treasures: {
            completeCount: 7,
            incompleteCount: 0,
            unknownCount: 1,
            applicableTotal: 8
          }
        })
      );

    expect(professionKnowledgeTreasures.state).toBe(
      "UNKNOWN"
    );
    expect(attentionItem).toBeNull();
  });
});
