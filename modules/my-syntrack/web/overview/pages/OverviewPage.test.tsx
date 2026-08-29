import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { OverviewResponse } from "../types/overview.types";

const mockOverview: OverviewResponse =
  {
    summary: {
      period: {
        key: "2026-08-26",
        startsAt:
          "2026-08-26T07:00:00.000Z",
        endsAt:
          "2026-09-02T07:00:00.000Z"
      },
      characterCount: 1,
      readyCount: 0,
      attentionCount: 1,
      weeklyProgress: {
        completed: 2,
        total: 5
      },
      vault: {
        trackedCount: 0,
        fullyUnlockedCount: 0
      },
      refreshNeededCount: 0
    },
    attentionItems: [
      {
        id: "char-1:weekly",
        characterId: "char-1",
        characterName: "Synspin",
        domain: "weekly",
        severity: "this-week",
        label:
          "Weekly tasks remaining",
        detail:
          "3 of 5 tasks left",
        path: "/weekly-checklist"
      }
    ],
    characters: [
      {
        character: {
          id: "char-1",
          name: "Synspin",
          realm: "Antonidas",
          region: "eu",
          className: "Mage",
          level: 80
        },
        weekly: {
          state: "IN_PROGRESS",
          completed: 2,
          total: 5,
          source:
            "MANUAL_CHECKLIST"
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
        trackers: [],
        attentionItems: [
          {
            id: "char-1:weekly",
            characterId: "char-1",
            characterName:
              "Synspin",
            domain: "weekly",
            severity: "this-week",
            label:
              "Weekly tasks remaining",
            detail:
              "3 of 5 tasks left",
            path: "/weekly-checklist"
          }
        ],
        readinessState:
          "attention",
        nextAction: {
          domain: "weekly",
          label:
            "Weekly tasks remaining",
          detail:
            "3 of 5 tasks left",
          path: "/weekly-checklist",
          severity: "this-week"
        },
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
        }
      }
    ],
    trackerColumns: [],
    activeScope: null,
    accountResources: []
  };

vi.mock(
  "../hooks/useOverview",
  () => ({
    useOverview: () => ({
      overview: mockOverview,
      isLoading: false,
      error: null,
      refetch: () => {}
    })
  })
);

const { OverviewPage } =
  await import("./OverviewPage");

function renderPage() {
  return render(
    <MemoryRouter>
      <OverviewPage />
    </MemoryRouter>
  );
}

describe("OverviewPage", () => {
  it("never renders the obsolete KPI cards (Crafting Ready, Synced, Coverage)", () => {
    renderPage();

    expect(
      screen.queryByText(
        /Crafting Ready/i
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/Synced/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /Coverage/i
      )
    ).not.toBeInTheDocument();
  });

  it("never renders the old 'My SynTrack Workspaces' section or a Raid Tasks card", () => {
    renderPage();

    expect(
      screen.queryByText(
        /My SynTrack Workspaces/i
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /Raid Tasks/i
      )
    ).not.toBeInTheDocument();
  });

  it("renders the compact attention strip and character matrix, with the matrix as the primary surface (no large panel above it)", () => {
    renderPage();

    expect(
      screen.getByRole("button", {
        name: /need attention/i
      })
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(
        "Synspin"
      ).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("2/5")
        .length
    ).toBeGreaterThan(0);
  });

  it("never renders the old four KPI cards, replacing them with one compact summary line", () => {
    vi.useFakeTimers();
    vi.setSystemTime(
      new Date("2026-08-26T23:00:00.000Z")
    );

    try {
      renderPage();

      expect(
        screen.getByText(
          "1 characters · 1 attention · 0 ready · Reset in 6d 8h"
        )
      ).toBeInTheDocument();
    }
    finally {
      vi.useRealTimers();
    }
  });
});
