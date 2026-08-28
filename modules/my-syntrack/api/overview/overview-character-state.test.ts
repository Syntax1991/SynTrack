import { describe, expect, it } from "vitest";
import { findCharacterControlDetail } from "./overview-character-state.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput,
  period
} from "./overview.aggregator.fixtures.js";
import type { OverviewResponse } from "./overview.types.js";

function buildOverview(): OverviewResponse {
  const { characters, attentionItems, summary } =
    aggregateCharacterWeeklyStates(
      baseInput({
        characters: [
          baseCharacter({
            id: "char-1",
            name: "Synblast"
          }),
          baseCharacter({
            id: "char-2",
            name: "Synbloom"
          })
        ],
        professionByCharacterId:
          new Map([
            [
              "char-1",
              {
                id: "char-1",
                name: "Synblast",
                hasTrackedProfession:
                  true,
                partialProfessionIssues:
                  [],
                professions: [
                  {
                    professionId:
                      "alchemy",
                    key: "alchemy",
                    name: "Alchemy",
                    category:
                      "CRAFTING",
                    skill: 100,
                    knowledgePoints: 40,
                    dataStatus:
                      "TRACKED"
                  }
                ]
              }
            ],
            [
              "char-2",
              {
                id: "char-2",
                name: "Synbloom",
                hasTrackedProfession:
                  true,
                partialProfessionIssues:
                  [],
                professions: [
                  {
                    professionId:
                      "herbalism",
                    key:
                      "herbalism",
                    name:
                      "Herbalism",
                    category:
                      "GATHERING",
                    skill: 100,
                    knowledgePoints: 0,
                    dataStatus:
                      "TRACKED"
                  }
                ]
              }
            ]
          ])
      })
    );

  return {
    summary: {
      ...summary,
      refreshNeededCount: 0
    },
    attentionItems,
    characters: characters.map(
      (state) => ({
        ...state,
        tags: [],
        health: {
          characterId:
            state.character.id,
          character: {
            state: "MANUAL",
            lastSyncedAt: null
          },
          professions: {
            state: "NOT_TRACKED",
            items: []
          },
          gear: {
            state: "NOT_TRACKED",
            lastSyncedAt: null
          },
          resources: {
            state: "NOT_TRACKED",
            lastSyncedAt: null
          },
          professionWeekly: {
            state: "NOT_TRACKED",
            items: []
          }
        }
      })
    ),
    trackerColumns: [],
    activeScope: null,
    accountResources: []
  };
}

describe("findCharacterControlDetail", () => {
  it("returns the requested character's own state, never another character's", () => {
    const overview = buildOverview();

    const detail = findCharacterControlDetail(
      overview,
      "char-2"
    );

    expect(detail).not.toBeNull();
    expect(detail?.character.character.id).toBe(
      "char-2"
    );
    expect(
      detail?.character.character.name
    ).toBe("Synbloom");

    expect(
      detail?.character.professions
        .items.map(
          (item) => item.name
        )
    ).toEqual(["Herbalism"]);

    expect(
      detail?.character.professions
        .items
    ).not.toContainEqual(
      expect.objectContaining({
        name: "Alchemy"
      })
    );
  });

  it("returns null for a characterId that does not exist in the overview", () => {
    const overview = buildOverview();

    expect(
      findCharacterControlDetail(
        overview,
        "char-does-not-exist"
      )
    ).toBeNull();
  });

  it("carries the same reset period and tracker columns as the full Overview, not a re-derived value", () => {
    const overview = buildOverview();

    const detail = findCharacterControlDetail(
      overview,
      "char-1"
    );

    expect(detail?.period).toEqual(period);
    expect(detail?.trackerColumns).toBe(
      overview.trackerColumns
    );
  });
});
