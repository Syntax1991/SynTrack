import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";
import { WeeklyChecklistMatrix } from "./WeeklyChecklistMatrix";

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

function buildCharacter(
  overrides: Partial<WeeklyChecklistCharacter> = {}
): WeeklyChecklistCharacter {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    trackingProfile: "FULL",
    weeklyGameplay: null,
    completedTaskKeys: [],
    professionWeekly: {
      state: "NOT_TRACKED",
      quest: zeroAggregate,
      treatise: zeroAggregate,
      drops: zeroAggregate,
      professions: []
    },
    ...overrides
  };
}

function renderWithRouter(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

function incompleteQuest(
  professionKey: string,
  name: string
): WeeklyChecklistCharacter["professionWeekly"] {
  return {
    state: "ATTENTION",
    quest: {
      completeCount: 0,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 1
    },
    treatise: zeroAggregate,
    drops: zeroAggregate,
    professions: [
      {
        professionKey,
        name,
        quest: {
          sourceKey: "weekly-quest",
          name: "Weekly Quest",
          sourceType: "WEEKLY_QUEST",
          state: "INCOMPLETE",
          currentValue: null,
          maxValue: null,
          capturedAt: null
        },
        treatise: null,
        drops: null
      }
    ]
  };
}

describe("WeeklyChecklistMatrix list view", () => {
  it("scopes Gameplay and Professions columns and keeps ACTION stable", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            id: "char-dual",
            name: "SynMain",
            trackingProfile: "FULL",
            professionWeekly: incompleteQuest("alchemy", "Alchemy")
          }),
          buildCharacter({
            id: "char-prof",
            name: "SynCraft",
            trackingProfile: "PROFESSION",
            professionWeekly: incompleteQuest("tailoring", "Tailoring")
          })
        ]}
      />
    );

    const scope = screen.getByRole("group", {
      name: "Character roster scope"
    });

    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
    expect(screen.getByText("Alchemy Quest remaining")).toBeInTheDocument();

    fireEvent.click(within(scope).getByRole("button", { name: "Gameplay" }));
    expect(screen.getByText("SynMain")).toBeInTheDocument();
    expect(screen.queryByText("SynCraft")).not.toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.queryByText("Quest")).not.toBeInTheDocument();
    expect(screen.getByText("Alchemy Quest remaining")).toBeInTheDocument();

    fireEvent.click(
      within(scope).getByRole("button", { name: "Professions" })
    );
    expect(screen.getByText("SynMain")).toBeInTheDocument();
    expect(screen.getByText("SynCraft")).toBeInTheDocument();
    expect(screen.queryByText("Vault")).not.toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
    expect(screen.getByText("Alchemy Quest remaining")).toBeInTheDocument();
  });
});
