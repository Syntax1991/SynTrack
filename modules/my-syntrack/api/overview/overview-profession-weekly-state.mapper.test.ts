import { describe, expect, it } from "vitest";
import { resolveProfessionWeeklyOverviewState } from "./overview-profession-weekly-state.mapper.js";
import type { CharacterProfessionWeeklyStatus } from "../profession-weekly/profession-weekly-status.types.js";

function character(
  overrides: Partial<CharacterProfessionWeeklyStatus> = {}
): CharacterProfessionWeeklyStatus {
  return {
    id: "char-1",
    name: "Synlight",
    profKp: {
      completeCount: 0,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 0
    },
    drops: {
      completeCount: 0,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 0
    },
    professions: [],
    ...overrides
  };
}

describe("resolveProfessionWeeklyOverviewState", () => {
  it("is NOT_TRACKED when no applicable Prof KP sources exist", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(character());

    expect(professionWeekly.state).toBe("NOT_TRACKED");
    expect(attentionItem).toBeNull();
  });

  it("is READY when every applicable source is COMPLETE", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          profKp: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          }
        })
      );

    expect(professionWeekly.state).toBe("READY");
    expect(attentionItem).toBeNull();
  });

  it("is ATTENTION with a labeled action when a source is known INCOMPLETE", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          profKp: {
            completeCount: 1,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 2
          },
          professions: [
            {
              professionKey: "alchemy",
              name: "Alchemy",
              profKp: {
                completeCount: 1,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 2
              },
              sources: [
                {
                  sourceKey: "weekly-quest",
                  name: "Weekly Quest",
                  sourceType: "WEEKLY_QUEST",
                  state: "COMPLETE",
                  currentValue: null,
                  maxValue: null,
                  capturedAt: null
                },
                {
                  sourceKey: "treatise",
                  name: "Treatise",
                  sourceType: "TREATISE",
                  state: "INCOMPLETE",
                  currentValue: null,
                  maxValue: null,
                  capturedAt: null
                }
              ],
              drops: null
            }
          ]
        })
      );

    expect(professionWeekly.state).toBe("ATTENTION");
    expect(attentionItem?.domain).toBe("profession-weekly");
    expect(attentionItem?.detail).toContain(
      "Alchemy Treatise"
    );
  });

  it("is UNKNOWN (not ATTENTION) when nothing is known incomplete but evidence is missing", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          profKp: {
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

  it("critical regression: an incomplete Knowledge Drops never makes Prof KP ATTENTION", () => {
    const { professionWeekly, attentionItem } =
      resolveProfessionWeeklyOverviewState(
        character({
          profKp: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
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
