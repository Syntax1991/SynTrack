import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput
} from "./overview.aggregator.fixtures.js";
import { computeAccountPriorities } from "./overview-priority-engine.js";
import type { AttentionItem } from "./overview.types.js";

function attentionItem(
  overrides: Partial<AttentionItem> & Pick<AttentionItem, "id">
): AttentionItem {
  return {
    characterId: "char-1",
    characterName: "Synlight",
    domain: "weekly",
    severity: "this-week",
    label: "Weekly tasks remaining",
    detail: null,
    path: "/weekly-checklist",
    ...overrides
  };
}

describe("computeAccountPriorities", () => {
  it("ranks cross-character next actions for the top feed", () => {
    const { characters, attentionItems } =
      aggregateCharacterWeeklyStates(
        baseInput({
          characters: [
            baseCharacter({
              id: "char-low",
              name: "Synbloom",
              level: 70
            }),
            baseCharacter({
              id: "char-high",
              name: "Synlight",
              level: 80
            })
          ]
        })
      );

    const enrichedCharacters = characters.map(
      (character) => {
        if (character.character.id === "char-low") {
          return {
            ...character,
            readinessState: "attention" as const,
            nextAction: {
              domain: "weekly" as const,
              label: "4 more M+ runs for Vault slot 3",
              detail: null,
              path: "/vault-mythic-plus",
              severity: "this-week" as const
            },
            attentionItems: [
              attentionItem({
                id: "char-low:weekly",
                characterId: "char-low",
                characterName: "Synbloom",
                label: "4 more M+ runs for Vault slot 3",
                path: "/vault-mythic-plus"
              })
            ]
          };
        }

        return {
          ...character,
          readinessState: "attention" as const,
          nextAction: {
            domain: "weekly" as const,
            label: "1 World activity for Vault slot 1",
            detail: null,
            path: "/weekly-checklist",
            severity: "this-week" as const
          },
          attentionItems: [
            attentionItem({
              id: "char-high:weekly",
              characterId: "char-high",
              characterName: "Synlight",
              label: "1 World activity for Vault slot 1",
              path: "/weekly-checklist"
            })
          ]
        };
      }
    );

    const priorities = computeAccountPriorities({
      characters: enrichedCharacters,
      attentionItems: [
        ...attentionItems,
        attentionItem({
          id: "char-low:weekly",
          characterId: "char-low",
          characterName: "Synbloom",
          label: "4 more M+ runs for Vault slot 3",
          path: "/vault-mythic-plus"
        }),
        attentionItem({
          id: "char-high:weekly",
          characterId: "char-high",
          characterName: "Synlight",
          label: "1 World activity for Vault slot 1",
          path: "/weekly-checklist"
        })
      ]
    });

    expect(priorities.topActions).toHaveLength(2);
    expect(priorities.topActions[0]?.characterName).toBe(
      "Synlight"
    );
    expect(priorities.topActions[0]?.bucket).toBe("quick-wins");
    expect(priorities.buckets.quickWins).toHaveLength(1);
    expect(priorities.buckets.thisWeek).toHaveLength(1);
  });

  it("limits top actions to four", () => {
    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        characters: Array.from({ length: 6 }, (_, index) =>
          baseCharacter({
            id: `char-${index}`,
            name: `Char${index}`,
            level: 80 - index
          })
        )
      })
    );

    const enrichedCharacters = characters.map(
      (character, index) => ({
        ...character,
        readinessState: "attention" as const,
        nextAction: {
          domain: "weekly" as const,
          label: `Action ${index}`,
          detail: null,
          path: "/weekly-checklist",
          severity: "this-week" as const
        },
        attentionItems: [
          attentionItem({
            id: `${character.character.id}:weekly`,
            characterId: character.character.id,
            characterName: character.character.name,
            label: `Action ${index}`
          })
        ]
      })
    );

    const priorities = computeAccountPriorities({
      characters: enrichedCharacters,
      attentionItems: enrichedCharacters.flatMap(
        (character) => character.attentionItems
      )
    });

    expect(priorities.topActions).toHaveLength(4);
  });
});
