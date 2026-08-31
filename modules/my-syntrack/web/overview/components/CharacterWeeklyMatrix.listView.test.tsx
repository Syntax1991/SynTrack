import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderMatrix
} from "./characterWeeklyMatrixTestHelpers";

function readyProfession(
  professionId: string,
  name: string,
  completeCount: number,
  applicableTotal: number
) {
  return {
    state: completeCount < applicableTotal ? ("ATTENTION" as const) : ("READY" as const),
    professions: [
      {
        professionId,
        key: professionId,
        name,
        dataStatus: "TRACKED" as const,
        treasures: {
          completeCount,
          incompleteCount: applicableTotal - completeCount,
          unknownCount: 0,
          applicableTotal
        }
      }
    ],
    dataIssues: []
  };
}

describe("CharacterWeeklyMatrix list view", () => {
  it("filters dual-purpose and profession-only characters by roster scope", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-a",
          name: "SynMain",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80
        },
        trackingProfile: "FULL",
        readinessState: "ready",
        professionSetup: readyProfession("alchemy", "Alchemy", 8, 8)
      }),
      buildCharacter({
        character: {
          id: "char-b",
          name: "SynCraft",
          realm: "Antonidas",
          region: "eu",
          className: "Mage",
          level: 80
        },
        trackingProfile: "PROFESSION",
        readinessState: "attention",
        professionSetup: readyProfession("tailoring", "Tailoring", 7, 8)
      }),
      buildCharacter({
        character: {
          id: "char-c",
          name: "SynPlay",
          realm: "Antonidas",
          region: "eu",
          className: "Warrior",
          level: 80
        },
        trackingProfile: "WEEKLY",
        readinessState: "ready"
      })
    ]);

    const scopeGroup = screen.getByRole("group", {
      name: "Character roster scope"
    });
    const statusGroup = screen.getByRole("group", {
      name: "Filter by status"
    });

    expect(
      within(scopeGroup).getByRole("button", { name: "All" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("SynMain")).toBeInTheDocument();
    expect(screen.getByText("SynCraft")).toBeInTheDocument();
    expect(screen.getByText("SynPlay")).toBeInTheDocument();

    fireEvent.click(within(scopeGroup).getByRole("button", { name: "Gameplay" }));
    expect(screen.getByText("SynMain")).toBeInTheDocument();
    expect(screen.queryByText("SynCraft")).not.toBeInTheDocument();
    expect(screen.getByText("SynPlay")).toBeInTheDocument();
    expect(screen.queryByText("Prof.")).not.toBeInTheDocument();

    fireEvent.click(
      within(scopeGroup).getByRole("button", { name: "Professions" })
    );
    expect(screen.getByText("SynMain")).toBeInTheDocument();
    expect(screen.getByText("SynCraft")).toBeInTheDocument();
    expect(screen.queryByText("SynPlay")).not.toBeInTheDocument();
    expect(screen.getByText("Prof.")).toBeInTheDocument();
    expect(screen.queryByText("Set")).not.toBeInTheDocument();
    expect(screen.queryByText("Spark")).not.toBeInTheDocument();

    fireEvent.click(within(statusGroup).getByRole("button", { name: "Attention" }));
    expect(screen.queryByText("SynMain")).not.toBeInTheDocument();
    expect(screen.getByText("SynCraft")).toBeInTheDocument();
  });

  it("keeps Overview ACTION unchanged when switching roster scope", () => {
    renderMatrix([
      buildCharacter({
        nextAction: {
          domain: "profession",
          label: "1 Alchemy Knowledge Treasure missing",
          detail: null,
          path: "/characters/char-1",
          severity: "this-week"
        },
        readinessState: "attention",
        professionSetup: readyProfession("alchemy", "Alchemy", 7, 8)
      })
    ]);

    expect(
      screen.getByRole("link", {
        name: "1 Alchemy Knowledge Treasure missing"
      })
    ).toHaveAttribute("href", "/characters/char-1");

    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Character roster scope" })
      ).getByRole("button", { name: "Professions" })
    );

    expect(
      screen.getByRole("link", {
        name: "1 Alchemy Knowledge Treasure missing"
      })
    ).toHaveAttribute("href", "/characters/char-1");
  });

  it("shows scope-specific empty copy when no gameplay characters exist", () => {
    renderMatrix([
      buildCharacter({
        trackingProfile: "PROFESSION",
        professionSetup: readyProfession("alchemy", "Alchemy", 8, 8)
      })
    ]);

    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Character roster scope" })
      ).getByRole("button", { name: "Gameplay" })
    );

    expect(
      screen.getByText("No gameplay-tracked characters.")
    ).toBeInTheDocument();
  });
});
