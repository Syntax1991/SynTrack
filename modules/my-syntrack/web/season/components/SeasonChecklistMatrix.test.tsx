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
    tier: {
      key: "tier-4pc",
      title: "Current-season 4pc Tier Set",
      state: "COMPLETE",
      label: "✓ 4/4",
      detail: "Tier",
      actionLabel: null
    },
    embellishments: {
      key: "embellishments",
      title: "Embellishment setup",
      state: "COMPLETE",
      label: "✓ 2/2",
      detail: "Emb",
      actionLabel: null
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
      title: "Serpent Scion",
      state: "COMPLETE",
      label: "✓",
      detail: "Midnight Season 2: Serpent Scion",
      actionLabel: null
    },
    cracked: {
      key: "cracked-keystone",
      title: "Cracked Keystone",
      state: "UNKNOWN",
      label: "?",
      detail: "Complete the Season 2 Cracked Keystone quest",
      actionLabel: null
    },
    nemesis: {
      key: "nemesis-aztarec",
      title: "Azta'rec (Nemesis)",
      state: "INCOMPLETE",
      label: "open",
      detail: "Defeat Azta'rec on ??",
      actionLabel: "Defeat Azta'rec on ??"
    },
    raid: {
      key: "raid",
      title: "Raid",
      state: "INCOMPLETE",
      label: "AOTC open",
      detail: "Raid",
      actionLabel: "Earn AOTC: Ula'tek"
    },
    goalsOpen: 1,
    goalsComplete: 0,
    goalsUnknown: 0,
    action: "Reach 2K Mythic+ rating",
    ...overrides
  };
}

describe("SeasonChecklistMatrix", () => {
  it("renders Status column and seasonal evidence without weekly Profession", () => {
    const { container } = render(
      <MemoryRouter>
        <SeasonChecklistMatrix characters={[buildCharacter()]} />
      </MemoryRouter>
    );

    expect(screen.getByText("M+")).toBeInTheDocument();
    expect(screen.getByText("Tier")).toBeInTheDocument();
    expect(screen.getByText("Emb.")).toBeInTheDocument();
    expect(screen.getByText("Portals")).toBeInTheDocument();
    expect(screen.getByText("Catalyst")).toBeInTheDocument();
    expect(screen.getByText("Cracked")).toBeInTheDocument();
    expect(screen.getByText("Nemesis")).toBeInTheDocument();
    expect(screen.getByText("Raid")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.queryByText("Open")).not.toBeInTheDocument();
    expect(screen.getByText("1847 → 2K")).toBeInTheDocument();
    expect(screen.getByText("Reach 2K Mythic+ rating")).toBeInTheDocument();
    expect(container.querySelector(".season-col-action")).not.toBeNull();
    expect(container.querySelector(".season-col-status")).not.toBeNull();
    expect(screen.queryByText("Prof.")).not.toBeInTheDocument();
    expect(screen.queryByText("Capture Pending")).not.toBeInTheDocument();
  });

  it("shows unknown status and ? action when only unresolved goals remain", () => {
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
              tier: {
                key: "tier-4pc",
                title: "Tier",
                state: "UNKNOWN",
                label: "?",
                detail: "Tier",
                actionLabel: null
              },
              embellishments: {
                key: "embellishments",
                title: "Emb",
                state: "UNKNOWN",
                label: "?",
                detail: "Emb",
                actionLabel: null
              },
              portals: {
                key: "portals",
                title: "Portals",
                state: "UNKNOWN",
                label: "?",
                detail: "Portals",
                actionLabel: null
              },
              catalyst: {
                key: "serpent-scion",
                title: "Serpent Scion",
                state: "UNKNOWN",
                label: "?",
                detail: "Catalyst",
                actionLabel: null
              },
              cracked: {
                key: "cracked-keystone",
                title: "Cracked Keystone",
                state: "UNKNOWN",
                label: "?",
                detail: "Cracked",
                actionLabel: null
              },
              nemesis: {
                key: "nemesis-aztarec",
                title: "Nemesis",
                state: "UNKNOWN",
                label: "?",
                detail: "Nemesis",
                actionLabel: null
              },
              raid: {
                key: "raid",
                title: "Raid",
                state: "UNKNOWN",
                label: "?",
                detail: "Raid",
                actionLabel: null
              },
              goalsOpen: 0,
              goalsComplete: 1,
              goalsUnknown: 7,
              action: null
            })
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("7 unknown")).toBeInTheDocument();
    expect(screen.queryByText("5?")).not.toBeInTheDocument();
    expect(screen.getByTitle("Some Season goals are unresolved")).toHaveTextContent(
      "?"
    );
    expect(screen.queryByText("✓", { selector: ".ready" })).not.toBeInTheDocument();
  });
});
