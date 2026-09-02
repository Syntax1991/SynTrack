import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { createDefaultWeekliesGameplaySignals } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
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
    professionWeeklySummary: {
      state: "NOT_APPLICABLE",
      label: "—",
      openProfessionCount: 0,
      unknownProfessionCount: 0,
      path: "/professions"
    },
    gameplaySignals: createDefaultWeekliesGameplaySignals(),
    ...overrides
  };
}

function renderWithRouter(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("WeeklyChecklistMatrix", () => {
  it("renders gameplay-first columns with compact Prof. pointer", () => {
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
    expect(screen.queryByText("2K")).not.toBeInTheDocument();
    expect(screen.getByText("MAP")).toBeInTheDocument();
    expect(screen.getByText("META")).toBeInTheDocument();
    expect(screen.getByText("Prof.")).toBeInTheDocument();
    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();

    expect(screen.queryByText("Quest")).not.toBeInTheDocument();
    expect(screen.queryByText("Treat.")).not.toBeInTheDocument();
    expect(screen.queryByText("Drops")).not.toBeInTheDocument();
    expect(screen.queryByText("All")).not.toBeInTheDocument();
    expect(screen.queryByText("Professions")).not.toBeInTheDocument();
    expect(screen.getByText("Synblast")).toBeInTheDocument();
    expect(screen.getByText("Synbloom")).toBeInTheDocument();
  });

  it("shows unknown gameplay signal cells when tracker evidence is missing", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix characters={[buildCharacter()]} />
    );

    const unknowns = screen.getAllByTitle(
      /Trove Hunter's Bounty tracker not configured|Meta Quest tracker not configured/
    );
    expect(unknowns.length).toBeGreaterThanOrEqual(2);
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
              delvesAction: null,
              highestKeyLevel: null
            }
          })
        ]}
      />
    );

    expect(screen.getAllByText("8/8").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("6/9")).toBeInTheDocument();
    expect(
      screen.getByTitle("Vault 6/9 · 1 category unresolved")
    ).toBeInTheDocument();
  });

  it("links Prof. to /professions and shows open summary", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            professionWeeklySummary: {
              state: "ATTENTION",
              label: "1 open",
              openProfessionCount: 1,
              unknownProfessionCount: 0,
              path: "/professions"
            }
          })
        ]}
      />
    );

    expect(screen.getByText("1 open")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 open" })).toHaveAttribute(
      "href",
      "/professions"
    );
  });

  it("shows gameplay action complete while profession work remains open", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            professionWeeklySummary: {
              state: "ATTENTION",
              label: "2 open",
              openProfessionCount: 2,
              unknownProfessionCount: 0,
              path: "/professions"
            },
            weeklyGameplay: {
              characterId: "char-1",
              vault: gameplayDomain({
                label: "Vault",
                state: "READY",
                completeCount: 9,
                applicableTotal: 9
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
              delves: gameplayDomain({
                label: "Delves",
                state: "READY",
                completeCount: 8,
                applicableTotal: 8
              }),
              mythicPlusAction: null,
              raidAction: null,
              delvesAction: null,
              highestKeyLevel: null
            }
          })
        ]}
      />
    );

    expect(screen.getByText("2 open")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });
});
