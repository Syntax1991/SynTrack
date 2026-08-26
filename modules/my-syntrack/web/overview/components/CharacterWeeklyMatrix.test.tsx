import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { CharacterWeeklyState } from "../types/overview.types";
import { CharacterWeeklyMatrix } from "./CharacterWeeklyMatrix";

function buildCharacter(
  overrides: Partial<CharacterWeeklyState> = {}
): CharacterWeeklyState {
  return {
    character: {
      id: "char-1",
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      className: "Shaman",
      level: 80
    },
    weekly: {
      state: "IN_PROGRESS",
      completed: 3,
      total: 5,
      source: "MANUAL_CHECKLIST"
    },
    vault: {
      state: "UNKNOWN",
      unlockedSlots: 0,
      slotsTotal: 3,
      highestKeyLevel: null,
      source: "MANUAL_LOG"
    },
    professions: {
      state: "NOT_TRACKED",
      issueCount: 0,
      issues: []
    },
    gear: {
      state: "NOT_TRACKED",
      readinessPercent: null,
      trackedSlots: 0,
      totalRelevantSlots: 16,
      missingEnchantCount: 0,
      emptySocketCount: 0,
      itemLevel: null
    },
    tier: { state: "NOT_TRACKED" },
    embellishments: {
      state: "NOT_TRACKED"
    },
    attentionItems: [],
    readinessState: "unknown",
    nextAction: null,
    ...overrides
  };
}

function renderMatrix(
  characters: CharacterWeeklyState[]
) {
  return render(
    <MemoryRouter>
      <CharacterWeeklyMatrix
        characters={characters}
      />
    </MemoryRouter>
  );
}

describe("CharacterWeeklyMatrix", () => {
  it("renders exactly one row per character", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-1",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80
        }
      }),
      buildCharacter({
        character: {
          id: "char-2",
          name: "Synbloom",
          realm: "Antonidas",
          region: "eu",
          className: "Druid",
          level: 80
        }
      })
    ]);

    expect(
      screen.getAllByRole("row")
    ).toHaveLength(3);

    expect(
      screen.getByText("Synblast")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Synbloom")
    ).toBeInTheDocument();
  });

  it("keeps a character's Weekly/Vault/Professions/Gear statuses inside their own row, never bleeding into another character's row", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-1",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80
        },
        gear: {
          state: "ATTENTION",
          readinessPercent: 40,
          trackedSlots: 3,
          totalRelevantSlots: 16,
          missingEnchantCount: 2,
          emptySocketCount: 0,
          itemLevel: 650
        }
      }),
      buildCharacter({
        character: {
          id: "char-2",
          name: "Synbloom",
          realm: "Antonidas",
          region: "eu",
          className: "Druid",
          level: 80
        },
        gear: {
          state: "READY",
          readinessPercent: 100,
          trackedSlots: 5,
          totalRelevantSlots: 16,
          missingEnchantCount: 0,
          emptySocketCount: 0,
          itemLevel: 660
        }
      })
    ]);

    const rows =
      screen.getAllByRole("row");

    const synblastRow = within(
      rows[1]!
    );

    const synbloomRow = within(
      rows[2]!
    );

    expect(
      synblastRow.getByText(
        "2 issues"
      )
    ).toBeInTheDocument();

    expect(
      synbloomRow.queryByText(
        "2 issues"
      )
    ).not.toBeInTheDocument();

    expect(
      synbloomRow.getByText(
        "Ready"
      )
    ).toBeInTheDocument();
  });

  it("renders Unknown and Not tracked states explicitly rather than omitting the cell", () => {
    renderMatrix([buildCharacter()]);

    expect(
      screen.getByText(
        "No runs logged"
      )
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(
        "Not tracked"
      ).length
    ).toBeGreaterThan(0);
  });

  it("never renders Ready for a domain that is actually NOT_TRACKED/UNKNOWN fixture data", () => {
    renderMatrix([buildCharacter()]);

    const rows =
      screen.getAllByRole("row");

    const dataRow = within(rows[1]!);

    expect(
      dataRow.queryByText("Ready")
    ).not.toBeInTheDocument();
  });

  it("links the next action and domain status cells to the real existing domain routes", () => {
    renderMatrix([
      buildCharacter({
        attentionItems: [
          {
            id: "char-1:gear",
            characterId: "char-1",
            characterName:
              "Synblast",
            domain: "gear",
            severity: "this-week",
            label:
              "Gear needs attention",
            detail:
              "2 missing enchants",
            path: "/gear-readiness"
          }
        ],
        nextAction: {
          domain: "gear",
          label:
            "Gear needs attention",
          detail:
            "2 missing enchants",
          path: "/gear-readiness",
          severity: "this-week"
        },
        readinessState: "attention"
      })
    ]);

    expect(
      screen.getByRole("link", {
        name: "Gear needs attention"
      })
    ).toHaveAttribute(
      "href",
      "/gear-readiness"
    );
  });

  it("renders the real item level once Gear has tracked slots, and Set/Embellish honestly as Not tracked (no data source exists yet)", () => {
    renderMatrix([
      buildCharacter({
        gear: {
          state: "READY",
          readinessPercent: 100,
          trackedSlots: 5,
          totalRelevantSlots: 16,
          missingEnchantCount: 0,
          emptySocketCount: 0,
          itemLevel: 723
        },
        readinessState: "ready"
      })
    ]);

    expect(
      screen.getByText("723")
    ).toBeInTheDocument();

    const rows =
      screen.getAllByRole("row");

    const dataRow = within(rows[1]!);

    expect(
      dataRow.getAllByText(
        "Not tracked"
      ).length
    ).toBeGreaterThanOrEqual(2);
  });

  it("filters out ready characters when the Attention filter is active, without hiding characters that actually need attention", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-1",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80
        },
        readinessState: "attention",
        attentionItems: [
          {
            id: "char-1:gear",
            characterId: "char-1",
            characterName:
              "Synblast",
            domain: "gear",
            severity: "this-week",
            label:
              "Gear needs attention",
            detail: null,
            path: "/gear-readiness"
          }
        ]
      }),
      buildCharacter({
        character: {
          id: "char-2",
          name: "Synbloom",
          realm: "Antonidas",
          region: "eu",
          className: "Druid",
          level: 80
        },
        readinessState: "ready"
      })
    ]);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Attention"
      })
    );

    expect(
      screen.getByText("Synblast")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Synbloom")
    ).not.toBeInTheDocument();
  });
});
