import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { SeasonChecklistCharacter } from "../../../api/season-checklist/season-checklist.types.js";
import { SeasonChecklistMatrix } from "./SeasonChecklistMatrix";

function buildCharacter(
  overrides: Partial<SeasonChecklistCharacter> = {}
): SeasonChecklistCharacter {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    trackingProfile: "FULL",
    twoKRio: {
      key: "rating-2000",
      title: "2K Mythic+ rating",
      state: "INCOMPLETE",
      label: "1847",
      detail: "Current score 1847",
      actionLabel: "Reach 2K Mythic+ rating"
    },
    professionWeeklySummary: {
      state: "NOT_APPLICABLE",
      label: "—",
      openProfessionCount: 0,
      unknownProfessionCount: 0,
      path: "/professions"
    },
    goalsOpen: 1,
    goalsComplete: 0,
    goalsUnknown: 0,
    action: "Reach 2K Mythic+ rating",
    ...overrides
  };
}

describe("SeasonChecklistMatrix", () => {
  it("renders seasonal 2K without weekly Progress or Meta columns", () => {
    render(
      <MemoryRouter>
        <SeasonChecklistMatrix characters={[buildCharacter()]} />
      </MemoryRouter>
    );

    expect(screen.getByText("2K")).toBeInTheDocument();
    expect(screen.getByText("1847")).toBeInTheDocument();
    expect(screen.getByText("Reach 2K Mythic+ rating")).toBeInTheDocument();
    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.queryByText("META")).not.toBeInTheDocument();
    expect(screen.queryByText("Vault")).not.toBeInTheDocument();
  });

  it("shows complete 2K as ready", () => {
    render(
      <MemoryRouter>
        <SeasonChecklistMatrix
          characters={[
            buildCharacter({
              twoKRio: {
                key: "rating-2000",
                title: "2K Mythic+ rating",
                state: "COMPLETE",
                label: "✓",
                detail: "done",
                actionLabel: null
              },
              goalsOpen: 0,
              goalsComplete: 1,
              action: null
            })
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("✓").length).toBeGreaterThanOrEqual(2);
  });
});
