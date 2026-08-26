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
      }
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
          issues: []
        },
        gear: {
          state: "NOT_TRACKED",
          readinessPercent: null,
          trackedSlots: 0,
          totalRelevantSlots: 16,
          missingEnchantCount: 0,
          emptySocketCount: 0
        },
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
        }
      }
    ]
  };

vi.mock(
  "../hooks/useOverview",
  () => ({
    useOverview: () => ({
      overview: mockOverview,
      isLoading: false,
      error: null
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

  it("renders the new summary, attention queue and character matrix", () => {
    renderPage();

    expect(
      screen.getByText(
        "Needs attention"
      )
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
});
