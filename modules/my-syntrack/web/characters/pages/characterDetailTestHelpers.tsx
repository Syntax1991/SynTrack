import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  MemoryRouter,
  Route,
  Routes
} from "react-router-dom";
import type { CharacterControlDetailResponse } from "../types/characterControlDetail.types";

export function buildDetail(): CharacterControlDetailResponse {
  return {
    period: {
      key: "2026-08-26",
      startsAt:
        "2026-08-26T07:00:00.000Z",
      endsAt:
        "2099-09-02T07:00:00.000Z"
    },
    character: {
      character: {
        id: "char-2",
        name: "Synbloom",
        realm: "Antonidas",
        region: "eu",
        className: "Druid",
        level: 80
      },
      weekly: {
        state: "IN_PROGRESS",
        completed: 3,
        total: 5,
        source: "MANUAL_CHECKLIST"
      },
      weeklySummary: {
        state: "NOT_TRACKED",
        completedKnown: 0,
        applicableKnown: 0,
        unknownCount: 0,
        domains: []
      },
      weeklyAction: null,
      vault: {
        state: "UNKNOWN",
        unlockedSlots: 0,
        slotsTotal: 3,
        highestKeyLevel: null,
        source: "MANUAL_LOG"
      },
      professions: {
        state: "READY",
        issueCount: 0,
        issues: [],
        items: [
          {
            professionId:
              "profession-alchemy",
            key: "alchemy",
            name: "Alchemy",
            category: "CRAFTING",
            skill: 100,
            knowledgePoints: 42,
            dataStatus: "TRACKED"
          }
        ]
      },
      professionSetup: {
        state: "NOT_TRACKED",
        professions: [],
        dataIssues: []
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
      professionWeekly: {
        state: "NOT_TRACKED",
        quest: {
          completeCount: 0,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 0
        },
        treatise: {
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
      professionKnowledgeTreasures: {
        state: "NOT_TRACKED",
        treasures: {
          completeCount: 0,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 0
        },
        professions: []
      },
      trackers: [
        {
          trackerDefinitionId:
            "tracker-false",
          characterId: "char-2",
          periodKey:
            "2026-08-26",
          state: "RECORDED",
          source: "MANUAL",
          value: {
            valueType: "BOOLEAN",
            boolean: false
          }
        }
      ],
      attentionItems: [
        {
          id: "char-2:weekly",
          characterId: "char-2",
          characterName: "Synbloom",
          domain: "weekly",
          severity: "this-week",
          label:
            "Weekly tasks remaining",
          detail:
            "2 of 5 weekly tasks left",
          path: "/weekly-checklist"
        }
      ],
      readinessState: "attention",
      nextAction: {
        domain: "weekly",
        label:
          "Weekly tasks remaining",
        detail:
          "2 of 5 weekly tasks left",
        path: "/weekly-checklist",
        severity: "this-week"
      },
      tags: [
        {
          id: "tag-raid",
          name: "Raid",
          color: null,
          sortOrder: 0,
          createdAt:
            "2026-08-01T00:00:00.000Z",
          updatedAt:
            "2026-08-01T00:00:00.000Z"
        }
      ],
      health: {
        characterId: "char-2",
        character: {
          state: "NEVER_CAPTURED",
          lastSyncedAt: null
        },
        professions: {
          state: "PARTIAL",
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
    },
    trackerColumns: [
      {
        id: "tracker-false",
        scopeKey: "midnight",
        key: "cracked",
        name: "Cracked",
        valueType: "BOOLEAN",
        resetBehavior: "SEASONAL",
        category: null,
        sortOrder: 10,
        isPinned: true,
        enabled: true
      },
      {
        id: "tracker-unknown",
        scopeKey: "midnight",
        key: "world-tour",
        name: "World Tour",
        valueType: "BOOLEAN",
        resetBehavior: "SEASONAL",
        category: null,
        sortOrder: 20,
        isPinned: true,
        enabled: true
      }
    ]
  };
}

export function renderCharacterDetailRoute(
  element: ReactNode
) {
  return render(
    <MemoryRouter
      initialEntries={[
        "/characters/char-2"
      ]}
    >
      <Routes>
        <Route
          element={element}
          path="/characters/:characterId"
        />
      </Routes>
    </MemoryRouter>
  );
}
