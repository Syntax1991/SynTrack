import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OverviewDecisionResponse } from "../types/overviewDecision.types";

const useOverviewDecisions = vi.fn();

vi.mock("../hooks/useOverviewDecisions", () => ({
  useOverviewDecisions: () => useOverviewDecisions()
}));

import { OverviewPage } from "./OverviewPage";

const mockOverview: OverviewDecisionResponse = {
  summaries: {
    weekly: { charactersWithWork: 2 },
    season: { open: 3, unknown: 5 },
    professions: { weeklyActions: 4, permanentAttention: 1 },
    unresolved: 5
  },
  actions: [
    {
      characterId: "c1",
      characterName: "Synblast",
      className: "Shaman",
      source: "WEEKLIES",
      horizon: "WEEKLY",
      action: "2 more M+ runs for Vault slot 2",
      path: "/weekly-checklist",
      localOrder: 0
    },
    {
      characterId: "c2",
      characterName: "Synbloom",
      className: "Druid",
      source: "SEASON",
      horizon: "SEASONAL",
      action: "Complete 4pc tier set",
      path: "/season",
      localOrder: 0
    },
    {
      characterId: "c3",
      characterName: "Synbeast",
      className: "Hunter",
      source: "PROFESSIONS",
      horizon: "PERMANENT",
      action: "Tailoring: 2 Knowledge Treasures missing",
      path: "/professions",
      localOrder: 0
    }
  ],
  emptyState: "NO_OPEN_ACTIONS"
};

describe("OverviewPage decision engine", () => {
  beforeEach(() => {
    useOverviewDecisions.mockReturnValue({
      overview: mockOverview,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  it("renders decision strip and next actions without specialist matrices", () => {
    render(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(
      screen.getByText("What should I do next across the Warband?")
    ).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Season")).toBeInTheDocument();
    expect(screen.getByText("Professions")).toBeInTheDocument();
    expect(screen.getByText("Unresolved")).toBeInTheDocument();
    expect(screen.getByText("NEXT ACTIONS")).toBeInTheDocument();
    expect(screen.getByText("THIS WEEK")).toBeInTheDocument();
    expect(screen.getAllByText("SEASON").length).toBeGreaterThan(0);
    expect(screen.getByText("SETUP")).toBeInTheDocument();
    expect(screen.getByText("WEEKLIES")).toBeInTheDocument();
    expect(screen.getByText("PROFESSIONS")).toBeInTheDocument();
    expect(
      screen.getByText("2 more M+ runs for Vault slot 2")
    ).toBeInTheDocument();
    expect(screen.getByText("Complete 4pc tier set")).toBeInTheDocument();
    expect(
      screen.getByText("Tailoring: 2 Knowledge Treasures missing")
    ).toBeInTheDocument();
    expect(screen.queryByText("iLvl")).not.toBeInTheDocument();
    expect(screen.queryByText("Spark")).not.toBeInTheDocument();
    expect(screen.queryByText("Cata")).not.toBeInTheDocument();
  });

  it("shows unresolved empty state without claiming completion", () => {
    useOverviewDecisions.mockReturnValue({
      overview: {
        summaries: {
          weekly: { charactersWithWork: 0 },
          season: { open: 0, unknown: 2 },
          professions: { weeklyActions: 0, permanentAttention: 0 },
          unresolved: 2
        },
        actions: [],
        emptyState: "NO_KNOWN_ACTIONS_UNRESOLVED"
      },
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText("No known actions · 2 unresolved")
    ).toBeInTheDocument();
    expect(screen.queryByText("All done")).not.toBeInTheDocument();
  });
});
