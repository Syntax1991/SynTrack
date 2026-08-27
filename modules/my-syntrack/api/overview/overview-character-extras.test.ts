import { describe, expect, it } from "vitest";
import {
  attachCharacterExtras,
  buildTagsByCharacterId
} from "./overview-character-extras.js";
import {
  baseCharacter,
  baseInput
} from "./overview.aggregator.fixtures.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import type { TagView } from "../tags/tag.types.js";
import type { CharacterDataHealth } from "../data-health/data-health.types.js";

const raidTag: TagView = {
  id: "tag-raid",
  name: "Raid",
  color: null,
  sortOrder: 0,
  createdAt:
    "2026-08-01T00:00:00.000Z",
  updatedAt:
    "2026-08-01T00:00:00.000Z"
};

describe("buildTagsByCharacterId", () => {
  it("groups tags by character, never leaking one character's tag onto another", () => {
    const map = buildTagsByCharacterId(
      [raidTag],
      [
        {
          characterId: "char-1",
          tagId: "tag-raid"
        }
      ]
    );

    expect(
      map.get("char-1")
    ).toEqual([raidTag]);

    expect(
      map.get("char-2")
    ).toBeUndefined();
  });

  it("silently ignores an assignment referencing a deleted tag", () => {
    const map = buildTagsByCharacterId(
      [],
      [
        {
          characterId: "char-1",
          tagId: "tag-deleted"
        }
      ]
    );

    expect(map.get("char-1")).toBeUndefined();
  });
});

describe("attachCharacterExtras", () => {
  it("attaches each character's own tags and health, never another character's", () => {
    const { characters } =
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
          ]
        })
      );

    const staleHealth: CharacterDataHealth =
      {
        characterId: "char-1",
        character: {
          state: "STALE",
          lastSyncedAt:
            "2026-08-01T00:00:00.000Z"
        },
        professions: {
          state: "NOT_TRACKED",
          items: []
        },
        gear: {
          state: "NOT_TRACKED",
          lastSyncedAt: null
        }
      };

    const manualHealth: CharacterDataHealth =
      {
        characterId: "char-2",
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
        }
      };

    const result = attachCharacterExtras(
      characters,
      buildTagsByCharacterId(
        [raidTag],
        [
          {
            characterId: "char-1",
            tagId: "tag-raid"
          }
        ]
      ),
      new Map([
        ["char-1", staleHealth],
        ["char-2", manualHealth]
      ])
    );

    const synblast =
      result.characters.find(
        (state) =>
          state.character.id ===
          "char-1"
      );

    const synbloom =
      result.characters.find(
        (state) =>
          state.character.id ===
          "char-2"
      );

    expect(synblast?.tags).toEqual([
      raidTag
    ]);

    expect(synbloom?.tags).toEqual([]);

    expect(
      synblast?.health.character.state
    ).toBe("STALE");

    expect(
      synbloom?.health.character.state
    ).toBe("MANUAL");
  });

  it("counts only characters whose own character-domain health is STALE or NEVER_CAPTURED as needing refresh, never a MANUAL character", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          characters: [
            baseCharacter({
              id: "char-1"
            }),
            baseCharacter({
              id: "char-2"
            }),
            baseCharacter({
              id: "char-3"
            })
          ]
        })
      );

    const result = attachCharacterExtras(
      characters,
      new Map(),
      new Map([
        [
          "char-1",
          {
            characterId: "char-1",
            character: {
              state: "STALE",
              lastSyncedAt: null
            },
            professions: {
              state: "NOT_TRACKED",
              items: []
            },
            gear: {
              state: "NOT_TRACKED",
              lastSyncedAt: null
            }
          }
        ],
        [
          "char-2",
          {
            characterId: "char-2",
            character: {
              state: "FRESH",
              lastSyncedAt: null
            },
            professions: {
              state: "NOT_TRACKED",
              items: []
            },
            gear: {
              state: "NOT_TRACKED",
              lastSyncedAt: null
            }
          }
        ],
        [
          "char-3",
          {
            characterId: "char-3",
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
            }
          }
        ]
      ])
    );

    expect(
      result.refreshNeededCount
    ).toBe(1);
  });
});
