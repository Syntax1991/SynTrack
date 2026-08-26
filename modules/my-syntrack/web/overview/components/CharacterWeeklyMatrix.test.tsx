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

  it("renders the compact summary line instead of KPI cards", () => {
    renderMatrix([buildCharacter()]);

    expect(
      screen.getByText(
        "2 characters · 1 attention · 0 ready · Reset in 6d 8h"
      )
    ).toBeInTheDocument();
  });

  it("keeps a character's Gear status inside their own row, never bleeding into another character's row", () => {
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

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);
    const synbloomRow = within(rows[2]!);

    expect(
      synblastRow.getByTitle("2 missing enchants")
    ).toBeInTheDocument();

    expect(
      synbloomRow.queryByTitle("2 missing enchants")
    ).not.toBeInTheDocument();

    expect(
      synbloomRow.getByTitle("Gear ready, no known issues")
    ).toBeInTheDocument();
  });

  it("renders Unknown Vault state as a distinct token from Not-tracked Professions/Gear, never as 'Ready'", () => {
    renderMatrix([buildCharacter()]);

    const rows = screen.getAllByRole("row");
    const dataRow = within(rows[1]!);

    expect(
      dataRow.getByTitle(
        "Vault state unknown - no runs logged this period yet, or this character doesn't use the feature"
      )
    ).toHaveTextContent("?");

    expect(
      dataRow.getAllByTitle("Professions not tracked")[0]
    ).toHaveTextContent("—");

    expect(
      dataRow.queryByTitle("Professions tracked, no known issues")
    ).not.toBeInTheDocument();

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
            detail: "2 missing enchants",
            path: "/gear-readiness"
          }
        ],
        nextAction: {
          domain: "gear",
          label: "Gear needs attention",
          detail: "2 missing enchants",
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

  it("mutes the generic 'weekly tasks remaining' next action instead of repeating it prominently on every row", () => {
    renderMatrix([
      buildCharacter({
        nextAction: {
          domain: "weekly",
          label: "Weekly tasks remaining",
          detail: "2 of 5 tasks left",
          path: "/weekly-checklist",
          severity: "this-week"
        },
        readinessState: "attention"
      })
    ]);

    expect(
      screen.getByRole("link", {
        name: "Weekly tasks remaining"
      })
    ).toHaveClass("overview-next-action", "muted");
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
