import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { baseInput } from "./overview.aggregator.fixtures.js";

describe("aggregateCharacterWeeklyStates - professions", () => {
  it("missing/unknown profession data does NOT become Ready - it is NOT_TRACKED", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput()
      );

    expect(
      characters[0]!.professions
        .state
    ).toBe("NOT_TRACKED");

    expect(
      characters[0]!.professions
        .state
    ).not.toBe("READY");
  });

  it("a PARTIAL profession (specialization captured, no recipes) produces ATTENTION, never a silent Ready", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          professionByCharacterId:
            new Map([
              [
                "char-1",
                {
                  id: "char-1",
                  name: "Synblast",
                  hasTrackedProfession:
                    false,
                  partialProfessionIssues:
                    [
                      "Blacksmithing: specialization progress captured, but no recipes or capabilities imported yet"
                    ],
                  professions: [
                    {
                      professionId:
                        "profession-1",
                      key:
                        "blacksmithing",
                      name:
                        "Blacksmithing",
                      category:
                        "CRAFTING",
                      skill: 100,
                      knowledgePoints: 0,
                      dataStatus:
                        "PARTIAL"
                    }
                  ]
                }
              ]
            ])
        })
      );

    expect(
      characters[0]!.professions
        .state
    ).toBe("ATTENTION");

    expect(
      characters[0]!.professions
        .issueCount
    ).toBe(1);

    expect(
      characters[0]!.professions
        .items[0]?.professionId
    ).toBe("profession-1");
  });
});
