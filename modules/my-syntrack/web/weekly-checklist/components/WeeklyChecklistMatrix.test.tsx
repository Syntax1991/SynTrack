import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";
import type { WeeklyGameplayDomainView } from "../../../api/weekly-gameplay/weekly-gameplay.types.js";
import { WeeklyChecklistMatrix } from "./WeeklyChecklistMatrix";

function gameplayDomain(
  overrides: Partial<WeeklyGameplayDomainView> & Pick<WeeklyGameplayDomainView, "label">
): WeeklyGameplayDomainView {
  return {
    state: "UNKNOWN",
    completeCount: 0,
    applicableTotal: 0,
    unknownCount: 1,
    rawCompleteCount: 0,
    knownUnlockedSlots: 0,
    maxSlots: 0,
    hasUnknownCategories: false,
    unknownCategoryCount: 0,
    ...overrides
  };
}

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

describe("WeeklyChecklistMatrix", () => {
  it("renders recurring detail columns without Gear, Prof KP, or Complete all", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({ name: "Synblast" }),
          buildCharacter({ id: "char-2", name: "Synbloom" })
        ]}
      />
    );

    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("M+")).toBeInTheDocument();
    expect(screen.getByText("Raid")).toBeInTheDocument();
    expect(screen.getByText("Delves")).toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
    expect(screen.getByText("Treat.")).toBeInTheDocument();
    expect(screen.getByText("Drops")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();

    expect(screen.queryByText("Gear")).not.toBeInTheDocument();
    expect(screen.queryByText("Prof. KP")).not.toBeInTheDocument();
    expect(screen.queryByText("Complete all")).not.toBeInTheDocument();
    expect(screen.getByText("Synblast")).toBeInTheDocument();
    expect(screen.getByText("Synbloom")).toBeInTheDocument();
  });

  it("shows ? for not-yet-automated activity domains on gameplay-enabled chars", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix characters={[buildCharacter()]} />
    );

    const unknowns = screen.getAllByTitle(
      "Progress unresolved"
    );
    expect(unknowns.length).toBeGreaterThanOrEqual(4);
  });

  it("shows — for gameplay domains on profession-only characters", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            trackingProfile: "PROFESSION",
            weeklyGameplay: {
              characterId: "char-1",
              vault: gameplayDomain({
                label: "Vault",
                state: "IN_PROGRESS",
                completeCount: 6,
                applicableTotal: 9,
                knownUnlockedSlots: 6,
                maxSlots: 9,
                hasUnknownCategories: true,
                unknownCount: 1
              }),
              mythicPlus: gameplayDomain({
                label: "M+",
                state: "READY",
                completeCount: 8,
                applicableTotal: 8
              }),
              raid: gameplayDomain({
                label: "Raid",
                state: "READY",
                completeCount: 8,
                applicableTotal: 8
              }),
              delves: gameplayDomain({ label: "Delves" }),
              mythicPlusAction: null,
              raidAction: null,
              delvesAction: null
            }
          })
        ]}
      />
    );

    const disabled = screen.getAllByTitle(
      "Not applicable for this character profile"
    );
    expect(disabled).toHaveLength(4);
    expect(screen.queryByText("6/9")).not.toBeInTheDocument();
  });

  it("renders Synblast M+ 8/8 and Vault 6/9 when Delves are unresolved", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            weeklyGameplay: {
              characterId: "char-1",
              vault: gameplayDomain({
                label: "Vault",
                state: "IN_PROGRESS",
                completeCount: 6,
                applicableTotal: 9,
                knownUnlockedSlots: 6,
                maxSlots: 9,
                hasUnknownCategories: true,
                unknownCategoryCount: 1,
                unknownCount: 1
              }),
              mythicPlus: gameplayDomain({
                label: "M+",
                state: "READY",
                completeCount: 8,
                applicableTotal: 8,
                rawCompleteCount: 16
              }),
              raid: gameplayDomain({
                label: "Raid",
                state: "READY",
                completeCount: 8,
                applicableTotal: 8
              }),
              delves: gameplayDomain({ label: "Delves" }),
              mythicPlusAction: null,
              raidAction: null,
              delvesAction: null
            }
          })
        ]}
      />
    );

    expect(screen.getAllByText("8/8").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("6/9")).toBeInTheDocument();
    expect(screen.queryByText("≥6/9")).not.toBeInTheDocument();
    expect(screen.queryByText("16/8")).not.toBeInTheDocument();
    expect(
      screen.getByTitle("Vault 6/9 · 1 category unresolved")
    ).toBeInTheDocument();
  });

  it("does not surface gameplay action for profession-only characters", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            trackingProfile: "PROFESSION",
            weeklyGameplay: {
              characterId: "char-1",
              vault: gameplayDomain({ label: "Vault" }),
              mythicPlus: gameplayDomain({ label: "M+" }),
              raid: gameplayDomain({ label: "Raid" }),
              delves: gameplayDomain({ label: "Delves" }),
              mythicPlusAction: "Mythic+ progress unresolved",
              raidAction: null,
              delvesAction: "Delves Vault progress unresolved"
            }
          })
        ]}
      />
    );

    expect(
      screen.queryByText("Mythic+ progress unresolved")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Delves Vault progress unresolved")
    ).not.toBeInTheDocument();
  });

  it("surfaces weekly-only action from Treatise incompleteness", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            professionWeekly: {
              state: "ATTENTION",
              quest: {
                completeCount: 1,
                incompleteCount: 0,
                unknownCount: 0,
                applicableTotal: 1
              },
              treatise: {
                completeCount: 0,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 1
              },
              drops: zeroAggregate,
              professions: [
                {
                  professionKey: "alchemy",
                  name: "Alchemy",
                  quest: {
                    sourceKey: "weekly-quest",
                    name: "Weekly Quest",
                    sourceType: "WEEKLY_QUEST",
                    state: "COMPLETE",
                    currentValue: null,
                    maxValue: null,
                    capturedAt: null
                  },
                  treatise: {
                    sourceKey: "treatise",
                    name: "Treatise",
                    sourceType: "TREATISE",
                    state: "INCOMPLETE",
                    currentValue: null,
                    maxValue: null,
                    capturedAt: null
                  },
                  drops: null
                }
              ]
            }
          })
        ]}
      />
    );

    expect(
      screen.getByText("Alchemy Treatise missing")
    ).toBeInTheDocument();
  });
});
