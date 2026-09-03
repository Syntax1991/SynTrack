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
    professions: {
      charactersWithWork: 3,
      weeklyActions: 4,
      permanentAttention: 1
    },
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
      characterId: "c1",
      characterName: "Synblast",
      className: "Shaman",
      source: "SEASON",
      horizon: "SEASONAL",
      action: "Defeat Azta'rec on ??",
      path: "/season",
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
      characterName: "Synbeam",
      className: "Paladin",
      source: "PROFESSIONS",
      horizon: "WEEKLY",
      action: "Blacksmithing: Use Treatise",
      path: "/professions",
      localOrder: 1
    },
    {
      characterId: "c3",
      characterName: "Synbeam",
      className: "Paladin",
      source: "PROFESSIONS",
      horizon: "WEEKLY",
      action: "Jewelcrafting: Use Treatise",
      path: "/professions",
      localOrder: 2
    },
    {
      characterId: "c4",
      characterName: "Synbeast",
      className: "Hunter",
      source: "PROFESSIONS",
      horizon: "PERMANENT",
      action: "Tailoring: Collect missing Knowledge Treasures",
      path: "/professions",
      localOrder: 0
    }
  ],
  projection: {
    gameplayPriorities: [
      {
        characterId: "c1",
        characterName: "Synblast",
        className: "Shaman",
        next: {
          action: "2 more M+ runs for Vault slot 2",
          path: "/weekly-checklist",
          source: "WEEKLIES"
        },
        after: {
          action: "Defeat Azta'rec on ??",
          path: "/season",
          source: "SEASON"
        },
        knownOpen: 2,
        unknown: 1,
        status: "2 open · 1 unknown"
      },
      {
        characterId: "c2",
        characterName: "Synbloom",
        className: "Druid",
        next: {
          action: "Complete 4pc tier set",
          path: "/season",
          source: "SEASON"
        },
        after: null,
        knownOpen: 1,
        unknown: 0,
        status: "1 open"
      }
    ],
    professionWork: [
      {
        characterId: "c3",
        characterName: "Synbeam",
        className: "Paladin",
        next: {
          action: "Blacksmithing: Use Treatise",
          path: "/professions"
        },
        additionalActionCount: 1
      }
    ],
    setupAttention: [
      {
        characterId: "c4",
        characterName: "Synbeast",
        className: "Hunter",
        next: {
          action: "Tailoring: Collect missing Knowledge Treasures",
          path: "/professions"
        },
        additionalActionCount: 0
      }
    ]
  },
  emptyState: "NO_OPEN_ACTIONS"
};

describe("OverviewPage decision cockpit", () => {
  beforeEach(() => {
    useOverviewDecisions.mockReturnValue({
      overview: mockOverview,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  it("renders Character-level surfaces instead of a flat action queue", () => {
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
    expect(screen.getByText("5 unresolved")).toBeInTheDocument();
    expect(screen.queryByText("NEXT ACTIONS")).not.toBeInTheDocument();
    expect(screen.queryByText("THIS WEEK")).not.toBeInTheDocument();
    expect(screen.getByText("GAMEPLAY PRIORITIES")).toBeInTheDocument();
    expect(screen.getByText("PROFESSION WORK")).toBeInTheDocument();
    expect(screen.getByText("SETUP ATTENTION")).toBeInTheDocument();
    expect(
      screen.getByText("2 more M+ runs for Vault slot 2")
    ).toBeInTheDocument();
    expect(screen.getByText("Defeat Azta'rec on ??")).toBeInTheDocument();
    expect(screen.getByText("Blacksmithing: Use Treatise")).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
    expect(
      screen.getByText("Tailoring: Collect missing Knowledge Treasures")
    ).toBeInTheDocument();
    expect(screen.queryByText("iLvl")).not.toBeInTheDocument();
  });

  it("shows unresolved empty state without claiming completion", () => {
    useOverviewDecisions.mockReturnValue({
      overview: {
        summaries: {
          weekly: { charactersWithWork: 0 },
          season: { open: 0, unknown: 2 },
          professions: {
            charactersWithWork: 0,
            weeklyActions: 0,
            permanentAttention: 0
          },
          unresolved: 2
        },
        actions: [],
        projection: {
          gameplayPriorities: [],
          professionWork: [],
          setupAttention: []
        },
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
