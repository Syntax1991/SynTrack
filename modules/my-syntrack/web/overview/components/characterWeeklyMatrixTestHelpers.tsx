import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type {
  CharacterOverviewRow,
  TrackerDefinitionView
} from "../types/overview.types";
import { CharacterWeeklyMatrix } from "./CharacterWeeklyMatrix";

export function buildCharacter(
  overrides: Partial<CharacterOverviewRow> = {}
): CharacterOverviewRow {
  return {
    character: {
      id: "char-1",
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      className: "Shaman",
      level: 80
    },
    weekly: {
      state: "IN_PROGRESS",
      completed: 3,
      total: 5,
      source: "MANUAL_CHECKLIST"
    },
    vault: {
      state: "UNKNOWN",
      unlockedSlots: 0,
      slotsTotal: 3,
      highestKeyLevel: null,
      source: "MANUAL_LOG"
    },
    professions: {
      state: "NOT_TRACKED",
      issueCount: 0,
      issues: [],
      items: []
    },
    gear: {
      state: "NOT_TRACKED",
      readinessPercent: null,
      trackedSlots: 0,
      totalRelevantSlots: 16,
      missingEnchantCount: 0,
      emptySocketCount: 0,
      itemLevel: null
    },
    resources: {
      state: "NOT_TRACKED",
      trackedResourceCount: 0,
      totalRelevantResourceCount: 0,
      attentionCount: 0,
      items: []
    },
    tier: { state: "NOT_TRACKED" },
    embellishments: {
      state: "NOT_TRACKED"
    },
    professionWeekly: {
      state: "NOT_TRACKED",
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
      professions: []
    },
    trackers: [],
    attentionItems: [],
    readinessState: "unknown",
    nextAction: null,
    tags: [],
    health: {
      characterId: "char-1",
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
    },
    ...overrides
  };
}

export function renderMatrix(
  characters: CharacterOverviewRow[],
  trackerColumns: TrackerDefinitionView[] = []
) {
  return render(
    <MemoryRouter>
      <CharacterWeeklyMatrix
        characters={characters}
        onOpenTrackerManager={() => {}}
        onTrackerChanged={() => {}}
        summaryText="2 characters · 1 attention · 0 ready · Reset in 6d 8h"
        trackerColumns={trackerColumns}
      />
    </MemoryRouter>
  );
}
