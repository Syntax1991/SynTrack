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
    mythicPlus: {
      key: "rating-2000",
      title: "Mythic+ rating",
      state: "INCOMPLETE",
      label: "1847 → 2K",
      detail: "Current score 1847",
      actionLabel: "Reach 2K Mythic+ rating"
    },
    portals: {
      key: "portals",
      title: "Portals",
      state: "INCOMPLETE",
      label: "5/8",
      detail: "Portals",
      actionLabel: "Earn remaining dungeon portals"
    },
    catalyst: {
      key: "serpent-scion",
      title: "Catalyst",
      state: "COMPLETE",
      label: "✓",
      detail: "Catalyst",
      actionLabel: null
    },
    cracked: {
      key: "cracked-keystone",
      title: "Cracked",
      state: "UNKNOWN",
      label: "?",
      detail: "Cracked",
      actionLabel: null
    },
    nemesis: {
      key: "nemesis-aztarec",
      title: "Nemesis",
      state: "INCOMPLETE",
      label: "open",
      detail: "Nemesis",
      actionLabel: "Complete Nemesis"
    },
    raid: {
      key: "raid",
      title: "Raid",
      state: "INCOMPLETE",
      label: "AOTC open",
      detail: "Raid",
      actionLabel: "Earn AOTC"
    },
    goalsOpen: 1,
    goalsComplete: 0,
    goalsUnknown: 0,
    action: "Reach 2K Mythic+ rating",
    ...overrides
  };
}

describe("SeasonChecklistMatrix", () => {
  it("renders all seasonal evidence columns without weekly Profession", () => {
    const { container } = render(
      <MemoryRouter>
        <SeasonChecklistMatrix characters={[buildCharacter()]} />
      </MemoryRouter>
    );

    expect(screen.getByText("M+")).toBeInTheDocument();
    expect(screen.getByText("Portals")).toBeInTheDocument();
    expect(screen.getByText("Catalyst")).toBeInTheDocument();
    expect(screen.getByText("Cracked")).toBeInTheDocument();
    expect(screen.getByText("Nemesis")).toBeInTheDocument();
    expect(screen.getByText("Raid")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("1847 → 2K")).toBeInTheDocument();
    expect(screen.getByText("Reach 2K Mythic+ rating")).toBeInTheDocument();
    expect(container.querySelector(".season-col-action")).not.toBeNull();
    expect(container.querySelector(".season-matrix")).not.toBeNull();
    expect(screen.queryByText("Prof.")).not.toBeInTheDocument();
    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.queryByText("META")).not.toBeInTheDocument();
    expect(screen.queryByText("Vault")).not.toBeInTheDocument();
    expect(screen.queryByText("Capture Pending")).not.toBeInTheDocument();
  });

  it("shows complete M+ milestone as ready", () => {
    render(
      <MemoryRouter>
        <SeasonChecklistMatrix
          characters={[
            buildCharacter({
              mythicPlus: {
                key: "rating-2000",
                title: "Mythic+ rating",
                state: "COMPLETE",
                label: "✓ 2K",
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

    expect(screen.getByText("✓ 2K")).toBeInTheDocument();
  });
});
