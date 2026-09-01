import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { WeeklyChecklistResponse } from "../types/weeklyChecklist.types";
import { createDefaultWeekliesGameplaySignals } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";

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
        professionWeeklySummary: {
          state: "NOT_APPLICABLE",
          label: "—",
          openProfessionCount: 0,
          unknownProfessionCount: 0,
          path: "/professions"
        },
        gameplaySignals: createDefaultWeekliesGameplaySignals()
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

function renderPage(initialEntry = "/weekly-checklist") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <WeeklyChecklistPage />
    </MemoryRouter>
  );
}

describe("WeeklyChecklistPage", () => {
  it("shows a compact gameplay-first Weeklies summary", () => {
    renderPage();

    expect(
      screen.getByText(
        /1 gameplay character · Vault \/ M\+ \/ Raid \/ Delves from this-week capture · 2K \/ MAP \/ META from trackers · Prof\. links to \/professions/
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Roster")
    ).not.toBeInTheDocument();
  });

  it("renders the gameplay Weeklies matrix directly", () => {
    renderPage();

    expect(
      screen.getAllByText("Synspin").length
    ).toBeGreaterThan(0);

    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("Prof.")).toBeInTheDocument();
    expect(screen.queryByText("Quest")).not.toBeInTheDocument();
    expect(screen.queryByText("Complete all")).not.toBeInTheDocument();
  });

  it("falls back safely when legacy scope=professions is present", () => {
    renderPage("/weekly-checklist?scope=professions");

    expect(screen.getByText("Synspin")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.queryByText("Professions")).not.toBeInTheDocument();
  });
});
