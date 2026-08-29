import { describe, expect, it } from "vitest";
import { resolveProfessionWeeklyOverviewState } from "./overview-profession-weekly-state.mapper.js";
import type { CharacterProfessionWeeklyStatus } from "../profession-weekly/profession-weekly-status.types.js";

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

function character(
  overrides: Partial<CharacterProfessionWeeklyStatus> = {}
): CharacterProfessionWeeklyStatus {
  return {
    id: "char-1",
    name: "Synlight",
    quest: zeroAggregate,
    treatise: zeroAggregate,
    drops: zeroAggregate,
    professions: [],
    ...overrides
  };
}

describe("resolveProfessionWeeklyOverviewState", () => {
  it("is NOT_TRACKED when no applicable Quest/Treatise sources exist", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(character());

    expect(professionWeekly.state).toBe("NOT_TRACKED");
    expect(attentionItem).toBeNull();
  });

  it("is READY when Quest and Treatise are both fully complete", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          quest: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 1
          },
          treatise: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 1
          }
        })
      );

    expect(professionWeekly.state).toBe("READY");
    expect(attentionItem).toBeNull();
  });

  it("is ATTENTION with a precise labeled action when Treatise is INCOMPLETE, naming the profession and source", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          quest: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 1
          },
          treatise: {
            completeCount: 0,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 1
          },
          professions: [
            {
              professionKey: "alchemy",
              name: "Alchemy",
              quest: {
                sourceKey: "weekly-quest",
                name: "Weekly Quest",
                sourceType: "WEEKLY_QUEST",
                state: "COMPLETE",
                currentValue: null,
                maxValue: null,
                capturedAt: null
              },
              treatise: {
                sourceKey: "treatise",
                name: "Treatise",
                sourceType: "TREATISE",
                state: "INCOMPLETE",
                currentValue: null,
                maxValue: null,
                capturedAt: null
              },
              drops: null
            }
          ]
        })
      );

    expect(professionWeekly.state).toBe("ATTENTION");
    expect(attentionItem?.domain).toBe("profession-weekly");
    expect(attentionItem?.label).toBe(
      "Alchemy Treatise remaining"
    );
    expect(attentionItem?.detail).toBe("Alchemy Treatise");
  });

  it("is ATTENTION when only the Weekly Quest is incomplete, never conflating it with Treatise", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          quest: {
            completeCount: 0,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 1
          },
          treatise: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 1
          },
          professions: [
            {
              professionKey: "blacksmithing",
              name: "Blacksmithing",
              quest: {
                sourceKey: "weekly-quest",
                name: "Weekly Quest",
                sourceType: "WEEKLY_QUEST",
                state: "INCOMPLETE",
                currentValue: null,
                maxValue: null,
                capturedAt: null
              },
              treatise: {
                sourceKey: "treatise",
                name: "Treatise",
                sourceType: "TREATISE",
                state: "COMPLETE",
                currentValue: null,
                maxValue: null,
                capturedAt: null
              },
              drops: null
            }
          ]
        })
      );

    expect(professionWeekly.state).toBe("ATTENTION");
    expect(attentionItem?.label).toBe(
      "Blacksmithing Weekly Quest remaining"
    );
  });

  it("is UNKNOWN (not ATTENTION) when nothing is known incomplete but evidence is missing", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          quest: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 1,
            applicableTotal: 2
          }
        })
      );

    expect(professionWeekly.state).toBe("UNKNOWN");
    expect(attentionItem).toBeNull();
  });

  it("critical regression: an incomplete Knowledge Drops never makes Quest/Treatise ATTENTION", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          quest: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 1
          },
          treatise: {
            completeCount: 1,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 1
          },
          drops: {
            completeCount: 0,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 1
          }
        })
      );

    expect(professionWeekly.state).toBe("READY");
    expect(attentionItem).toBeNull();
  });
});
