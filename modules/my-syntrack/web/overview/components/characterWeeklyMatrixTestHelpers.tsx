import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type {
  CharacterOverviewRow,
  TrackerDefinitionView
} from "../types/overview.types";
import type { CharacterTrackingProfile } from "../../../api/character-tracking/character-tracking-profile.js";
import {
  emptyProfessionKnowledgeTreasures,
  emptyProfessionSetup,
  emptyProfessionWeekly,
  emptyWeeklySummary
} from "../types/overviewEmptyDefaults";
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
    weeklySummary: emptyWeeklySummary,
    weeklyAction: null,
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
    professionSetup: emptyProfessionSetup,
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
    tier: {
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: 4,
      twoPiece: false,
      fourPiece: false,
      rawEquippedPieces: 0
    },
    embellishments: {
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: 2
    },
    professionWeekly: emptyProfessionWeekly,
    professionKnowledgeTreasures: emptyProfessionKnowledgeTreasures,
    trackers: [],
    attentionItems: [],
    readinessState: "unknown",
    nextAction: null,
    tags: [],
    trackingProfile: "FULL" satisfies CharacterTrackingProfile,
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
