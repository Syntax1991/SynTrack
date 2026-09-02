import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSeasonChecklist = vi.fn();

vi.mock("../hooks/useSeasonChecklist", () => ({
  useSeasonChecklist: () => useSeasonChecklist()
}));

import { SeasonPage } from "./SeasonPage";

describe("SeasonPage", () => {
  beforeEach(() => {
    useSeasonChecklist.mockReturnValue({
      checklist: {
        season: { key: "MIDNIGHT-S2", name: "Midnight Season 2" },
        characters: [],
        warbandGoals: [],
        summary: {
          characterCount: 2,
          goalsOpen: 1,
          goalsComplete: 1,
          goalsUnknown: 0
        }
      },
      isLoading: false,
      error: null
    });
  });

  it("shows user-state summary without capture-pending developer metadata", () => {
    render(
      <MemoryRouter>
        <SeasonPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/2 characters/)).toBeInTheDocument();
    expect(screen.getByText(/1 goals open/)).toBeInTheDocument();
    expect(screen.queryByText(/pending capture/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CAPTURE PENDING/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/WARBAND SEASON GOALS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No achievement capture/i)).not.toBeInTheDocument();
  });
});
