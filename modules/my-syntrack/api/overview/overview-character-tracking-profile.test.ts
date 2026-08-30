import { describe, expect, it } from "vitest";
import { attachCharacterExtras, buildTagsByCharacterId } from "./overview-character-extras.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput
} from "./overview.aggregator.fixtures.js";
import { formatKnownWeeklyProgressSymbol } from "../weekly-progress/weekly-progress-display.js";
import type { TagView } from "../tags/tag.types.js";

const professionTag: TagView = {
  id: "tag-profession",
  name: "Profession",
  color: null,
  sortOrder: 0,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z"
};

const mainTag: TagView = {
  id: "tag-main",
  name: "Main",
  color: null,
  sortOrder: 0,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z"
};

const professionWeekly = {
  id: "char-placeholder",
  name: "Placeholder",
  state: "ATTENTION" as const,
  quest: {
    completeCount: 2,
    incompleteCount: 0,
    unknownCount: 0,
    applicableTotal: 2
  },
  treatise: {
    completeCount: 2,
    incompleteCount: 0,
    unknownCount: 0,
    applicableTotal: 2
  },
  drops: {
    completeCount: 0,
    incompleteCount: 4,
    unknownCount: 0,
    applicableTotal: 4
  },
  professions: []
};

describe("character tracking profile integration", () => {
  it("resolves PROFESSION from tags and suppresses gameplay unknown count in weekly summary", () => {
    const tagsByCharacterId = buildTagsByCharacterId(
      [professionTag],
      [{ characterId: "char-p", tagId: professionTag.id }]
    );

    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        characters: [
          baseCharacter({ id: "char-p", name: "Synsin" })
        ],
        tagsByCharacterId,
        professionWeeklyByCharacterId: new Map([
          [
            "char-p",
            { ...professionWeekly, id: "char-p", name: "Synsin" }
          ]
        ])
      })
    );

    const { characters: rows } = attachCharacterExtras(
      characters,
      tagsByCharacterId,
      new Map()
    );

    expect(rows[0]?.trackingProfile).toBe("PROFESSION");
    expect(rows[0]?.weeklySummary.unknownCount).toBe(0);
    expect(
      formatKnownWeeklyProgressSymbol({
        completedKnown: rows[0]?.weeklySummary.completedKnown ?? 0,
        applicableKnown: rows[0]?.weeklySummary.applicableKnown ?? 0,
        unknownCount: rows[0]?.weeklySummary.unknownCount ?? 0
      })
    ).toBe("4/8");
  });

  it("resolves FULL from Main tag and keeps gameplay unknown suffix", () => {
    const tagsByCharacterId = buildTagsByCharacterId(
      [mainTag],
      [{ characterId: "char-m", tagId: mainTag.id }]
    );

    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        characters: [
          baseCharacter({ id: "char-m", name: "Synblast" })
        ],
        tagsByCharacterId,
        professionWeeklyByCharacterId: new Map([
          [
            "char-m",
            { ...professionWeekly, id: "char-m", name: "Synblast" }
          ]
        ])
      })
    );

    const { characters: rows } = attachCharacterExtras(
      characters,
      tagsByCharacterId,
      new Map()
    );

    expect(rows[0]?.trackingProfile).toBe("FULL");
    expect(rows[0]?.weeklySummary.unknownCount).toBe(4);
    expect(
      formatKnownWeeklyProgressSymbol({
        completedKnown: rows[0]?.weeklySummary.completedKnown ?? 0,
        applicableKnown: rows[0]?.weeklySummary.applicableKnown ?? 0,
        unknownCount: rows[0]?.weeklySummary.unknownCount ?? 0
      })
    ).toBe("4/8 · 4?");
  });
});
