import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderMatrix
} from "./characterWeeklyMatrixTestHelpers";

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

  it("links each character name to the canonical Character Detail route", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-7",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80
        }
      })
    ]);

    expect(
      screen.getByRole("link", {
        name: "Synblast"
      })
    ).toHaveAttribute(
      "href",
      "/characters/char-7"
    );
  });

  it("renders the compact summary line instead of KPI cards", () => {
    renderMatrix([buildCharacter()]);

    expect(
      screen.getByText(
        "2 characters · 1 attention · 0 ready · Reset in 6d 8h"
      )
    ).toBeInTheDocument();
  });

  it("keeps each character's iLvl in their own row after Gear column removal", () => {
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
          missingEnchantCount: 0,
          emptySocketCount: 2,
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

    expect(screen.queryByText("Gear")).not.toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);
    const synbloomRow = within(rows[2]!);

    expect(synblastRow.getByText("650")).toBeInTheDocument();
    expect(synbloomRow.queryByText("650")).not.toBeInTheDocument();
    expect(synbloomRow.getByText("660")).toBeInTheDocument();
    expect(synblastRow.queryByText("660")).not.toBeInTheDocument();
  });

  it("keeps Weeklies summary distinct from Prof. not-tracked tokens without a Gear column", () => {
    renderMatrix([buildCharacter()]);

    const rows = screen.getAllByRole("row");
    const dataRow = within(rows[1]!);

    expect(
      dataRow.getAllByTitle("No weekly state tracked")[0]
    ).toHaveTextContent("—");

    expect(
      dataRow.getAllByTitle("Profession setup")[0]
    ).toHaveTextContent("—");

    expect(screen.queryByText("Gear")).not.toBeInTheDocument();
    expect(
      dataRow.queryByTitle("Gear ready, no known issues")
    ).not.toBeInTheDocument();
  });

  it("links the next action cell to the real existing domain route", () => {
    renderMatrix([
      buildCharacter({
        attentionItems: [
          {
            id: "char-1:gear",
            characterId: "char-1",
            characterName: "Synblast",
            domain: "gear",
            severity: "this-week",
            label: "Gear needs attention",
            detail: "2 empty sockets",
            path: "/gear-readiness"
          }
        ],
        nextAction: {
          domain: "gear",
          label: "Gear needs attention",
          detail: "2 empty sockets",
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
    ).toHaveAttribute("href", "/gear-readiness");
  });

  it("renders precise next actions without muting them as generic weekly noise", () => {
    renderMatrix([
      buildCharacter({
        nextAction: {
          domain: "profession",
          label: "1 Alchemy Knowledge Treasure missing",
          detail: null,
          path: "/characters/char-1",
          severity: "this-week"
        },
        readinessState: "attention"
      })
    ]);

    expect(
      screen.getByRole("link", {
        name: "1 Alchemy Knowledge Treasure missing"
      })
    ).toHaveClass("overview-next-action");
  });

  it("renders the real item level once Gear has tracked slots, and Set/Embellish honestly as not-tracked (no data source exists yet)", () => {
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

    const rows = screen.getAllByRole("row");
    const dataRow = within(rows[1]!);

    expect(
      dataRow.getAllByTitle(
        "Set/Tier not tracked - no data source exists yet"
      ).length
    ).toBeGreaterThanOrEqual(1);

    expect(
      dataRow.getAllByTitle(
        "Embellishments not tracked - no data source exists yet"
      ).length
    ).toBeGreaterThanOrEqual(1);
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
            characterName: "Synblast",
            domain: "gear",
            severity: "this-week",
            label: "Gear needs attention",
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
      screen.getByRole("button", { name: "Attention" })
    );

    expect(
      screen.getByText("Synblast")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Synbloom")
    ).not.toBeInTheDocument();
  });
});
