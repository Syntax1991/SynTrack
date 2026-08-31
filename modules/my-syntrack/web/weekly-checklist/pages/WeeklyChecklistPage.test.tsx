import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { WeeklyChecklistResponse } from "../types/weeklyChecklist.types";

const mockChecklist: WeeklyChecklistResponse =
  {
    period: {
      key: "2026-08-26",
      startsAt:
        "2026-08-26T07:00:00.000Z",
      endsAt:
        "2026-09-02T07:00:00.000Z"
    },
    tasks: [
      {
        key: "great-vault",
        title: "Great Vault progress",
        description:
          "Log Vault-eligible activity.",
        category:
          "WEEKLY PROGRESS",
        sortOrder: 10
      }
    ],
    characters: [
      {
        id: "char-1",
        name: "Synspin",
        realm: "Antonidas",
        region: "eu",
        className: "Mage",
        level: 80,
        trackingProfile: "FULL",
        weeklyGameplay: null,
        completedTaskKeys: [],
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
        }
      }
    ],
    summary: {
      completedTaskCount: 0,
      totalTaskCount: 1,
      completedCharacterCount: 0
    }
  };

vi.mock(
  "../hooks/useWeeklyChecklist",
  () => ({
    useWeeklyChecklist: () => ({
      checklist: mockChecklist,
      isLoading: false,
      error: null,
      pendingAction: null,
      setTaskCompleted: vi.fn(),
      setAllTasksCompleted: vi.fn()
    })
  })
);

const { WeeklyChecklistPage } =
  await import("./WeeklyChecklistPage");

function renderPage() {
  return render(
    <MemoryRouter>
      <WeeklyChecklistPage />
    </MemoryRouter>
  );
}

describe("WeeklyChecklistPage", () => {
  it("shows a compact Weeklies summary without KPI cards", () => {
    renderPage();

    expect(
      screen.getByText(
        /total · .* gameplay · .* professions · Quest \/ Treatise \/ Drops automatic/
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Roster")
    ).not.toBeInTheDocument();
  });

  it("renders the account-wide Weeklies matrix directly", () => {
    renderPage();

    expect(
      screen.getAllByText("Synspin").length
    ).toBeGreaterThan(0);

    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
    expect(screen.queryByText("Complete all")).not.toBeInTheDocument();
  });
});
